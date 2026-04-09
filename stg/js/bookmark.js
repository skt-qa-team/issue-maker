document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-bookmark { background: #3b82f6; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-bookmark:hover { background: #2563eb; transform: translateY(-2px); }
        
        /* ⚡ 성능 최적화: 블러(Blur) 제거 및 가벼운 배경 처리 */
        #bookmarkModal.modal-overlay { 
            background: rgba(0, 0, 0, 0.6); 
            backdrop-filter: none !important; 
        }

        #bookmarkModal .modal-content { 
            max-width: 950px; width: 95%; display: flex; flex-direction: column; height: 85vh; 
            background: var(--bg-color); border-radius: 16px; overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .bm-header { padding: 15px 25px; background: var(--panel-bg); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .bm-body { display: grid; grid-template-columns: 280px 1fr; flex: 1; overflow: hidden; }
        .bm-sidebar { background: var(--panel-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; overflow-y: auto; padding: 10px; gap: 6px; }
        .bm-main { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.02); }
        
        /* 드래그 앤 드롭 시각 효과 최적화 */
        .dragging { opacity: 0.4; border: 1px dashed #3b82f6 !important; background: #eff6ff !important; }
        .drag-over { border-top: 3px solid #3b82f6 !important; }

        .bm-folder { padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 700; color: var(--text-sub); display: flex; align-items: center; gap: 10px; transition: 0.1s; }
        .bm-folder:hover { background: #f1f5f9; }
        .bm-folder.active { background: #eff6ff; color: #2563eb; border-left: 4px solid #3b82f6; }
        
        .bm-link-card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; gap: 15px; }
        .bm-drag-handle { cursor: grab; color: #cbd5e1; font-size: 1.1rem; }

        .bm-btn-icon { background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 5px; border-radius: 4px; transition: 0.2s; }
        .bm-btn-icon:hover { background: #f1f5f9; color: #3b82f6; }
        .bm-btn-icon.del:hover { color: #ef4444; background: #fee2e2; }

        .bm-add-link-form { background: white; padding: 15px; border-radius: 12px; border: 2px solid #3b82f6; display: none; flex-direction: column; gap: 10px; margin-bottom: 15px; }
        .bm-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
        .bm-btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    `;
    document.head.appendChild(style);

    const modalHtml = `
    <div class="modal-overlay" id="bookmarkModal" style="display:none; z-index: 6000;">
        <div class="modal-content">
            <div class="bm-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h2 style="margin:0; font-size:1.2rem;">🔖 공용 북마크 센터</h2>
                    <span style="background:#10b981; color:white; font-size:0.6rem; padding:2px 6px; border-radius:30px; animation: pulse 2s infinite;">SYNC LIVE</span>
                </div>
                <button class="close-btn" style="position:static;" onclick="closeBookmarkModal()">×</button>
            </div>
            <div class="bm-body">
                <div class="bm-sidebar" id="bm_folder_list"></div>
                <div class="bm-main">
                    <div class="bm-add-link-form" id="bm_add_form">
                        <h4 id="bm_form_title" style="margin:0;">🔗 링크 추가</h4>
                        <input type="text" id="bm_input_name" class="bm-input" placeholder="사이트 닉네임">
                        <input type="text" id="bm_input_url" class="bm-input" placeholder="URL (https://...)">
                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                            <button class="bm-btn-icon" onclick="toggleAddForm(false)">취소</button>
                            <button class="bm-btn-primary" id="bm_save_btn" onclick="saveNewLink()">저장하기</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 id="bm_current_folder_title" style="margin:0; font-size:1rem;">📂 폴더를 선택하세요</h3>
                        <button class="bm-btn-primary" style="font-size:0.8rem;" onclick="openAddForm()">+ 링크 추가</button>
                    </div>
                    <div id="bm_link_list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const injectButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns) {
            clearInterval(injectButton);
            const bmBtn = document.createElement('button');
            bmBtn.className = 'btn-bookmark';
            bmBtn.innerHTML = '🔖 북마크';
            bmBtn.onclick = openBookmarkModal;
            topBarBtns.prepend(bmBtn);
        }
    }, 100);

    initSharedBookmarks();
});

let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;

function initSharedBookmarks() {
    const bmRef = firebase.database().ref('shared_bookmarks');
    bmRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // ⚡ 최적화: 데이터 변화가 있을 때만 처리
        const newDataStr = JSON.stringify(data);
        if (window._prevBmStr === newDataStr) return;
        window._prevBmStr = newDataStr;

        bookmarks = Array.isArray(data) ? data : Object.values(data);
        bookmarks = bookmarks.map(f => ({
            ...f,
            links: f.links ? (Array.isArray(f.links) ? f.links : Object.values(f.links)) : []
        }));

        if (!currentFolderId && bookmarks.length > 0) currentFolderId = bookmarks[0].id;
        renderBookmarks();
    });
}

function saveBookmarksToFirebase() {
    firebase.database().ref('shared_bookmarks').set(bookmarks);
}

window.openBookmarkModal = () => {
    document.getElementById('bookmarkModal').style.display = 'flex';
    renderBookmarks();
};
window.closeBookmarkModal = () => document.getElementById('bookmarkModal').style.display = 'none';

function renderBookmarks() {
    const fList = document.getElementById('bm_folder_list');
    const lList = document.getElementById('bm_link_list');
    const titleText = document.getElementById('bm_current_folder_title');
    if (!fList || !lList || document.getElementById('bookmarkModal').style.display === 'none') return;

    fList.innerHTML = '';
    lList.innerHTML = '';

    bookmarks.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = `bm-folder ${f.id === currentFolderId ? 'active' : ''}`;
        div.draggable = true;
        div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> <span style="flex:1">${f.name}</span>
                        <div class="bm-actions">
                            <button class="bm-btn-icon" onclick="event.stopPropagation(); editFolder('${f.id}')">✏️</button>
                            <button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteFolder('${f.id}')">🗑️</button>
                        </div>`;
        div.onclick = () => { currentFolderId = f.id; renderBookmarks(); };
        
        // 폴더 드래그
        div.ondragstart = (e) => { e.dataTransfer.setData('fIdx', idx); div.classList.add('dragging'); };
        div.ondragend = () => div.classList.remove('dragging');
        div.ondragover = (e) => { e.preventDefault(); div.classList.add('drag-over'); };
        div.ondragleave = () => div.classList.remove('drag-over');
        div.ondrop = (e) => {
            e.preventDefault(); div.classList.remove('drag-over');
            const from = e.dataTransfer.getData('fIdx');
            if (from !== "" && from !== idx.toString()) {
                const item = bookmarks.splice(from, 1)[0];
                bookmarks.splice(idx, 0, item);
                saveBookmarksToFirebase();
            }
        };
        fList.appendChild(div);
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.style.cssText = "width:100%; padding:10px; border:1px dashed #cbd5e1; background:white; cursor:pointer; font-weight:700; margin-top:10px;";
    addFolderBtn.innerHTML = "+ 새 폴더 추가";
    addFolderBtn.onclick = addNewFolder;
    fList.appendChild(addFolderBtn);

    const activeF = bookmarks.find(f => f.id === currentFolderId);
    if (activeF) {
        titleText.innerHTML = `📂 ${activeF.name}`;
        activeF.links.forEach((l, lIdx) => {
            const card = document.createElement('div');
            card.className = 'bm-link-card';
            card.draggable = true;
            card.innerHTML = `<span class="bm-drag-handle">⋮⋮</span>
                             <div style="flex:1"><b>${l.name}</b><br><small style="color:#64748b">${l.url}</small></div>
                             <div class="bm-actions">
                                <button class="bm-btn-icon" onclick="window.open('${l.url}', '_blank')">🚀</button>
                                <button class="bm-btn-icon" onclick="openEditForm('${l.id}')">✏️</button>
                                <button class="bm-btn-icon del" onclick="deleteLink('${activeF.id}', '${l.id}')">🗑️</button>
                             </div>`;
            card.ondragstart = (e) => { e.dataTransfer.setData('lIdx', lIdx); card.classList.add('dragging'); };
            card.ondragend = () => card.classList.remove('dragging');
            card.ondragover = (e) => { e.preventDefault(); card.classList.add('drag-over'); };
            card.ondragleave = () => card.classList.remove('drag-over');
            card.ondrop = (e) => {
                e.preventDefault(); card.classList.remove('drag-over');
                const from = e.dataTransfer.getData('lIdx');
                if (from !== "" && from !== lIdx.toString()) {
                    const item = activeF.links.splice(from, 1)[0];
                    activeF.links.splice(lIdx, 0, item);
                    saveBookmarksToFirebase();
                }
            };
            lList.appendChild(card);
        });
    }
}

// --- 복구된 핵심 기능 함수들 ---
window.addNewFolder = () => {
    const name = prompt('새 폴더 이름:');
    if (name) { bookmarks.push({ id: 'f_'+Date.now(), name, links: [] }); saveBookmarksToFirebase(); }
};
window.editFolder = (id) => {
    const f = bookmarks.find(x => x.id === id);
    const n = prompt('폴더 이름 수정:', f.name);
    if (n) { f.name = n; saveBookmarksToFirebase(); }
};
window.deleteFolder = (id) => {
    if (confirm('삭제하시겠습니까?')) { bookmarks = bookmarks.filter(x => x.id !== id); saveBookmarksToFirebase(); }
};
window.toggleAddForm = (s) => { 
    document.getElementById('bm_add_form').style.display = s ? 'flex' : 'none';
    if (!s) editingLinkId = null;
};
window.openAddForm = () => { editingLinkId = null; document.getElementById('bm_form_title').innerText = "🔗 링크 추가"; toggleAddForm(true); };
window.openEditForm = (id) => {
    const l = bookmarks.find(f => f.id === currentFolderId).links.find(x => x.id === id);
    editingLinkId = id;
    document.getElementById('bm_form_title').innerText = "✏️ 링크 수정";
    document.getElementById('bm_input_name').value = l.name;
    document.getElementById('bm_input_url').value = l.url;
    toggleAddForm(true);
};
window.saveNewLink = () => {
    const n = document.getElementById('bm_input_name').value;
    const u = document.getElementById('bm_input_url').value;
    const f = bookmarks.find(x => x.id === currentFolderId);
    if (editingLinkId) {
        const l = f.links.find(x => x.id === editingLinkId);
        l.name = n; l.url = u;
    } else {
        f.links.push({ id: 'l_'+Date.now(), name: n, url: u });
    }
    saveBookmarksToFirebase(); toggleAddForm(false);
};
window.deleteLink = (fid, lid) => {
    const f = bookmarks.find(x => x.id === fid);
    f.links = f.links.filter(x => x.id !== lid);
    saveBookmarksToFirebase();
};
