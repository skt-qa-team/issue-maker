const ADMIN_UID = "4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2";

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
            
            // 버튼 전체 래퍼 (아이콘 + 하단 텍스트 구조)
            const wrapper = document.createElement('button');
            wrapper.className = 'admin-btn-wrapper';
            wrapper.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; padding:0; margin-right:12px; transition:0.2s;";
            
            // 둥근 원형 아이콘
            const iconDiv = document.createElement('div');
            iconDiv.style.cssText = "width:38px; height:38px; border-radius:50%; background:#ef4444; color:white; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 2px 4px rgba(0,0,0,0.1); margin-bottom:4px; transition:transform 0.2s;";
            iconDiv.innerHTML = '👑';
            
            // 하단 텍스트 라벨
            const labelSpan = document.createElement('span');
            labelSpan.style.cssText = "font-size:0.7rem; color:#64748b; font-weight:700; white-space:nowrap; transition:color 0.2s;";
            labelSpan.innerText = "멤버관리";

            wrapper.appendChild(iconDiv);
            wrapper.appendChild(labelSpan);

            wrapper.onmouseenter = () => { 
                iconDiv.style.transform = 'translateY(-3px)'; 
                labelSpan.style.color = '#ef4444'; 
            };
            wrapper.onmouseleave = () => { 
                iconDiv.style.transform = 'translateY(0)'; 
                labelSpan.style.color = '#64748b'; 
            };
            wrapper.onclick = openAdminModal;
            
            topBarBtns.prepend(wrapper);
        }
    }, 100);

    const modalHtml = `
    <div class="modal-overlay" id="adminModal" style="display:none; z-index: 7000; background: rgba(0,0,0,0.7);">
        <div class="modal-content" style="max-width: 600px; width: 90%; background: #fff; border-radius: 12px; padding: 25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
                <h2 style="margin:0; color:#1e293b; font-size:1.3rem;">👑 멤버 승인 센터</h2>
                <button onclick="document.getElementById('adminModal').style.display='none'" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">×</button>
            </div>
            <div id="admin_user_list" style="max-height: 50vh; overflow-y: auto; display:flex; flex-direction:column; gap:12px;">
                </div>
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
    list.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">유저 데이터를 불러오는 중...</p>';
    
    firebase.database().ref('users').once('value').then(snapshot => {
        list.innerHTML = '';
        const users = snapshot.val();
        if (!users) {
            list.innerHTML = '<p style="text-align:center;">가입한 멤버가 없습니다.</p>';
            return;
        }

        Object.keys(users).forEach(uid => {
            const u = users[uid];
            const div = document.createElement('div');
            div.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:15px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; gap:10px;";
            
            let statusColor = u.status === 'approved' ? '#10b981' : (u.status === 'pending' ? '#f59e0b' : '#ef4444');
            let statusText = u.status === 'approved' ? '승인됨' : (u.status === 'pending' ? '대기중' : '거부됨');
            
            const photoUrl = (u.photoURL && u.photoURL !== 'undefined') ? u.photoURL : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            const displayName = (u.displayName && u.displayName !== 'undefined') ? u.displayName : (u.email ? u.email.split('@')[0] : '알 수 없음');
            const emailStr = (u.email && u.email !== 'undefined') ? u.email : '이메일 없음';
            const meBadge = uid === ADMIN_UID ? '<span style="font-size:0.7rem; color:#ef4444; border:1px solid #ef4444; padding:1px 4px; border-radius:4px; margin-left:4px;">나</span>' : '';

            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                    <img src="${photoUrl}" style="width:40px; height:40px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1); flex-shrink:0;">
                    <div style="min-width:0; overflow:hidden;">
                        <div style="font-weight:800; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${displayName} ${meBadge}</div>
                        <div style="font-size:0.8rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${emailStr}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <span style="font-size:0.75rem; font-weight:700; color:white; background:${statusColor}; padding:4px 8px; border-radius:6px; white-space:nowrap;">${statusText}</span>
                    <select onchange="changeUserStatus('${uid}', this.value)" style="padding:6px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.85rem; cursor:pointer; font-weight:700; color:#334155; background:white; white-space:nowrap;">
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
