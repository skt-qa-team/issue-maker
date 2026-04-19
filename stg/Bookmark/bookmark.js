var ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
let currentUserUid = null;
let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;
let bmDragState = null;

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        currentUserUid = user ? user.uid : null;
    });

    const loadBookmarkComponent = async () => {
        try {
            const response = await fetch('components/bookmark-modal.html');
            const html = await response.text();
            const placeholder = document.getElementById('bookmark-modal-placeholder');
            if (placeholder) {
                placeholder.innerHTML = html;
                const handleEnter = (e) => {
                    if (e.key === 'Enter') saveNewLink();
                };
                const nameInput = document.getElementById('bm_input_name');
                const urlInput = document.getElementById('bm_input_url');
                if (nameInput) nameInput.addEventListener('keyup', handleEnter);
                if (urlInput) urlInput.addEventListener('keyup', handleEnter);
            }
            initSharedBookmarks();
        } catch (error) {
            console.error('Bookmark modal failed to load:', error);
        }
    };

    loadBookmarkComponent();
});

function initSharedBookmarks() {
    const bmRef = firebase.database().ref('shared_bookmarks');
    bmRef.on('value', (snapshot) => {
        let data = snapshot.val();
        if (!data) data = [];

        const newDataStr = JSON.stringify(data);
        if (window._prevBmStr === newDataStr) return;
        window._prevBmStr = newDataStr;

        bookmarks = Array.isArray(data) ? data : Object.values(data);
        bookmarks = bookmarks.map(f => ({
            ...f,
            links: f.links ? (Array.isArray(f.links) ? f.links : Object.values(f.links)) : []
        }));

        if (!currentFolderId && bookmarks.length > 0) {
            currentFolderId = bookmarks[0].id;
        } else if (bookmarks.length === 0) {
            currentFolderId = null;
        }
        
        renderBookmarks();
    });
}

function saveBookmarksToFirebase() {
    firebase.database().ref('shared_bookmarks').set(bookmarks).catch(err => {
        console.error("Firebase 저장 실패:", err);
        if (typeof showToast === 'function') showToast("❌ 데이터 저장에 실패했습니다.");
    });
}

window.openBookmarkModal = () => {
    const modal = document.getElementById('bookmarkModal');
    if (modal) {
        modal.classList.add('active');
        renderBookmarks();
    }
};

