var ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
let currentUserUid = null;
let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;
let bmDragState = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("🔍 [Bookmark] DOMContentLoaded 발생");
    firebase.auth().onAuthStateChanged((user) => {
        currentUserUid = user ? user.uid : null;
        console.log("🔍 [Bookmark] Auth 상태 변경:", currentUserUid);
    });
});

document.addEventListener('componentsLoaded', () => {
    console.log("🔍 [Bookmark] componentsLoaded 이벤트 수신");
    const nameInput = document.getElementById('bm_input_name');
    const urlInput = document.getElementById('bm_input_url');
    
    const handleEnter = (e) => {
        if (e.key === 'Enter') window.saveNewLink();
    };

    if (nameInput) nameInput.addEventListener('keyup', handleEnter);
    if (urlInput) urlInput.addEventListener('keyup', handleEnter);

    window.initSharedBookmarks();
});

window.initSharedBookmarks = () => {
    console.log("🔍 [Bookmark] Firebase 데이터 구독 시작");
    const bmRef = firebase.database().ref('shared_bookmarks');
    bmRef.on('value', (snapshot) => {
        let data = snapshot.val();
        console.log("🔍 [Bookmark] Firebase 원본 데이터 수신:", data);
        if (!data) data = [];

        const newDataStr = JSON.stringify(data);
        if (window._prevBmStr === newDataStr) {
            console.log("🔍 [Bookmark] 데이터 변경 없음 (렌더링 스킵)");
            return;
        }
        window._prevBmStr = newDataStr;

        bookmarks = Array.isArray(data) ? data : Object.values(data);
        bookmarks = bookmarks.map(f => ({
            ...f,
            parentId: f.parentId || null,
            links: f.links ? (Array.isArray(f.links) ? f.links : Object.values(f.links)) : []
        }));

        if (!currentFolderId && bookmarks.length > 0) {
            currentFolderId = bookmarks[0].id;
            console.log("🔍 [Bookmark] 기본 폴더 설정:", currentFolderId);
        } else if (bookmarks.length === 0) {
            currentFolderId = null;
        }
        
        window.renderBookmarks();
    });
};

window.saveBookmarksToFirebase = () => {
    firebase.database().ref('shared_bookmarks').set(bookmarks).catch(err => {
        console.error("❌ [Bookmark] Firebase 저장 실패:", err);
        if (typeof window.showToast === 'function') window.showToast("❌ 데이터 저장에 실패했습니다.");
    });
};

