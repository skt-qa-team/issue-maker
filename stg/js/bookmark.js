var ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";
let currentUserUid = null;

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) currentUserUid = user.uid;
        else currentUserUid = null;
    });

    const modalHtml = `
    <div class="modal-overlay" id="bookmarkModal" style="display:none;">
        <div class="modal-content modal-bm">
            <div class="bm-header">
                <div class="bm-header-title-group">
                    <h2 class="bm-title">🔖 공용 북마크 센터</h2>
                    <span class="bm-badge">SYNC LIVE</span>
                </div>
                <button class="close-btn bm-close-btn" onclick="closeBookmarkModal()">×</button>
            </div>
            <div class="bm-body">
                <div class="bm-sidebar" id="bm_folder_list"></div>
                <div class="bm-main">
                    <div class="bm-add-link-form" id="bm_add_form">
                        <h4 id="bm_form_title" class="bm-form-title">🔗 링크 추가</h4>
                        <input type="text" id="bm_input_name" class="bm-input" placeholder="사이트 닉네임">
                        <input type="text" id="bm_input_url" class="bm-input" placeholder="URL (예: https://...)">
                        <div class="bm-form-actions">
                            <button class="bm-btn-icon-text" onclick="toggleAddForm(false)">취소</button>
                            <button class="bm-btn-primary" id="bm_save_btn" onclick="saveNewLink()">저장하기</button>
                        </div>
                    </div>
                    <div class="bm-folder-header">
                        <h3 id="bm_current_folder_title" class="bm-current-folder-title">📂 폴더를 선택하세요</h3>
                        <button class="bm-btn-primary bm-btn-sm" onclick="openAddForm()">+ 링크 추가</button>
                    </div>
                    <div id="bm_link_list" class="bm-link-list"></div>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

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

    const handleEnter = (e) => {
        if (e.key === 'Enter') saveNewLink();
    };
    document.getElementById('bm_input_name').addEventListener('keyup', handleEnter);
    document.getElementById('bm_input_url').addEventListener('keyup', handleEnter);

    initSharedBookmarks();
});

let bookmarks = [];
let currentFolderId = null;
let editingLinkId = null;

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
    firebase.database().ref('shared_bookmarks').set(bookmarks);
}

window.openBookmarkModal = () => {
    document.getElementById('bookmarkModal').style.display = 'flex';
    renderBookmarks();
};

window.closeBookmarkModal = () => {
    document.getElementById('bookmarkModal').style.display = 'none';
};

function renderBookmarks() {
    const fList = document.getElementById('bm_folder_list');
    const lList = document.getElementById('bm_link_list');
    const titleText = document.getElementById('bm_current_folder_title');
    if (!fList || !lList || document.getElementById('bookmarkModal').style.display === 'none') return;

    fList.innerHTML = '';
    lList.innerHTML = '';

    const folderFragment = document.createDocumentFragment();

    bookmarks.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = `bm-folder ${f.id === currentFolderId ? 'active' : ''}`;
        div.draggable = true;
        
        const deleteFolderBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteFolder('${f.id}')">🗑️</button>` : '';
        
        div.innerHTML = `<span class="bm-drag-handle">⋮⋮</span> <span class="bm-folder-name">${f.name}</span>
                        <div class="bm-actions">
                            <button class="bm-btn-icon" onclick="event.stopPropagation(); editFolder('${f.id}')">✏️</button>
                            ${deleteFolderBtn}
                        </div>`;
        div.onclick = () => { currentFolderId = f.id; renderBookmarks(); };
        
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
        titleText.innerHTML = `📂 ${activeF.name}`;
        const linkFragment = document.createDocumentFragment();
        
        activeF.links.forEach((l, lIdx) => {
            const card = document.createElement('div');
            card.className = 'bm-link-card';
            card.draggable = true;
            card.onclick = () => window.open(l.url, '_blank');
            
            const deleteLinkBtn = currentUserUid === ADMIN_UID ? `<button class="bm-btn-icon del" onclick="event.stopPropagation(); deleteLink('${activeF.id}', '${l.id}')">🗑️</button>` : '';

            card.innerHTML = `<span class="bm-drag-handle" onclick="event.stopPropagation()">⋮⋮</span>
                             <div class="bm-link-info"><b>${l.name}</b><small>${l.url}</small></div>
                             <div class="bm-actions" onclick="event.stopPropagation()">
                                <button class="bm-btn-icon" onclick="openEditForm('${l.id}')">✏️</button>
                                ${deleteLinkBtn}
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
            linkFragment.appendChild(card);
        });
        lList.appendChild(linkFragment);
    } else {
        titleText.innerHTML = `📂 폴더를 선택하세요`;
    }
}

window.addNewFolder = () => {
    const name = prompt('새 폴더 이름:');
    if (name) { bookmarks.push({ id: 'f_'+Date.now(), name, links: [] }); saveBookmarksToFirebase(); }
};

window.editFolder = (id) => {
    const f = bookmarks.find(x => x.id === id);
    if (!f) return;
    const n = prompt('폴더 이름 수정:', f.name);
    if (n) { f.name = n; saveBookmarksToFirebase(); }
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
    document.getElementById('bm_add_form').style.display = s ? 'flex' : 'none';
    if (!s) editingLinkId = null;
};

window.openAddForm = () => { 
    editingLinkId = null; 
    document.getElementById('bm_form_title').innerText = "🔗 링크 추가"; 
    document.getElementById('bm_input_name').value = '';
    document.getElementById('bm_input_url').value = '';
    toggleAddForm(true); 
    setTimeout(() => document.getElementById('bm_input_name').focus(), 50);
};

window.openEditForm = (id) => {
    const l = bookmarks.find(f => f.id === currentFolderId).links.find(x => x.id === id);
    if (!l) return;
    editingLinkId = id;
    document.getElementById('bm_form_title').innerText = "✏️ 링크 수정";
    document.getElementById('bm_input_name').value = l.name;
    document.getElementById('bm_input_url').value = l.url;
    toggleAddForm(true);
    setTimeout(() => document.getElementById('bm_input_name').focus(), 50);
};

window.saveNewLink = () => {
    const n = document.getElementById('bm_input_name').value.trim();
    let u = document.getElementById('bm_input_url').value.trim();
    if (!n || !u) return;
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
