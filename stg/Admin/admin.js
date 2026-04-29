window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};
window.QA_CORE.CONSTANTS.ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";

window.QA_CORE.Admin = {
    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user && user.uid === window.QA_CORE.CONSTANTS.ADMIN_UID) {
                this.injectAdminButton();
            }
        });
    },

    injectAdminButton() {
        const checkExist = setInterval(() => {
            const topBarBtns = document.querySelector('.top-bar-btns');
            if (topBarBtns && !document.querySelector('.admin-btn-wrapper')) {
                clearInterval(checkExist);
                const wrapper = document.createElement('div');
                wrapper.className = 'menu-item-wrapper admin-btn-wrapper';
                wrapper.onclick = () => this.openModal();
                
                const iconDiv = document.createElement('div');
                iconDiv.className = 'setting-btn-float admin-icon';
                iconDiv.innerText = '👑';
                
                const labelSpan = document.createElement('span');
                labelSpan.className = 'menu-label';
                labelSpan.innerText = "멤버관리";
                
                wrapper.appendChild(iconDiv);
                wrapper.appendChild(labelSpan);
                topBarBtns.prepend(wrapper);
            }
        }, 100);
    },

    openModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.add('active');
            this.loadUsers();
        }
    },

    closeModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) modal.classList.remove('active');
    },

    loadUsers() {
        const list = document.getElementById('admin_user_list');
        if (!list) return;

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
                
                const statusClass = u.status === 'approved' ? 'status-approved' : (u.status === 'pending' ? 'status-pending' : 'status-rejected');
                const statusText = u.status === 'approved' ? '승인됨' : (u.status === 'pending' ? '대기중' : '거부됨');
                const photoUrl = (u.photoURL && u.photoURL !== 'undefined') ? u.photoURL : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                const displayName = (u.displayName && u.displayName !== 'undefined') ? window.QA_CORE.Utils.escapeHTML(u.displayName) : (u.email ? window.QA_CORE.Utils.escapeHTML(u.email.split('@')[0]) : '알 수 없음');
                const emailStr = (u.email && u.email !== 'undefined') ? window.QA_CORE.Utils.escapeHTML(u.email) : '이메일 없음';
                const meBadge = uid === window.QA_CORE.CONSTANTS.ADMIN_UID ? '<span class="admin-badge-me">나</span>' : '';
                
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
                        <select onchange="window.QA_CORE.Admin.changeUserStatus('${uid}', this.value)" class="admin-status-select">
                            <option value="" disabled selected>상태 변경</option>
                            <option value="approved">✅ 승인 (Approve)</option>
                            <option value="pending">⏳ 대기 (Pending)</option>
                            <option value="rejected">🚫 거부 (Reject)</option>
                        </select>
                    </div>
                `;
                list.appendChild(div);
            });
        }).catch(err => {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Admin Load Users');
        });
    },

    changeUserStatus(uid, newStatus) {
        if (!newStatus) return;
        
        if (confirm('이 멤버의 접근 권한 상태를 변경하시겠습니까?')) {
            const selectEl = event?.target;
            if (selectEl) selectEl.disabled = true;

            firebase.database().ref('users/' + uid).update({ status: newStatus }).then(() => {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 멤버 상태가 업데이트되었습니다.', 'success');
                this.loadUsers();
            }).catch(err => {
                if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Admin Change Status');
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 상태 업데이트 실패', 'error');
            }).finally(() => {
                if (selectEl) selectEl.disabled = false;
            });
        } else {
            if (event?.target) event.target.value = "";
        }
    }
};

window.QA_CORE.Utils = window.QA_CORE.Utils || {};
window.QA_CORE.Utils.escapeHTML = (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
};

window.QA_CORE.Admin.init();
