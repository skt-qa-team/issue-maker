document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-bookmark { background: #3b82f6; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }
        .btn-bookmark:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        #bookmarkModal .modal-content { max-width: 900px; width: 90%; display: flex; flex-direction: column; height: 80vh; padding: 0; overflow: hidden; background: var(--bg-color); }
        .bm-header { padding: 25px 35px; background: var(--panel-bg); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .bm-body { display: grid; grid-template-columns: 250px 1fr; flex: 1; overflow: hidden; }
        .bm-sidebar { background: var(--panel-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; overflow-y: auto; padding: 15px; gap: 8px; }
        .bm-main { padding: 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .bm-folder { padding: 12px 15px; border-radius: 8px; cursor: pointer; font-weight: 700; color: var(--text-sub); transition: 0.2s; display: flex; justify-content: space-between; align-items: center; border: 1px solid transparent; }
        .bm-folder:hover { background: #f1f5f9; }
        .bm-folder.active { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .bm-link-card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .bm-link-card:hover { border-color: #93c5fd; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); transform: translateY(-1px); }
        .bm-link-info { display: flex; flex-direction: column; gap: 4px; }
        .bm-link-name { font-weight: 800; color: var(--text-main); font-size: 1.05rem; }
        .bm-link-url { color: #64748b; font-size: 0.8rem; text-decoration: none; }
        .bm-link-url:hover { text-decoration: underline; color: #3b82f6; }
        .bm-actions { display: flex; gap: 8px; }
        .bm-btn-icon { background: transparent; border: none; cursor: pointer; color: #94a3b8; font-size: 1.1rem; padding: 4px; border-radius: 6px; transition: 0.2s; }
        .bm-btn-icon:hover { color: #ef4444; background: #fee2e2; }
        .bm-add-btn { width: 100%; padding: 12px; background: white; border: 1px dashed #cbd5e1; border-radius: 8px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; margin-top: auto; }
        .bm-add-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #f8fafc; }
        .bm-add-link-form { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: none; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .bm-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
        .bm-form-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .bm-btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
        .bm-btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    `;
    document.head.appendChild(style);

    const modalHtml = `
    <div class="modal-overlay" id="bookmarkModal" style="display:none; z-index: 6000;">
        <div class="modal-content">
            <div class="bm-header">
                <h2 style="margin:0; font-size:1.4rem;">🔖 북마크 매니저</h2>
                <button class="close-btn" style="position:static;" onclick="closeBookmarkModal()">×</button>
            </div>
            <div class="bm-body">
                <div class="bm-sidebar" id="bm_folder_list"></div>
                <div class="bm-main">
                    <div class="bm-add-link-form" id="bm_add_form">
                        <input type="text" id="bm_input_name" class="bm-input" placeholder="사이트 닉네임 (예: PRD 어드민 서버)">
                        <input type="text" id="bm_input_url" class="bm-input" placeholder="URL 입력 (예: https://...)">
                        <div class="bm-form-actions">
                            <button class="bm-btn-cancel" onclick="toggleAddForm(false)">취소</button>
                            <button class="bm-btn-primary" onclick="saveNewLink()">저장</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                        <h3 style="margin:0; color:var(--text-main);" id="bm_current_folder_title">선택된 폴더</h3>
                        <button class="bm-btn-primary" style="padding: 6px 12px; font-size:0.8rem;" onclick="toggleAddForm(true)">+ 링크 추가</button>
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

    initBookmarks();
});

let bookmarks = [];
let currentFolderId = null;

function initBookmarks() {
    const saved = localStorage.getItem('skm_bookmarks');
    if (saved) {
        bookmarks = JSON.parse(saved);
    } else {
        bookmarks = [
            { id: 'f_' + Date.now(), name: '📌 기본 북마크', links: [] }
        ];
        saveBookmarks();
    }
    if (bookmarks.length > 0) currentFolderId = bookmarks[0].id;
}

function saveBookmarks() {
    localStorage.setItem('skm_bookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
}

window.openBookmarkModal = function() {
    document.getElementById('bookmarkModal').style.display = 'flex';
    renderBookmarks();
};

window.closeBookmarkModal = function() {
    document.getElementById('bookmarkModal').style.display = 'none';
    toggleAddForm(false);
};

function renderBookmarks() {
    const folderList = document.getElementById('bm_folder_list');
    const linkList = document.getElementById('bm_link_list');
    const title = document.getElementById('bm_current_folder_title');

    folderList.innerHTML = '';
    linkList.innerHTML = '';

    bookmarks.forEach(folder => {
        const fDiv = document.createElement('div');
        fDiv.className = `bm-folder ${folder.id === currentFolderId ? 'active' : ''}`;
        fDiv.onclick = () => { currentFolderId = folder.id; renderBookmarks(); };
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = folder.name;
        fDiv.appendChild(nameSpan);

        const delBtn = document.createElement('button');
        delBtn.className = 'bm-btn-icon';
        delBtn.innerHTML = '🗑️';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteFolder(folder.id); };
        fDiv.appendChild(delBtn);

        folderList.appendChild(fDiv);
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'bm-add-btn';
    addFolderBtn.innerHTML = '+ 새 폴더 추가';
    addFolderBtn.onclick = addNewFolder;
    folderList.appendChild(addFolderBtn);

    const currentFolder = bookmarks.find(f => f.id === currentFolderId);
    if (currentFolder) {
        title.textContent = currentFolder.name;
        if (currentFolder.links.length === 0) {
            linkList.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8; font-weight:700;">저장된 링크가 없습니다. 우측 상단 버튼을 눌러 추가하세요.</div>';
        } else {
            currentFolder.links.forEach(link => {
                const card = document.createElement('div');
                card.className = 'bm-link-card';
                card.innerHTML = `
                    <div class="bm-link-info">
                        <span class="bm-link-name">${link.name}</span>
                        <a href="${link.url}" target="_blank" class="bm-link-url">${link.url}</a>
                    </div>
                    <div class="bm-actions">
                        <button class="bm-btn-icon" title="새 창으로 열기" onclick="window.open('${link.url}', '_blank')">🚀</button>
                        <button class="bm-btn-icon" title="삭제" onclick="deleteLink('${currentFolder.id}', '${link.id}')">🗑️</button>
                    </div>
                `;
                linkList.appendChild(card);
            });
        }
    }
}

window.addNewFolder = function() {
    const name = prompt('새 폴더 이름을 입력하세요:');
    if (name && name.trim()) {
        const newId = 'f_' + Date.now();
        bookmarks.push({ id: newId, name: name.trim(), links: [] });
        currentFolderId = newId;
        saveBookmarks();
    }
};

window.deleteFolder = function(id) {
    if (bookmarks.length <= 1) {
        alert('최소 1개의 폴더는 유지해야 합니다.');
        return;
    }
    if (confirm('이 폴더와 안의 모든 링크를 삭제하시겠습니까?')) {
        bookmarks = bookmarks.filter(f => f.id !== id);
        if (currentFolderId === id) currentFolderId = bookmarks[0].id;
        saveBookmarks();
    }
};

window.toggleAddForm = function(show) {
    const form = document.getElementById('bm_add_form');
    form.style.display = show ? 'flex' : 'none';
    if (show) {
        document.getElementById('bm_input_name').value = '';
        document.getElementById('bm_input_url').value = '';
        document.getElementById('bm_input_name').focus();
    }
};

window.saveNewLink = function() {
    const name = document.getElementById('bm_input_name').value.trim();
    let url = document.getElementById('bm_input_url').value.trim();
    
    if (!name || !url) {
        alert('닉네임과 URL을 모두 입력해주세요.');
        return;
    }
    
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const folder = bookmarks.find(f => f.id === currentFolderId);
    if (folder) {
        folder.links.push({ id: 'l_' + Date.now(), name, url });
        saveBookmarks();
        toggleAddForm(false);
        if(typeof window.showToast === 'function') window.showToast('🔖 북마크가 저장되었습니다.');
    }
};

window.deleteLink = function(folderId, linkId) {
    if (confirm('이 링크를 삭제하시겠습니까?')) {
        const folder = bookmarks.find(f => f.id === folderId);
        if (folder) {
            folder.links = folder.links.filter(l => l.id !== linkId);
            saveBookmarks();
        }
    }
};
