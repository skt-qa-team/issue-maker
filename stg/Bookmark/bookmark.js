window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.Bookmark = {
    State: {
        currentUserUid: null,
        bookmarks: [],
        currentFolderId: null,
        editingLinkId: null,
        dragState: null,
        isReady: false,
        prevBmStr: ''
    },

    init: () => {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().onAuthStateChanged((user) => {
                    window.QA_CORE.Bookmark.State.currentUserUid = user ? user.uid : null;
                    if (window.QA_CORE.Bookmark.State.isReady) {
                        window.QA_CORE.Bookmark.render();
                    }
                });
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Auth Init');
        }
    },

    initEvents: () => {
        try {
            const nameInput = document.getElementById('bm_input_name');
            const urlInput = document.getElementById('bm_input_url');
            
            const handleEnter = (e) => {
                if (e.key === 'Enter') window.QA_CORE.Bookmark.saveLink();
            };

            if (nameInput) nameInput.addEventListener('keyup', handleEnter);
            if (urlInput) urlInput.addEventListener('keyup', handleEnter);
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Init Events');
        }
    },

    fetch: () => {
        try {
            if (typeof firebase === 'undefined') return;
            const bmRef = firebase.database().ref('shared_bookmarks');
            
            bmRef.on('value', (snapshot) => {
                try {
                    let data = snapshot.val() || [];
                    const newDataStr = JSON.stringify(data);
                    
                    if (window.QA_CORE.Bookmark.State.prevBmStr === newDataStr) return;
                    window.QA_CORE.Bookmark.State.prevBmStr = newDataStr;

                    let bms = Array.isArray(data) ? data : Object.values(data);
                    window.QA_CORE.Bookmark.State.bookmarks = bms.map(f => ({
                        ...f,
                        parentId: f.parentId || null,
                        links: f.links ? (Array.isArray(f.links) ? f.links : Object.values(f.links)) : []
                    }));

                    const state = window.QA_CORE.Bookmark.State;
                    if (state.currentFolderId && !state.bookmarks.find(f => f.id === state.currentFolderId)) {
                        state.currentFolderId = null;
                    }

                    if (!state.currentFolderId) {
                        const rootFolders = state.bookmarks.filter(f => !f.parentId);
                        if (rootFolders.length > 0) state.currentFolderId = rootFolders[0].id;
                    }
                    
                    window.QA_CORE.Bookmark.render();
                } catch (err) {
                    if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Bookmark Data Parsing');
                }
            });
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Firebase Connection');
        }
    },

    save: () => {
        try {
            if (typeof firebase !== 'undefined') {
                firebase.database().ref('shared_bookmarks').set(window.QA_CORE.Bookmark.State.bookmarks).catch(err => {
                    if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Bookmark Firebase Save');
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("❌ 데이터 저장에 실패했습니다.", 'error');
                });
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Save Exception');
        }
    },

    getRootAncestorId: (folderId) => {
        const bms = window.QA_CORE.Bookmark.State.bookmarks;
        let curr = bms.find(f => f.id === folderId);
        while (curr && curr.parentId) {
            curr = bms.find(f => f.id === curr.parentId);
        }
        return curr ? curr.id : null;
    },

    checkDescendant: (draggedId, targetId) => {
        const bms = window.QA_CORE.Bookmark.State.bookmarks;
        let curr = targetId;
        while(curr) {
            if (curr === draggedId) return true;
            const parent = bms.find(x => x.id === curr);
            curr = parent ? parent.parentId : null;
        }
        return false;
    },

    buildSidebarFolder: (folder) => {
        const div = document.createElement('div');
        const state = window.QA_CORE.Bookmark.State;
        const rootAncestorId = window.QA_CORE.Bookmark.getRootAncestorId(state.currentFolderId);
        
        div.className = `bm-folder ${folder.id === rootAncestorId ? 'active' : ''}`;
        div.draggable = true;

        const adminUid = window.QA_CORE.CONSTANTS?.SETTINGS?.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
        const deleteFolderBtn = state.currentUserUid === adminUid ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.QA_CORE.Bookmark.deleteFolder('${folder.id}')">🗑️</button>` : '';
        const escapeHTML = window.QA_CORE.Utils?.escapeHTML || (str => str);

        div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> 
                         <span class="bm-folder-name" style="display:flex; align-items:center;">📁 ${escapeHTML(folder.name)}</span>
                         <div class="bm-actions">
                             <button class="bm-btn-icon" onclick="event.stopPropagation(); window.QA_CORE.Bookmark.editFolder('${folder.id}')">✏️</button>
                             ${deleteFolderBtn}
                         </div>`;
        
        div.onclick = (e) => { 
            e.stopPropagation();
            window.QA_CORE.Bookmark.State.currentFolderId = folder.id; 
            window.QA_CORE.Bookmark.render(); 
        };
        
        window.QA_CORE.Bookmark.setupDragAndDrop(div, folder.id);
        return div;
    },

    buildMainFolderCard: (folder) => {
        const card = document.createElement('div');
        card.className = 'bm-link-card bm-subfolder-card';
        card.style.cursor = 'pointer';
        card.style.borderLeft = '4px solid var(--text-sub)';
        card.draggable = true;
        
        const state = window.QA_CORE.Bookmark.State;
        const adminUid = window.QA_CORE.CONSTANTS?.SETTINGS?.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
        const deleteFolderBtn = state.currentUserUid === adminUid ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.QA_CORE.Bookmark.deleteFolder('${folder.id}')">🗑️</button>` : '';
        const escapeHTML = window.QA_CORE.Utils?.escapeHTML || (str => str);

        card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                          <div class="bm-link-info">
                              <b style="color: var(--text-main);">📁 ${escapeHTML(folder.name)}</b>
                              <small>하위 폴더</small>
                          </div>
                          <div class="bm-actions" onclick="event.stopPropagation()">
                             <button class="bm-btn-icon" onclick="window.QA_CORE.Bookmark.editFolder('${folder.id}')">✏️</button>
                             ${deleteFolderBtn}
                          </div>`;

        card.onclick = (e) => {
            e.stopPropagation();
            window.QA_CORE.Bookmark.State.currentFolderId = folder.id;
            window.QA_CORE.Bookmark.render();
        };

        window.QA_CORE.Bookmark.setupDragAndDrop(card, folder.id);
        return card;
    },

    setupDragAndDrop: (element, folderId) => {
        element.ondragstart = (e) => { 
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', 'folder'); 
            window.QA_CORE.Bookmark.State.dragState = { type: 'folder', id: folderId };
            element.classList.add('dragging'); 
        };
        
        element.ondragend = () => { 
            element.classList.remove('dragging'); 
            window.QA_CORE.Bookmark.State.dragState = null; 
        };
        
        element.ondragover = (e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            if (!window.QA_CORE.Bookmark.State.dragState) return;
            element.classList.add('drag-over');
        };
        
        element.ondragleave = () => { 
            element.classList.remove('drag-over'); 
        };
        
        element.ondrop = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            element.classList.remove('drag-over');
            
            const state = window.QA_CORE.Bookmark.State;
            if (!state.dragState) return;
            
            if (state.dragState.type === 'folder') {
                const draggedId = state.dragState.id;
                if (draggedId === folderId || window.QA_CORE.Bookmark.checkDescendant(draggedId, folderId)) {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("❌ 유효하지 않은 이동입니다.", 'warning');
                    return;
                }
                const folderToMove = state.bookmarks.find(bf => bf.id === draggedId);
                if (folderToMove) {
                    folderToMove.parentId = folderId;
                    window.QA_CORE.Bookmark.save();
                    window.QA_CORE.Bookmark.render();
                }
            } else if (state.dragState.type === 'link') {
                const sourceFolder = state.bookmarks.find(f => f.id === state.dragState.sourceFid);
                const targetFolder = state.bookmarks.find(f => f.id === folderId);
                if (sourceFolder && targetFolder && state.dragState.sourceFid !== folderId) {
                    const linkIndex = sourceFolder.links.findIndex(link => link.id === state.dragState.lId);
                    if (linkIndex !== -1) {
                        const movingLink = sourceFolder.links.splice(linkIndex, 1)[0];
                        targetFolder.links.push(movingLink);
                        window.QA_CORE.Bookmark.save();
                        window.QA_CORE.Bookmark.render();
                        if (window.QA_CORE.UI) window.QA_CORE.UI.showToast(`📍 링크가 이동되었습니다.`, 'success');
                    }
                }
            }
        };
    },

    render: () => {
        try {
            const state = window.QA_CORE.Bookmark.State;
            if (!state.isReady) return;
            
            const fList = document.getElementById('bm_folder_list');
            const lList = document.getElementById('bm_link_list');
            const titleText = document.getElementById('bm_current_folder_title');
            
            if (!fList || !lList || !titleText) return;

            fList.innerHTML = '';
            lList.innerHTML = '';

            const rootFolders = state.bookmarks.filter(f => !f.parentId);
            const folderFragment = document.createDocumentFragment();
            rootFolders.forEach(folder => {
                folderFragment.appendChild(window.QA_CORE.Bookmark.buildSidebarFolder(folder));
            });
            fList.appendChild(folderFragment);

            const activeF = state.bookmarks.find(f => f.id === state.currentFolderId);
            if (activeF) {
                titleText.innerHTML = '';
                if (activeF.parentId) {
                    const upBtn = document.createElement('span');
                    upBtn.innerHTML = '🔙 ';
                    upBtn.style.cursor = 'pointer';
                    upBtn.style.marginRight = '8px';
                    upBtn.onclick = () => { 
                        state.currentFolderId = activeF.parentId; 
                        window.QA_CORE.Bookmark.render(); 
                    };
                    titleText.appendChild(upBtn);
                }
                titleText.appendChild(document.createTextNode(`📂 ${activeF.name}`));

                const mainFragment = document.createDocumentFragment();

                const subfolders = state.bookmarks.filter(f => f.parentId === activeF.id);
                subfolders.forEach(sub => {
                    mainFragment.appendChild(window.QA_CORE.Bookmark.buildMainFolderCard(sub));
                });

                const adminUid = window.QA_CORE.CONSTANTS?.SETTINGS?.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
                const escapeHTML = window.QA_CORE.Utils?.escapeHTML || (str => str);

                activeF.links.forEach((l) => {
                    const card = document.createElement('div');
                    card.className = 'bm-link-card';
                    card.draggable = true;
                    card.onclick = () => window.open(l.url, '_blank');
                    
                    const deleteLinkBtn = state.currentUserUid === adminUid ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); window.QA_CORE.Bookmark.deleteLink('${activeF.id}', '${l.id}')">🗑️</button>` : '';
                    
                    card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                                     <div class="bm-link-info"><b>${escapeHTML(l.name)}</b><small>${escapeHTML(l.url)}</small></div>
                                     <div class="bm-actions" onclick="event.stopPropagation()">
                                        <button class="bm-btn-icon" onclick="window.QA_CORE.Bookmark.openEdit('${l.id}')">✏️</button>
                                        ${deleteLinkBtn}
                                     </div>`;
                    
                    card.ondragstart = (e) => { 
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', 'link'); 
                        state.dragState = { type: 'link', sourceFid: activeF.id, lId: l.id };
                        card.classList.add('dragging'); 
                    };
                    card.ondragend = () => { 
                        card.classList.remove('dragging'); 
                        state.dragState = null; 
                    };
                    
                    mainFragment.appendChild(card);
                });
                
                lList.appendChild(mainFragment);
            } else {
                titleText.textContent = `📂 폴더를 선택하세요`;
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Rendering');
        }
    },

    addFolder: () => {
        try {
            const name = prompt('새 폴더 이름:');
            if (!name || !name.trim()) return;

            const state = window.QA_CORE.Bookmark.State;
            let parentId = null;
            if (state.currentFolderId) {
                const currentFolder = state.bookmarks.find(f => f.id === state.currentFolderId);
                if (currentFolder) {
                    if (confirm(`[${currentFolder.name}] 폴더 안에 하위 폴더로 만드시겠습니까?\n(취소 시 최상위 폴더로 생성)`)) {
                        parentId = state.currentFolderId;
                    }
                }
            }

            state.bookmarks.push({ id: 'f_'+Date.now(), name: name.trim(), parentId: parentId, links: [] }); 
            window.QA_CORE.Bookmark.save(); 
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Add Folder');
        }
    },

    editFolder: (id) => {
        try {
            const state = window.QA_CORE.Bookmark.State;
            const f = state.bookmarks.find(x => x.id === id);
            if (!f) return;
            const n = prompt('폴더 이름 수정:', f.name);
            if (n && n.trim()) { 
                f.name = n.trim(); 
                window.QA_CORE.Bookmark.save(); 
                window.QA_CORE.Bookmark.render();
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Edit Folder');
        }
    },

    deleteFolder: (id) => {
        try {
            const state = window.QA_CORE.Bookmark.State;
            const adminUid = window.QA_CORE.CONSTANTS?.SETTINGS?.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
            if (state.currentUserUid !== adminUid) return;
            
            if (confirm('폴더를 삭제하시겠습니까?\n(폴더 내부의 모든 링크와 하위 폴더가 함께 삭제됩니다)')) { 
                const idsToDelete = [id];
                let i = 0;
                while(i < idsToDelete.length) {
                    const currentId = idsToDelete[i];
                    const children = state.bookmarks.filter(x => x.parentId === currentId).map(x => x.id);
                    idsToDelete.push(...children);
                    i++;
                }
                state.bookmarks = state.bookmarks.filter(x => !idsToDelete.includes(x.id)); 
                if (idsToDelete.includes(state.currentFolderId)) {
                    state.currentFolderId = state.bookmarks.find(f => !f.parentId)?.id || null;
                }
                window.QA_CORE.Bookmark.save(); 
                window.QA_CORE.Bookmark.render();
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Delete Folder');
        }
    },

    toggleForm: (s) => { 
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
            if (!s) window.QA_CORE.Bookmark.State.editingLinkId = null;
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Toggle Form');
        }
    },

    openAdd: () => { 
        try {
            window.QA_CORE.Bookmark.State.editingLinkId = null; 
            const title = document.getElementById('bm_form_title');
            if (title) title.textContent = "🔗 링크 추가"; 
            
            const nameInput = document.getElementById('bm_input_name');
            const urlInput = document.getElementById('bm_input_url');
            
            if (nameInput) nameInput.value = '';
            if (urlInput) urlInput.value = '';
            
            window.QA_CORE.Bookmark.toggleForm(true); 
            if (nameInput) setTimeout(() => nameInput.focus(), 50);
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Open Add Form');
        }
    },

    openEdit: (id) => {
        try {
            const state = window.QA_CORE.Bookmark.State;
            const f = state.bookmarks.find(f => f.id === state.currentFolderId);
            if (!f) return;
            const l = f.links.find(x => x.id === id);
            if (!l) return;
            
            state.editingLinkId = id;
            const title = document.getElementById('bm_form_title');
            if (title) title.textContent = "✏️ 링크 수정";
            
            const nameInput = document.getElementById('bm_input_name');
            const urlInput = document.getElementById('bm_input_url');
            
            if (nameInput) nameInput.value = l.name;
            if (urlInput) urlInput.value = l.url;
            
            window.QA_CORE.Bookmark.toggleForm(true);
            if (nameInput) setTimeout(() => nameInput.focus(), 50);
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Open Edit Form');
        }
    },

    saveLink: () => {
        try {
            const nameEl = document.getElementById('bm_input_name');
            const urlEl = document.getElementById('bm_input_url');
            if (!nameEl || !urlEl) return;

            const rawN = nameEl.value.trim();
            let rawU = urlEl.value.trim();
            
            if (!rawN || !rawU) return;
            if (!/^https?:\/\//i.test(rawU)) rawU = 'https://' + rawU;
            
            const state = window.QA_CORE.Bookmark.State;
            const f = state.bookmarks.find(x => x.id === state.currentFolderId);
            if (!f) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("❌ 링크를 추가할 폴더를 먼저 선택하세요.", 'warning');
                return;
            }
            
            if (state.editingLinkId) {
                const l = f.links.find(x => x.id === state.editingLinkId);
                if (l) { l.name = rawN; l.url = rawU; }
            } else {
                f.links.push({ id: 'l_'+Date.now(), name: rawN, url: rawU });
            }
            
            window.QA_CORE.Bookmark.save(); 
            window.QA_CORE.Bookmark.toggleForm(false);
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Save Link');
        }
    },

    deleteLink: (fid, lid) => {
        try {
            const state = window.QA_CORE.Bookmark.State;
            const adminUid = window.QA_CORE.CONSTANTS?.SETTINGS?.ADMIN_UID || "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
            if (state.currentUserUid !== adminUid) return;

            if (confirm('이 링크를 삭제하시겠습니까?')) {
                const f = state.bookmarks.find(x => x.id === fid);
                if (f) {
                    f.links = f.links.filter(x => x.id !== lid);
                    window.QA_CORE.Bookmark.save();
                    window.QA_CORE.Bookmark.render();
                }
            }
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Bookmark Delete Link');
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.Bookmark) {
        window.QA_CORE.Bookmark.State.isReady = true;
        window.QA_CORE.Bookmark.initEvents();
        window.QA_CORE.Bookmark.init();
        window.QA_CORE.Bookmark.fetch();
    }
});
