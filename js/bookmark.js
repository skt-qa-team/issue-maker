document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-bookmark { background: #3b82f6; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }
        .btn-bookmark:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        #bookmarkModal .modal-content { max-width: 950px; width: 95%; display: flex; flex-direction: column; height: 85vh; padding: 0; overflow: hidden; background: var(--bg-color); border-radius: 16px; border: 1px solid var(--border-color); }
        .bm-header { padding: 20px 30px; background: var(--panel-bg); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .bm-body { display: grid; grid-template-columns: 280px 1fr; flex: 1; overflow: hidden; }
        .bm-sidebar { background: var(--panel-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; overflow-y: auto; padding: 15px; gap: 8px; }
        .bm-main { padding: 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: rgba(0,0,0,0.02); }
        
        .dragging { opacity: 0.5; border: 2px dashed #3b82f6 !important; background: #eff6ff !important; }
        .drag-over { border-top: 3px solid #3b82f6 !important; }

        .bm-folder { padding: 12px 15px; border-radius: 8px; cursor: pointer; font-weight: 700; color: var(--text-sub); transition: 0.2s; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; position: relative; }
        .bm-folder:hover { background: #f1f5f9; }
        .bm-folder.active { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .bm-drag-handle { cursor: grab; color: #cbd5e1; font-size: 1.2rem; display: flex; align-items: center; }

        .bm-link-card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; gap: 15px; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .bm-link-card:hover { border-color: #93c5fd; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); transform: translateY(-1px); }
        .bm-link-info { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
        .bm-link-name { font-weight: 800; color: var(--text-main); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bm-link-url { color: #64748b; font-size: 0.8rem; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .bm-actions { display: flex; gap: 6px; }
        .bm-btn-icon { background: transparent; border: none; cursor: pointer; color: #94a3b8; font-size: 1rem; padding: 6px; border-radius: 6px; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .bm-btn-icon:hover { color: #3b82f6; background: #eff6ff; }
        .bm-btn-icon.del:hover { color: #ef4444; background: #fee2e2; }

        .bm-add-btn { width: 100%; padding: 12px; background: white; border: 1px dashed #cbd5e1; border-radius: 8px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .bm-add-link-form { background: white; padding: 20px; border-radius: 12px; border: 1.5px solid #3b82f6; display: none; flex-direction: column; gap: 12px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1); }
        .bm-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
        .bm-btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
        .bm-btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
        
        /* 실시간 동기화 인디케이터 */
        .sync-badge { background:#10b981; color:white; font-size:0.65rem; padding:2px 6px; border-radius:4px; letter-spacing:1px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    `;
    document.head.appendChild(style);

    const modalHtml = `
    <div class="modal-overlay" id="bookmarkModal" style="display:none; z-index: 6000;">
        <div class="modal-content">
            <div class="bm-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h2 style="margin:0; font-size:1.4rem;">🔖 공용 북마크 센터</h2>
                    <span class="sync-badge">SYNC LIVE</span>
                </div>
                <button class="close-btn" style="position:static;" onclick="closeBookmarkModal()">×</button>
            </div>
            <div class="bm-body">
                <div class="bm-sidebar" id="bm_folder_list"></div>
                <div class="bm-main">
                    <div class="bm-add-link-form" id="bm_add_form">
                        <h4 id="bm_form_title" style="margin:0 0 5px 0; color:#1e293b;">🔗 링크 추가</h4>
                        <input type="text" id="bm_input_name" class="bm-input" placeholder="사이트 닉네임 (예: PRD 어드민 서버)">
                        <input type="text" id="bm_input_url" class="bm-input" placeholder="URL 입력 (예: https://...)">
                        <div style="display:flex; justify-content:flex-end; gap:10px;">
                            <button class="bm-btn-cancel" onclick="toggleAddForm(false)">취소</button>
                            <button class="bm-btn-primary" id="bm_save_btn" onclick="saveNewLink()">저장하기</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                        <h3 style="margin:0; color:var(--text-main); display:flex; align-items:center; gap:8px;" id="bm_current_folder_title">📂 폴더를 선택하세요</h3>
                        <button class="bm-btn-primary" style="padding: 8px 14px; font-size:0.85rem;" onclick="openAddForm()">+ 링크 추가</button>
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

// ✨ 실시간 데이터 리스너 강화
function initSharedBookmarks() {
    const bmRef = firebase.database().ref('shared_bookmarks');
    // 실시간 감시 시작
    bmRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            bookmarks = data;
            // 만약 현재 선택된 폴더가 없거나 삭제되었다면 첫 번째 폴더로 자동 이동
            if (!currentFolderId || !bookmarks.find(f => f.id === currentFolderId)) {
                currentFolderId = bookmarks[0]?.id || null;
            }
        } else {
            bookmarks = [{ id: 'f_default', name: '📌 공통 필수 링크', links: [] }];
            saveBookmarksToFirebase();
        }
        // 데이터가 변할 때마다 무조건 렌더링 함수 실행 (핵심!)
        renderBookmarks();
    });
}

function saveBookmarksToFirebase() {
    firebase.database().ref('shared_bookmarks').set(bookmarks);
}

window.openBookmarkModal = function() {
    document.getElementById('bookmarkModal').style.display = 'flex';
    renderBookmarks(); // 모달 열 때 한 번 더 확실하게 렌더링
};

window.closeBookmarkModal = function() {
    document.getElementById('bookmarkModal').style.display = 'none';
    toggleAddForm(false);
};

// ✨ 렌더링 로직 통합 및 최적화
function renderBookmarks() {
    const folderList = document.getElementById('bm_folder_list');
    const linkList = document.getElementById('bm_link_list');
    const titleText = document.getElementById('bm_current_folder_title');

    // 모달이 생성 전이거나 요소를 찾을 수 없으면 중단
    if (!folderList || !linkList) return;

    folderList.innerHTML = '';
    linkList.innerHTML = '';

    // 1. 폴더 사이드바 렌더링
    bookmarks.forEach((folder, index) => {
        const fDiv = document.createElement('div');
        fDiv.className = `bm-folder ${folder.id === currentFolderId ? 'active' : ''}`;
        fDiv.draggable = true;
        
        fDiv.innerHTML = `
            <span class="bm-drag-handle">⋮⋮</span>
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${folder.name}</span>
            <div class="bm-actions">
                <button class="bm-btn-icon" onclick="event.stopPropagation(); editFolder('${folder.id}')">✏️</button>
                <button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteFolder('${folder.id}')">🗑️</button>
            </div>
        `;

        fDiv.onclick = () => { currentFolderId = folder.id; renderBookmarks(); };
        
        // 폴더 드래그 이벤트
        fDiv.ondragstart = (e) => { e.dataTransfer.setData('fIdx', index); fDiv.classList.add('dragging'); };
        fDiv.ondragend = () => fDiv.classList.remove('dragging');
        fDiv.ondragover = (e) => { e.preventDefault(); fDiv.classList.add('drag-over'); };
        fDiv.ondragleave = () => fDiv.classList.remove('drag-over');
        fDiv.ondrop = (e) => {
            e.preventDefault();
            fDiv.classList.remove('drag-over');
            const from = e.dataTransfer.getData('fIdx');
            if (from !== "" && from !== index.toString()) {
                const item = bookmarks.splice(from, 1)[0];
                bookmarks.splice(index, 0, item);
                saveBookmarksToFirebase();
            }
        };

        folderList.appendChild(fDiv);
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'bm-add-btn';
    addFolderBtn.innerHTML = '+ 새 폴더 추가';
    addFolderBtn.onclick = addNewFolder;
    folderList.appendChild(addFolderBtn);

    // 2. 메인 링크 영역 렌더링
    const activeFolder = bookmarks.find(f => f.id === currentFolderId);
    if (activeFolder) {
        titleText.innerHTML = `📂 ${activeFolder.name}`;
        const links = activeFolder.links || [];
        
        if (links.length === 0) {
            linkList.innerHTML = '<div style="text-align:center; padding:60px; color:#94a3b8; font-weight:700;">이 폴더에 저장된 링크가 없습니다.</div>';
        } else {
            links.forEach((link, lIdx) => {
                const card = document.createElement('div');
                card.className = 'bm-link-card';
                card.draggable = true;
                
                card.innerHTML = `
                    <span class="bm-drag-handle">⋮⋮</span>
                    <div class="bm-link-info">
                        <span class="bm-link-name">${link.name}</span>
                        <a href="${link.url}" target="_blank" class="bm-link-url">${link.url}</a>
                    </div>
                    <div class="bm-actions">
                        <button class="bm-btn-icon" title="열기" onclick="window.open('${link.url}', '_blank')">🚀</button>
                        <button class="bm-btn-icon" title="수정" onclick="openEditForm('${link.id}')">✏️</button>
                        <button class="bm-btn-icon del" title="삭제" onclick="deleteLink('${activeFolder.id}', '${link.id}')">🗑️</button>
                    </div>
                `;

                // 링크 드래그 이벤트
                card.ondragstart = (e) => { e.dataTransfer.setData('lIdx', lIdx); card.classList.add('dragging'); };
                card.ondragend = () => card.classList.remove('dragging');
                card.ondragover = (e) => { e.preventDefault(); card.classList.add('drag-over'); };
                card.ondragleave = () => card.classList.remove('drag-over');
                card.ondrop = (e) => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    const from = e.dataTransfer.getData('lIdx');
                    if (from !== "" && from !== lIdx.toString()) {
                        const item = activeFolder.links.splice(from, 1)[0];
                        activeFolder.links.splice(lIdx, 0, item);
                        saveBookmarksToFirebase();
                    }
                };

                linkList.appendChild(card);
            });
        }
    }
}

// --- 보조 함수들 (수정 없음) ---
window.addNewFolder = function() {
    const name = prompt('새 폴더 이름을 입력하세요:');
    if (name && name.trim()) {
        const newId = 'f_' + Date.now();
        bookmarks.push({ id: newId, name: name.trim(), links: [] });
        currentFolderId = newId;
        saveBookmarksToFirebase();
    }
};

window.editFolder = function(id) {
    const folder = bookmarks.find(f => f.id === id);
    if (!folder) return;
    const newName = prompt('폴더 이름을 수정하세요:', folder.name);
    if (newName && newName.trim() && newName !== folder.name) {
        folder.name = newName.trim();
        saveBookmarksToFirebase();
    }
};

window.deleteFolder = function(id) {
    if (bookmarks.length <= 1) return alert('최소 1개의 폴더는 유지해야 합니다.');
    if (confirm('폴더를 삭제하면 내부 링크가 모두 사라집니다. 진행하시겠습니까?')) {
        bookmarks = bookmarks.filter(f => f.id !== id);
        saveBookmarksToFirebase();
    }
};

window.toggleAddForm = function(show) {
    const form = document.getElementById('bm_add_form');
    if (form) form.style.display = show ? 'flex' : 'none';
    if (!show) editingLinkId = null;
};

window.openAddForm = function() {
    editingLinkId = null;
    document.getElementById('bm_form_title').innerText = "🔗 링크 추가";
    document.getElementById('bm_save_btn').innerText = "저장하기";
    document.getElementById('bm_input_name').value = '';
    document.getElementById('bm_input_url').value = '';
    toggleAddForm(true);
};

window.openEditForm = function(linkId) {
    const folder = bookmarks.find(f => f.id === currentFolderId);
    const link = folder?.links?.find(l => l.id === linkId);
    if (!link) return;
    editingLinkId = linkId;
    document.getElementById('bm_form_title').innerText = "✏️ 링크 수정";
    document.getElementById('bm_save_btn').innerText = "수정완료";
    document.getElementById('bm_input_name').value = link.name;
    document.getElementById('bm_input_url').value = link.url;
    toggleAddForm(true);
};

window.saveNewLink = function() {
    const name = document.getElementById('bm_input_name').value.trim();
    let url = document.getElementById('bm_input_url').value.trim();
    if (!name || !url) return alert('모두 입력해주세요.');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const folder = bookmarks.find(f => f.id === currentFolderId);
    if (!folder) return;

    if (editingLinkId) {
        const link = folder.links.find(l => l.id === editingLinkId);
        if (link) { link.name = name; link.url = url; }
    } else {
        if (!folder.links) folder.links = [];
        folder.links.push({ id: 'l_' + Date.now(), name, url });
    }
    saveBookmarksToFirebase();
    toggleAddForm(false);
};

window.deleteLink = function(folderId, linkId) {
    if (confirm('이 링크를 삭제하시겠습니까?')) {
        const folder = bookmarks.find(f => f.id === folderId);
        if (folder) {
            folder.links = folder.links.filter(l => l.id !== linkId);
            saveBookmarksToFirebase();
        }
    }
};
