window.ADMIN_UID = window.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
let currentUserUid = null;
let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;
let bmDragState = null;
let isBookmarkDOMReady = false;

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                currentUserUid = user ? user.uid : null;
                if (isBookmarkDOMReady) window.renderBookmarks();
            });
        }
    } catch (e) {
        console.error("[Bookmark] Auth Init Error:", e);
    }
});

document.addEventListener('componentsLoaded', () => {
    try {
        isBookmarkDOMReady = true;
        
        const nameInput = document.getElementById('bm_input_name');
        const urlInput = document.getElementById('bm_input_url');
        
        const handleEnter = (e) => {
            if (e.key === 'Enter') window.saveNewLink();
        };

        if (nameInput) nameInput.addEventListener('keyup', handleEnter);
        if (urlInput) urlInput.addEventListener('keyup', handleEnter);

        window.initSharedBookmarks();
        window.renderBookmarks(); 
    } catch (e) {
        console.error("[Bookmark] Components Loaded Error:", e);
    }
});

window.initSharedBookmarks = () => {
    try {
        if (typeof firebase === 'undefined') return;
        const bmRef = firebase.database().ref('shared_bookmarks');
        
        bmRef.on('value', (snapshot) => {
            try {
                let data = snapshot.val();
                if (!data) data = [];

                const newDataStr = JSON.stringify(data);
                if (window._prevBmStr === newDataStr) return;
                window._prevBmStr = newDataStr;

                bookmarks = Array.isArray(data) ? data : Object.values(data);
                bookmarks = bookmarks.map(f => ({
                    ...f,
                    parentId: f.parentId || null,
                    links: f.links ? (Array.isArray(f.links) ? f.links : Object.values(f.links)) : []
                }));

                if (currentFolderId && !bookmarks.find(f => f.id === currentFolderId)) {
                    currentFolderId = null;
                }

                if (!currentFolderId) {
                    const rootFolders = bookmarks.filter(f => !f.parentId);
                    if (rootFolders.length > 0) currentFolderId = rootFolders[0].id;
                }
                
                window.renderBookmarks();
            } catch (err) {
                console.error("[Bookmark] Data Parsing Error:", err);
            }
        });
    } catch (e) {
        console.error("[Bookmark] Firebase Connection Error:", e);
    }
};

window.saveBookmarksToFirebase = () => {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.database().ref('shared_bookmarks').set(bookmarks).catch(err => {
                console.error("[Bookmark] Firebase Save Error:", err);
                if (typeof window.showToast === 'function') window.showToast("❌ 데이터 저장에 실패했습니다.");
            });
        }
    } catch (e) {
        console.error("[Bookmark] Save Exception:", e);
    }
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

const getRootAncestorId = (folderId) => {
    let curr = bookmarks.find(f => f.id === folderId);
    while (curr && curr.parentId) {
        curr = bookmarks.find(f => f.id === curr.parentId);
    }
    return curr ? curr.id : null;
};

const checkDescendant = (draggedId, targetId) => {
    let curr = targetId;
    while(curr) {
        if (curr === draggedId) return true;
        const parent = bookmarks.find(x => x.id === curr);
        curr = parent ? parent.parentId : null;
    }
    return false;
};

