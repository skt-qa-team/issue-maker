var ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("현재 접속한 UID:", user.uid);
            console.log("코드에 적힌 UID:", ADMIN_UID);
            if (user.uid === ADMIN_UID) {
                initAdminPanel();
            } else {
                console.error("대장님 UID와 일치하지 않아 관리자 버튼을 숨깁니다.");
            }
        }
    });
});

function initAdminPanel() {
    const injectInterval = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.admin-btn-wrapper')) {
            clearInterval(injectInterval);
            const wrapper = document.createElement('div');
            wrapper.className = 'menu-item-wrapper admin-btn-wrapper';
            wrapper.onclick = openAdminModal;
            const iconDiv = document.createElement('div');
            iconDiv.className = 'setting-btn-float admin-icon';
            iconDiv.innerHTML = '👑';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'menu-label';
            labelSpan.innerText = "멤버관리";
            wrapper.appendChild(iconDiv);
            wrapper.appendChild(labelSpan);
            topBarBtns.prepend(wrapper);
        }
    }, 100);

    const modalHtml = `
    <div class="modal-overlay" id="adminModal" style="display:none;">
        <div class="modal-content modal-admin">
            <div class="modal-header admin-header">
                <h2 class="admin-title">👑 멤버 승인 센터</h2>
                <button onclick="document.getElementById('adminModal').style.display='none'" class="close-btn admin-close-btn">×</button>
            </div>
            <div id="admin_user_list" class="admin-user-list"></div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
    loadUsers();
}

function loadUsers() {
    const list = document.getElementById('admin_user_list');
    list.innerHTML = '<p class="admin-loading-text">유저 데이터를 불러오는 중...</p>';
    firebase.database().ref('users').once('value').then(snapshot => {
        list.innerHTML = '';
        const users = snapshot.val();
        if (!users) {
            list.innerHTML = '<p class="admin-empty-text">가입한 멤버가 없습니다.</p>';
            return;
        }
        Object.keys(users).forEach(uid => {
            const u = users[uid];
            const div = document.createElement('div');
            div.className = 'admin-user-card';
            
            let statusClass = u.status === 'approved' ? 'status-approved' : (u.status === 'pending' ? 'status-pending' : 'status-rejected');
            let statusText = u.status === 'approved' ? '승인됨' : (u.status === 'pending' ? '대기중' : '거부됨');
            
            const photoUrl = (u.photoURL && u.photoURL !== 'undefined') ? u.photoURL : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            const displayName = (u.displayName && u.displayName !== 'undefined') ? u.displayName : (u.email ? u.email.split('@')[0] : '알 수 없음');
            const emailStr = (u.email && u.email !== 'undefined') ? u.email : '이메일 없음';
            const meBadge = uid === ADMIN_UID ? '<span class="admin-badge-me">나</span>' : '';
            
            div.innerHTML = `
                <div class="admin-user-info">
                    <img src="${photoUrl}" class="admin-user-avatar">
                    <div class="admin-user-details">
                        <div class="admin-user-name">${displayName} ${meBadge}</div>
                        <div class="admin-user-email">${emailStr}</div>
                    </div>
                </div>
                <div class="admin-action-group">
                    <span class="admin-status-badge ${statusClass}">${statusText}</span>
                    <select onchange="changeUserStatus('${uid}', this.value)" class="admin-status-select">
                        <option value="" disabled selected>상태 변경</option>
                        <option value="approved">✅ 승인 (Approve)</option>
                        <option value="pending">⏳ 대기 (Pending)</option>
                        <option value="rejected">🚫 거부 (Reject)</option>
                    </select>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

window.changeUserStatus = function(uid, newStatus) {
    if(!newStatus) return;
    if(confirm('이 멤버의 접근 권한 상태를 변경하시겠습니까?')) {
        firebase.database().ref('users/' + uid).update({ status: newStatus }).then(() => {
            if(typeof window.showToast === 'function') window.showToast('✅ 상태가 업데이트 되었습니다.');
            loadUsers();
        }).catch(err => alert("권한이 부족합니다. 보안 규칙을 확인하세요."));
    }
};