window.closeBookmarkModal = () => {
    const modal = document.getElementById('bookmarkModal');
    if (modal) modal.classList.remove('active');
};

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderBookmarks() {
    const fList = document.getElementById('bm_folder_list');
    const lList = document.getElementById('bm_link_list');
    const titleText = document.getElementById('bm_current_folder_title');
    const modal = document.getElementById('bookmarkModal');
    
    if (!fList || !lList || !modal || !modal.classList.contains('active')) return;

    fList.innerHTML = '';
    lList.innerHTML = '';

    const folderFragment = document.createDocumentFragment();

    bookmarks.forEach((f) => {
        const div = document.createElement('div');
        div.className = `bm-folder ${f.id === currentFolderId ? 'active' : ''}`;
        div.draggable = true;
        
        const deleteFolderBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteFolder('${f.id}')">🗑️</button>` : '';
        
        div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> <span class="bm-folder-name">${escapeHTML(f.name)}</span>
                        <div class="bm-actions">
                            <button class="bm-btn-icon" onclick="event.stopPropagation(); editFolder('${f.id}')">✏️</button>
                            ${deleteFolderBtn}
                        </div>`;
        div.onclick = () => { currentFolderId = f.id; renderBookmarks(); };
        
        div.ondragstart = (e) => { 
            e.dataTransfer.setData('text/plain', 'folder'); 
            bmDragState = { type: 'folder', id: f.id };
            div.classList.add('dragging'); 
        };
        div.ondragend = () => { 
            div.classList.remove('dragging'); 
            bmDragState = null; 
        };
        
        div.ondragover = (e) => { 
            e.preventDefault(); 
            if (!bmDragState) return;
            div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            if (bmDragState.type === 'link') {
                if (bmDragState.sourceFid !== f.id) div.classList.add('drag-over');
            } else if (bmDragState.type === 'folder' && bmDragState.id !== f.id) {
                const bounding = div.getBoundingClientRect();
                if (e.clientY - bounding.top < bounding.height / 2) {
                    div.classList.add('drag-over-top');
                } else {
                    div.classList.add('drag-over-bottom');
                }
            }
        };
        
        div.ondragleave = () => { 
            div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom'); 
        };
        
        div.ondrop = (e) => {
            e.preventDefault(); 
            const isTop = div.classList.contains('drag-over-top');
            div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            if (!bmDragState) return;
            if (bmDragState.type === 'folder') {
                const fromIdx = bookmarks.findIndex(bf => bf.id === bmDragState.id);
                const toIdx = bookmarks.findIndex(bf => bf.id === f.id);
                if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                    const item = bookmarks.splice(fromIdx, 1)[0];
                    const newToIdx = bookmarks.findIndex(bf => bf.id === f.id);
                    const insertIdx = isTop ? newToIdx : newToIdx + 1;
                    bookmarks.splice(insertIdx, 0, item);
                    saveBookmarksToFirebase();
                    renderBookmarks();
                }
            } else if (bmDragState.type === 'link') {
                if (bmDragState.sourceFid !== f.id) {
                    const sourceFolder = bookmarks.find(folder => folder.id === bmDragState.sourceFid);
                    if (sourceFolder) {
                        const linkIndex = sourceFolder.links.findIndex(link => link.id === bmDragState.lId);
                        if (linkIndex !== -1) {
                            const movingLink = sourceFolder.links.splice(linkIndex, 1)[0];
                            f.links.push(movingLink);
                            saveBookmarksToFirebase();
                            renderBookmarks();
                            if (typeof showToast === 'function') showToast(`📍 이동 완료`);
                        }
                    }
                }
            }
        };
        folderFragment.appendChild(div);
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'bm-btn-add-folder';
    addFolderBtn.textContent = "+ 새 폴더 추가";
    addFolderBtn.onclick = addNewFolder;
    folderFragment.appendChild(addFolderBtn);
    fList.appendChild(folderFragment);

    const activeF = bookmarks.find(f => f.id === currentFolderId);
    if (activeF) {
        titleText.textContent = `📂 ${activeF.name}`;
        const linkFragment = document.createDocumentFragment();
        activeF.links.forEach((l) => {
            const card = document.createElement('div');
            card.className = 'bm-link-card';
            card.draggable = true;
            card.onclick = () => window.open(l.url, '_blank');
            const deleteLinkBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteLink('${activeF.id}', '${l.id}')">🗑️</button>` : '';
            card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                             <div class="bm-link-info"><b>${escapeHTML(l.name)}</b><small>${escapeHTML(l.url)}</small></div>
                             <div class="bm-actions" onclick="event.stopPropagation()">
                                <button class="bm-btn-icon" onclick="openEditForm('${l.id}')">✏️</button>
                                ${deleteLinkBtn}
                             </div>`;
            card.ondragstart = (e) => { 
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', 'link'); 
                bmDragState = { type: 'link', sourceFid: activeF.id, lId: l.id };
                card.classList.add('dragging'); 
            };
            card.ondragend = () => { 
                card.classList.remove('dragging'); 
                bmDragState = null; 
            };
            card.ondragover = (e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                if (!bmDragState || bmDragState.type !== 'link' || bmDragState.sourceFid !== activeF.id || bmDragState.lId === l.id) return;
                card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
                const bounding = card.getBoundingClientRect();
                if (e.clientY - bounding.top < bounding.height / 2) {
                    card.classList.add('drag-over-top');
                } else {
                    card.classList.add('drag-over-bottom');
                }
            };
            card.ondragleave = () => { 
                card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom'); 
            };
            card.ondrop = (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                const isTop = card.classList.contains('drag-over-top');
                card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
                if (!bmDragState || bmDragState.type !== 'link') return;
                if (bmDragState.sourceFid === activeF.id) {
                    const fromIdx = activeF.links.findIndex(bl => bl.id === bmDragState.lId);
                    const toIdx = activeF.links.findIndex(bl => bl.id === l.id);
                    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                        const item = activeF.links.splice(fromIdx, 1)[0];
                        const newToIdx = activeF.links.findIndex(bl => bl.id === l.id);
                        const insertIdx = isTop ? newToIdx : newToIdx + 1;
                        activeF.links.splice(insertIdx, 0, item);
                        saveBookmarksToFirebase();
                        renderBookmarks();
                    }
                }
            };
            linkFragment.appendChild(card);
        });
        lList.appendChild(linkFragment);
    } else {
        titleText.textContent = `📂 폴더를 선택하세요`;
    }
}

window.addNewFolder = () => {
    const name = prompt('새 폴더 이름:');
    if (name) { 
        bookmarks.push({ id: 'f_'+Date.now(), name: name.trim(), links: [] }); 
        saveBookmarksToFirebase(); 
    }
};

window.editFolder = (id) => {
    const f = bookmarks.find(x => x.id === id);
    if (!f) return;
    const n = prompt('폴더 이름 수정:', f.name);
    if (n) { 
        f.name = n.trim(); 
        saveBookmarksToFirebase(); 
    }
};

window.deleteFolder = (id) => {
    if (currentUserUid !== ADMIN_UID) return;
    if (confirm('폴더를 삭제하시겠습니까?\n(폴더 내부의 모든 링크가 함께 삭제됩니다)')) { 
        bookmarks = bookmarks.filter(x => x.id !== id); 
        saveBookmarksToFirebase(); 
    }
};

window.toggleAddForm = (s) => { 
    const form = document.getElementById('bm_add_form');
    if (form) {
        if (s) form.classList.add('active');
        else form.classList.remove('active');
    }
    if (!s) editingLinkId = null;
};

window.openAddForm = () => { 
    editingLinkId = null; 
    const title = document.getElementById('bm_form_title');
    if (title) title.textContent = "🔗 링크 추가"; 
    document.getElementById('bm_input_name').value = '';
    document.getElementById('bm_input_url').value = '';
    toggleAddForm(true); 
    setTimeout(() => document.getElementById('bm_input_name').focus(), 50);
};

window.openEditForm = (id) => {
    const f = bookmarks.find(f => f.id === currentFolderId);
    if (!f) return;
    const l = f.links.find(x => x.id === id);
    if (!l) return;
    editingLinkId = id;
    const title = document.getElementById('bm_form_title');
    if (title) title.textContent = "✏️ 링크 수정";
    document.getElementById('bm_input_name').value = l.name;
    document.getElementById('bm_input_url').value = l.url;
    toggleAddForm(true);
    setTimeout(() => document.getElementById('bm_input_name').focus(), 50);
};

window.saveNewLink = () => {
    const nameEl = document.getElementById('bm_input_name');
    const urlEl = document.getElementById('bm_input_url');
    const rawN = nameEl.value.trim();
    let rawU = urlEl.value.trim();
    
    if (!rawN || !rawU) return;
    if (!/^https?:\/\//i.test(rawU)) rawU = 'https://' + rawU;
    
    const f = bookmarks.find(x => x.id === currentFolderId);
    if (!f) return;
    
    if (editingLinkId) {
        const l = f.links.find(x => x.id === editingLinkId);
        if (l) { l.name = rawN; l.url = rawU; }
    } else {
        f.links.push({ id: 'l_'+Date.now(), name: rawN, url: rawU });
    }
    saveBookmarksToFirebase(); 
    toggleAddForm(false);
};

window.deleteLink = (fid, lid) => {
    if (currentUserUid !== ADMIN_UID) return;
    if (confirm('이 링크를 삭제하시겠습니까?')) {
        const f = bookmarks.find(x => x.id === fid);
        if (f) {
            f.links = f.links.filter(x => x.id !== lid);
            saveBookmarksToFirebase();
        }
    }
};