window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const buildFolderDOM = (folder, level) => {
    const div = document.createElement('div');
    div.className = `bm-folder ${folder.id === currentFolderId ? 'active' : ''}`;
    div.draggable = true;
    div.style.paddingLeft = `${level * 15}px`;

    const deleteFolderBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.deleteFolder('${folder.id}')">🗑️</button>` : '';
    
    const prefix = level > 0 ? `<span style="color:#a1a1a6; margin-right:5px;">┗</span>` : '';
    
    div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> 
                     <span class="bm-folder-name" style="display:flex; align-items:center;">${prefix}${window.escapeHTML(folder.name)}</span>
                     <div class="bm-actions">
                         <button class="bm-btn-icon" onclick="event.stopPropagation(); window.editFolder('${folder.id}')">✏️</button>
                         ${deleteFolderBtn}
                     </div>`;
    
    div.onclick = (e) => { 
        e.stopPropagation();
        currentFolderId = folder.id; 
        window.renderBookmarks(); 
    };
    
    div.ondragstart = (e) => { 
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', 'folder'); 
        bmDragState = { type: 'folder', id: folder.id };
        div.classList.add('dragging'); 
    };
    
    div.ondragend = () => { 
        div.classList.remove('dragging'); 
        bmDragState = null; 
    };
    
    div.ondragover = (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        if (!bmDragState) return;
        div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        
        if (bmDragState.type === 'link') {
            if (bmDragState.sourceFid !== folder.id) div.classList.add('drag-over');
        } else if (bmDragState.type === 'folder' && bmDragState.id !== folder.id) {
            const bounding = div.getBoundingClientRect();
            const y = e.clientY - bounding.top;
            if (y < bounding.height * 0.25) {
                div.classList.add('drag-over-top');
            } else if (y > bounding.height * 0.75) {
                div.classList.add('drag-over-bottom');
            } else {
                div.classList.add('drag-over');
            }
        }
    };
    
    div.ondragleave = () => { 
        div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom'); 
    };
    
    div.ondrop = (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        const isTop = div.classList.contains('drag-over-top');
        const isCenter = div.classList.contains('drag-over');
        div.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        if (!bmDragState) return;
        
        if (bmDragState.type === 'folder') {
            const draggedFolderId = bmDragState.id;
            const targetFolderId = folder.id;
            if (draggedFolderId === targetFolderId) return;

            let isDescendant = false;
            let curr = targetFolderId;
            while(curr) {
                if (curr === draggedFolderId) { isDescendant = true; break; }
                const parent = bookmarks.find(x => x.id === curr);
                curr = parent ? parent.parentId : null;
            }

            if (isDescendant) {
                if (typeof window.showToast === 'function') window.showToast("❌ 자기 자신이나 하위 폴더 안으로는 이동할 수 없습니다.");
                return;
            }

            const fromIdx = bookmarks.findIndex(bf => bf.id === draggedFolderId);
            if (fromIdx !== -1) {
                const item = bookmarks.splice(fromIdx, 1)[0];
                
                if (isCenter) {
                    item.parentId = targetFolderId;
                    bookmarks.push(item);
                } else {
                    item.parentId = folder.parentId || null;
                    const newToIdx = bookmarks.findIndex(bf => bf.id === targetFolderId);
                    const insertIdx = isTop ? newToIdx : newToIdx + 1;
                    bookmarks.splice(insertIdx, 0, item);
                }
                window.saveBookmarksToFirebase();
                window.renderBookmarks();
            }
        } else if (bmDragState.type === 'link') {
            if (bmDragState.sourceFid !== folder.id) {
                const sourceFolder = bookmarks.find(f => f.id === bmDragState.sourceFid);
                if (sourceFolder) {
                    const linkIndex = sourceFolder.links.findIndex(link => link.id === bmDragState.lId);
                    if (linkIndex !== -1) {
                        const movingLink = sourceFolder.links.splice(linkIndex, 1)[0];
                        folder.links.push(movingLink);
                        window.saveBookmarksToFirebase();
                        window.renderBookmarks();
                        if (typeof window.showToast === 'function') window.showToast(`📍 이동 완료`);
                    }
                }
            }
        }
    };
    return div;
};

window.renderBookmarks = () => {
    console.log("🔍 [Bookmark] 렌더링 시작");
    const fList = document.getElementById('bm_folder_list');
    const lList = document.getElementById('bm_link_list');
    const titleText = document.getElementById('bm_current_folder_title');
    
    if (!fList || !lList) {
        console.warn("⚠️ [Bookmark] 렌더링 실패: DOM 요소를 찾을 수 없음 (fList 또는 lList)");
        return;
    }

    fList.innerHTML = '';
    lList.innerHTML = '';

    const folderFragment = document.createDocumentFragment();

    const renderFolderTree = (parentId, level) => {
        const children = bookmarks.filter(f => (f.parentId || null) === parentId);
        children.forEach(child => {
            const folderEl = buildFolderDOM(child, level);
            folderFragment.appendChild(folderEl);
            renderFolderTree(child.id, level + 1);
        });
    };

    renderFolderTree(null, 0);
    fList.appendChild(folderFragment);

    const activeF = bookmarks.find(f => f.id === currentFolderId);
    if (activeF) {
        console.log("🔍 [Bookmark] 선택된 폴더 렌더링:", activeF.name);
        titleText.textContent = `📂 ${activeF.name}`;
        const linkFragment = document.createDocumentFragment();
        activeF.links.forEach((l) => {
            const card = document.createElement('div');
            card.className = 'bm-link-card';
            card.draggable = true;
            card.onclick = () => window.open(l.url, '_blank');
            const deleteLinkBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.deleteLink('${activeF.id}', '${l.id}')">🗑️</button>` : '';
            card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                             <div class="bm-link-info"><b>${window.escapeHTML(l.name)}</b><small>${window.escapeHTML(l.url)}</small></div>
                             <div class="bm-actions" onclick="event.stopPropagation()">
                                <button class="bm-btn-icon" onclick="window.openEditForm('${l.id}')">✏️</button>
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
                        window.saveBookmarksToFirebase();
                        window.renderBookmarks();
                    }
                }
            };
            linkFragment.appendChild(card);
        });
        lList.appendChild(linkFragment);
    } else {
        console.log("🔍 [Bookmark] 선택된 폴더 없음");
        titleText.textContent = `📂 폴더를 선택하세요`;
    }
};

