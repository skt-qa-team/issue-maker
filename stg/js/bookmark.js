var ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
let currentUserUid = null;
let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;
let bmDragState = null; // 드래그 상태를 추적하기 위한 전역 변수

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) currentUserUid = user.uid;
        else currentUserUid = null;
    });

    const loadBookmarkComponent = async () => {
        try {
            const response = await fetch('components/bookmark-modal.html');
            const html = await response.text();
            const placeholder = document.getElementById('modal-placeholder-bookmark');
            if (placeholder) {
                placeholder.innerHTML = html;
                
                const handleEnter = (e) => {
                    if (e.key === 'Enter') saveNewLink();
                };
                document.getElementById('bm_input_name').addEventListener('keyup', handleEnter);
                document.getElementById('bm_input_url').addEventListener('keyup', handleEnter);
            }
            initSharedBookmarks();
        } catch (error) {
            console.error('Bookmark modal failed to load:', error);
        }
    };

    loadBookmarkComponent();

    const injectButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.bm-btn-wrapper')) {
            clearInterval(injectButton);
            
            const wrapper = document.createElement('div');
            wrapper.className = 'menu-item-wrapper bm-btn-wrapper';
            wrapper.onclick = openBookmarkModal;
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'setting-btn-float bm-icon';
            iconDiv.innerHTML = '🔖';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'menu-label';
            labelSpan.innerText = "북마크";

            wrapper.appendChild(iconDiv);
            wrapper.appendChild(labelSpan);
            
            topBarBtns.prepend(wrapper);
        }
    }, 100);
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
    const bmRef = firebase.database().ref('shared_bookmarks');
    bmRef.transaction((currentData) => {
        if (currentData === null) {
            return bookmarks;
        }
        return bookmarks;
    });
}

window.openBookmarkModal = () => {
    const modal = document.getElementById('bookmarkModal');
    if (modal) {
        modal.style.display = 'flex';
        renderBookmarks();
    }
};

window.closeBookmarkModal = () => {
    const modal = document.getElementById('bookmarkModal');
    if (modal) modal.style.display = 'none';
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
    
    if (!fList || !lList || !modal || modal.style.display === 'none') return;

    fList.innerHTML = '';
    lList.innerHTML = '';

    const folderFragment = document.createDocumentFragment();

    bookmarks.forEach((f, idx) => {
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
        
        // --- 📂 폴더 드래그 앤 드롭 ---
        div.ondragstart = (e) => { 
            // 💡 수정된 부분: 브라우저가 드래그를 인식하도록 빈 데이터라도 세팅해야 함
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
                            if (typeof showToast === 'function') showToast(`[${escapeHTML(movingLink.name)}] ➡️ ${escapeHTML(f.name)} 이동 완료`);
                        }
                    }
                }
            }
        };
        folderFragment.appendChild(div);
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'bm-btn-add-folder';
    addFolderBtn.innerHTML = "+ 새 폴더 추가";
    addFolderBtn.onclick = addNewFolder;
    folderFragment.appendChild(addFolderBtn);

    fList.appendChild(folderFragment);

    const activeF = bookmarks.find(f => f.id === currentFolderId);
    if (activeF) {
        titleText.innerHTML = `📂 ${escapeHTML(activeF.name)}`;
        const linkFragment = document.createDocumentFragment();
        
        activeF.links.forEach((l, lIdx) => {
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
                             
            // --- 🔗 링크 드래그 앤 드롭 ---
            card.ondragstart = (e) => { 
                e.stopPropagation();
                // 💡 수정된 부분: 브라우저가 드래그를 인식하도록 세팅
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
                    }
                }
            };
            linkFragment.appendChild(card);
        });
        lList.appendChild(linkFragment);
    } else {
        titleText.innerHTML = `📂 폴더를 선택하세요`;
    }
}

window.addNewFolder = () => {
    const name = prompt('새 폴더 이름:');
    if (name) { 
        const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        bookmarks.push({ id: 'f_'+Date.now(), name: safeName, links: [] }); 
        saveBookmarksToFirebase(); 
    }
};

window.editFolder = (id) => {
    const f = bookmarks.find(x => x.id === id);
    if (!f) return;
    const n = prompt('폴더 이름 수정:', f.name);
    if (n) { 
        f.name = n.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
        saveBookmarksToFirebase(); 
    }
};

window.deleteFolder = (id) => {
    if (currentUserUid !== ADMIN_UID) {
        alert("삭제 권한이 없습니다.");
        return;
    }
    if (confirm('폴더를 삭제하시겠습니까?')) { 
        bookmarks = bookmarks.filter(x => x.id !== id); 
        saveBookmarksToFirebase(); 
    }
};

window.toggleAddForm = (s) => { 
    const form = document.getElementById('bm_add_form');
    if (form) form.style.display = s ? 'flex' : 'none';
    if (!s) editingLinkId = null;
};

window.openAddForm = () => { 
    editingLinkId = null; 
    const title = document.getElementById('bm_form_title');
    if (title) title.innerText = "🔗 링크 추가"; 
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
    if (title) title.innerText = "✏️ 링크 수정";
    document.getElementById('bm_input_name').value = l.name;
    document.getElementById('bm_input_url').value = l.url;
    toggleAddForm(true);
    setTimeout(() => document.getElementById('bm_input_name').focus(), 50);
};

window.saveNewLink = () => {
    const rawN = document.getElementById('bm_input_name').value.trim();
    let rawU = document.getElementById('bm_input_url').value.trim();
    if (!rawN || !rawU) return;
    
    const n = rawN.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let u = rawU.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    
    const f = bookmarks.find(x => x.id === currentFolderId);
    if (!f) return;
    if (editingLinkId) {
        const l = f.links.find(x => x.id === editingLinkId);
        if (l) { l.name = n; l.url = u; }
    } else {
        f.links.push({ id: 'l_'+Date.now(), name: n, url: u });
    }
    saveBookmarksToFirebase(); 
    toggleAddForm(false);
};

window.deleteLink = (fid, lid) => {
    if (currentUserUid !== ADMIN_UID) {
        alert("삭제 권한이 없습니다.");
        return;
    }
    if (confirm('이 링크를 삭제하시겠습니까?')) {
        const f = bookmarks.find(x => x.id === fid);
        if (f) {
            f.links = f.links.filter(x => x.id !== lid);
            saveBookmarksToFirebase();
        }
    }
};