const buildSidebarFolderDOM = (folder) => {
    const div = document.createElement('div');
    const rootAncestorId = getRootAncestorId(currentFolderId);
    div.className = `bm-folder ${folder.id === rootAncestorId ? 'active' : ''}`;
    div.draggable = true;

    const deleteFolderBtn = currentUserUid === window.ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.deleteFolder('${folder.id}')">🗑️</button>` : '';
    
    div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> 
                     <span class="bm-folder-name" style="display:flex; align-items:center;">📁 ${window.escapeHTML(folder.name)}</span>
                     <div class="bm-actions">
                         <button class="bm-btn-icon" onclick="event.stopPropagation(); window.editFolder('${folder.id}')">✏️</button>
                         ${deleteFolderBtn}
                     </div>`;
    
    div.onclick = (e) => { 
        e.stopPropagation();
        currentFolderId = folder.id; 
        window.renderBookmarks(); 
    };
    
    setupFolderDragAndDrop(div, folder.id);
    return div;
};

const buildMainAreaFolderCard = (folder) => {
    const card = document.createElement('div');
    card.className = 'bm-link-card bm-subfolder-card';
    card.style.cursor = 'pointer';
    card.style.borderLeft = '4px solid var(--text-sub)';
    card.draggable = true;
    
    const deleteFolderBtn = currentUserUid === window.ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.deleteFolder('${folder.id}')">🗑️</button>` : '';

    card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                      <div class="bm-link-info">
                          <b style="color: var(--text-main);">📁 ${window.escapeHTML(folder.name)}</b>
                          <small>하위 폴더</small>
                      </div>
                      <div class="bm-actions" onclick="event.stopPropagation()">
                         <button class="bm-btn-icon" onclick="window.editFolder('${folder.id}')">✏️</button>
                         ${deleteFolderBtn}
                      </div>`;

    card.onclick = (e) => {
        e.stopPropagation();
        currentFolderId = folder.id;
        window.renderBookmarks();
    };

    setupFolderDragAndDrop(card, folder.id);
    return card;
};

const setupFolderDragAndDrop = (element, folderId) => {
    element.ondragstart = (e) => { 
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', 'folder'); 
        bmDragState = { type: 'folder', id: folderId };
        element.classList.add('dragging'); 
    };
    
    element.ondragend = () => { 
        element.classList.remove('dragging'); 
        bmDragState = null; 
    };
    
    element.ondragover = (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        if (!bmDragState) return;
        element.classList.add('drag-over');
    };
    
    element.ondragleave = () => { 
        element.classList.remove('drag-over'); 
    };
    
    element.ondrop = (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        element.classList.remove('drag-over');
        if (!bmDragState) return;
        
        if (bmDragState.type === 'folder') {
            const draggedId = bmDragState.id;
            if (draggedId === folderId || checkDescendant(draggedId, folderId)) {
                if (typeof window.showToast === 'function') window.showToast("❌ 유효하지 않은 이동입니다.");
                return;
            }
            const folderToMove = bookmarks.find(bf => bf.id === draggedId);
            if (folderToMove) {
                folderToMove.parentId = folderId;
                window.saveBookmarksToFirebase();
                window.renderBookmarks();
            }
        } else if (bmDragState.type === 'link') {
            const sourceFolder = bookmarks.find(f => f.id === bmDragState.sourceFid);
            const targetFolder = bookmarks.find(f => f.id === folderId);
            if (sourceFolder && targetFolder && bmDragState.sourceFid !== folderId) {
                const linkIndex = sourceFolder.links.findIndex(link => link.id === bmDragState.lId);
                if (linkIndex !== -1) {
                    const movingLink = sourceFolder.links.splice(linkIndex, 1)[0];
                    targetFolder.links.push(movingLink);
                    window.saveBookmarksToFirebase();
                    window.renderBookmarks();
                    if (typeof window.showToast === 'function') window.showToast(`📍 링크가 이동되었습니다.`);
                }
            }
        }
    };
};

window.renderBookmarks = () => {
    try {
        if (!isBookmarkDOMReady) return;
        
        const fList = document.getElementById('bm_folder_list');
        const lList = document.getElementById('bm_link_list');
        const titleText = document.getElementById('bm_current_folder_title');
        
        if (!fList || !lList || !titleText) return;

        fList.innerHTML = '';
        lList.innerHTML = '';

        const rootFolders = bookmarks.filter(f => !f.parentId);
        const folderFragment = document.createDocumentFragment();
        rootFolders.forEach(folder => {
            folderFragment.appendChild(buildSidebarFolderDOM(folder));
        });
        fList.appendChild(folderFragment);

        const activeF = bookmarks.find(f => f.id === currentFolderId);
        if (activeF) {
            titleText.innerHTML = '';
            if (activeF.parentId) {
                const upBtn = document.createElement('span');
                upBtn.innerHTML = '🔙 ';
                upBtn.style.cursor = 'pointer';
                upBtn.style.marginRight = '8px';
                upBtn.onclick = () => { 
                    currentFolderId = activeF.parentId; 
                    window.renderBookmarks(); 
                };
                titleText.appendChild(upBtn);
            }
            titleText.appendChild(document.createTextNode(`📂 ${activeF.name}`));

            const mainFragment = document.createDocumentFragment();

            const subfolders = bookmarks.filter(f => f.parentId === activeF.id);
            subfolders.forEach(sub => {
                mainFragment.appendChild(buildMainAreaFolderCard(sub));
            });

            activeF.links.forEach((l) => {
                const card = document.createElement('div');
                card.className = 'bm-link-card';
                card.draggable = true;
                card.onclick = () => window.open(l.url, '_blank');
                
                const deleteLinkBtn = currentUserUid === window.ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.deleteLink('${activeF.id}', '${l.id}')">🗑️</button>` : '';
                
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
                
                mainFragment.appendChild(card);
            });
            
            lList.appendChild(mainFragment);
        } else {
            titleText.textContent = `📂 폴더를 선택하세요`;
        }
    } catch (e) {
        console.error("[Bookmark] Rendering Error:", e);
    }
};