window.addNewFolder = () => {
    const name = prompt('새 폴더 이름:');
    if (!name) return;

    let parentId = null;
    if (currentFolderId) {
        const currentFolder = bookmarks.find(f => f.id === currentFolderId);
        if (currentFolder) {
            const makeSubFolder = confirm(`[${currentFolder.name}] 폴더의 하위 폴더로 만드시겠습니까?\n(취소 클릭 시 최상위 폴더로 생성됩니다)`);
            if (makeSubFolder) parentId = currentFolderId;
        }
    }

    bookmarks.push({ id: 'f_'+Date.now(), name: name.trim(), parentId: parentId, links: [] }); 
    window.saveBookmarksToFirebase(); 
};

window.editFolder = (id) => {
    const f = bookmarks.find(x => x.id === id);
    if (!f) return;
    const n = prompt('폴더 이름 수정:', f.name);
    if (n) { 
        f.name = n.trim(); 
        window.saveBookmarksToFirebase(); 
    }
};

window.deleteFolder = (id) => {
    if (currentUserUid !== ADMIN_UID) return;
    if (confirm('폴더를 삭제하시겠습니까?\n(폴더 내부의 모든 링크와 하위 폴더가 함께 삭제됩니다)')) { 
        const idsToDelete = [id];
        let i = 0;
        while(i < idsToDelete.length) {
            const currentId = idsToDelete[i];
            const children = bookmarks.filter(x => x.parentId === currentId).map(x => x.id);
            idsToDelete.push(...children);
            i++;
        }
        bookmarks = bookmarks.filter(x => !idsToDelete.includes(x.id)); 
        if (idsToDelete.includes(currentFolderId)) currentFolderId = null;
        window.saveBookmarksToFirebase(); 
        window.renderBookmarks();
    }
};

window.toggleAddForm = (s) => { 
    const form = document.getElementById('bm_add_form');
    if (form) {
        if (s) {
            form.classList.remove('d-none');
            form.classList.add('active');
        } else {
            form.classList.add('d-none');
            form.classList.remove('active');
        }
    }
    if (!s) editingLinkId = null;
};

window.openAddForm = () => { 
    editingLinkId = null; 
    const title = document.getElementById('bm_form_title');
    if (title) title.textContent = "🔗 링크 추가"; 
    document.getElementById('bm_input_name').value = '';
    document.getElementById('bm_input_url').value = '';
    window.toggleAddForm(true); 
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
    window.toggleAddForm(true);
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
    if (!f) {
        if (typeof window.showToast === 'function') window.showToast("❌ 링크를 추가할 폴더를 먼저 선택하세요.");
        return;
    }
    
    if (editingLinkId) {
        const l = f.links.find(x => x.id === editingLinkId);
        if (l) { l.name = rawN; l.url = rawU; }
    } else {
        f.links.push({ id: 'l_'+Date.now(), name: rawN, url: rawU });
    }
    window.saveBookmarksToFirebase(); 
    window.toggleAddForm(false);
};

window.deleteLink = (fid, lid) => {
    if (currentUserUid !== ADMIN_UID) return;
    if (confirm('이 링크를 삭제하시겠습니까?')) {
        const f = bookmarks.find(x => x.id === fid);
        if (f) {
            f.links = f.links.filter(x => x.id !== lid);
            window.saveBookmarksToFirebase();
        }
    }
};