window.addNewFolder = () => {
    try {
        const name = prompt('새 폴더 이름:');
        if (!name || !name.trim()) return;

        let parentId = null;
        if (currentFolderId) {
            const currentFolder = bookmarks.find(f => f.id === currentFolderId);
            if (currentFolder) {
                if (confirm(`[${currentFolder.name}] 폴더 안에 하위 폴더로 만드시겠습니까?\n(취소 시 최상위 폴더로 생성)`)) {
                    parentId = currentFolderId;
                }
            }
        }

        bookmarks.push({ id: 'f_'+Date.now(), name: name.trim(), parentId: parentId, links: [] }); 
        window.saveBookmarksToFirebase(); 
    } catch (e) {
        console.error("[Bookmark] Add Folder Error:", e);
    }
};

window.editFolder = (id) => {
    try {
        const f = bookmarks.find(x => x.id === id);
        if (!f) return;
        const n = prompt('폴더 이름 수정:', f.name);
        if (n && n.trim()) { 
            f.name = n.trim(); 
            window.saveBookmarksToFirebase(); 
            window.renderBookmarks();
        }
    } catch (e) {
        console.error("[Bookmark] Edit Folder Error:", e);
    }
};

window.deleteFolder = (id) => {
    try {
        if (currentUserUid !== window.ADMIN_UID) return;
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
            if (idsToDelete.includes(currentFolderId)) {
                currentFolderId = bookmarks.find(f => !f.parentId)?.id || null;
            }
            window.saveBookmarksToFirebase(); 
            window.renderBookmarks();
        }
    } catch (e) {
        console.error("[Bookmark] Delete Folder Error:", e);
    }
};

window.toggleAddForm = (s) => { 
    try {
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
    } catch (e) {
        console.error("[Bookmark] Toggle Form Error:", e);
    }
};

window.openAddForm = () => { 
    try {
        editingLinkId = null; 
        const title = document.getElementById('bm_form_title');
        if (title) title.textContent = "🔗 링크 추가"; 
        
        const nameInput = document.getElementById('bm_input_name');
        const urlInput = document.getElementById('bm_input_url');
        
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        
        window.toggleAddForm(true); 
        if (nameInput) setTimeout(() => nameInput.focus(), 50);
    } catch (e) {
        console.error("[Bookmark] Open Add Form Error:", e);
    }
};

window.openEditForm = (id) => {
    try {
        const f = bookmarks.find(f => f.id === currentFolderId);
        if (!f) return;
        const l = f.links.find(x => x.id === id);
        if (!l) return;
        
        editingLinkId = id;
        const title = document.getElementById('bm_form_title');
        if (title) title.textContent = "✏️ 링크 수정";
        
        const nameInput = document.getElementById('bm_input_name');
        const urlInput = document.getElementById('bm_input_url');
        
        if (nameInput) nameInput.value = l.name;
        if (urlInput) urlInput.value = l.url;
        
        window.toggleAddForm(true);
        if (nameInput) setTimeout(() => nameInput.focus(), 50);
    } catch (e) {
        console.error("[Bookmark] Open Edit Form Error:", e);
    }
};

window.saveNewLink = () => {
    try {
        const nameEl = document.getElementById('bm_input_name');
        const urlEl = document.getElementById('bm_input_url');
        if (!nameEl || !urlEl) return;

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
    } catch (e) {
        console.error("[Bookmark] Save Link Error:", e);
    }
};

window.deleteLink = (fid, lid) => {
    try {
        if (currentUserUid !== window.ADMIN_UID) return;
        if (confirm('이 링크를 삭제하시겠습니까?')) {
            const f = bookmarks.find(x => x.id === fid);
            if (f) {
                f.links = f.links.filter(x => x.id !== lid);
                window.saveBookmarksToFirebase();
                window.renderBookmarks();
            }
        }
    } catch (e) {
        console.error("[Bookmark] Delete Link Error:", e);
    }
};
