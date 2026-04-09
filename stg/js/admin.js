// 스크린샷에서 확인된 대장님의 고유 Firebase UID
const ADMIN_UID = "4LLzBg1Y9zOhcXAGHJK8OLYoUCQ2"; 

document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // ⚡ 디버깅용: 접속 시 화면에 내 UID를 무조건 띄워봄
            console.log("현재 접속한 UID:", user.uid);
            console.log("코드에 적힌 UID:", ADMIN_UID);
            
            if (user.uid === ADMIN_UID) {
                initAdminPanel();
            } else {
                console.error("❌ 대장님 UID와 일치하지 않아 관리자 버튼을 숨깁니다.");
            }
        }
    });
});

function initAdminPanel() {
    // 1. 헤더에 관리자 버튼 주입
    const injectInterval = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.btn-admin')) {
            clearInterval(injectInterval);
            const btn = document.createElement('button');
            btn.className = 'btn-admin';
            btn.innerHTML = '👑 멤버관리';
            btn.style.cssText = "background: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer; margin-right: 10px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);";
            btn.onclick = openAdminModal;
            topBarBtns.prepend(btn);
        }
    }, 100);

    // 2. 관리자 모달 UI HTML
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
        if (!users) return list.innerHTML = '<p style="text-align:center;">가입한 멤버가 없습니다.</p>';

        Object.keys(users).forEach(uid => {
            const u = users[uid];
            const div = document.createElement('div');
            div.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:15px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;";
            
            // 상태별 라벨 색상 설정
            let statusColor = u.status === 'approved' ? '#10b981' : (u.status === 'pending' ? '#f59e0b' : '#ef4444');
            let statusText = u.status === 'approved' ? '승인됨' : (u.status === 'pending' ? '대기중' : '거부됨');

            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${u.photoURL || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    <div>
                        <div style="font-weight:800; color:#1e293b;">${u.displayName || '이름 없음'} ${uid === ADMIN_UID ? '<span style="font-size:0.7rem;">(나)</span>' : ''}</div>
                        <div style="font-size:0.8rem; color:#64748b;">${u.email}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.75rem; font-weight:700; color:white; background:${statusColor}; padding:4px 8px; border-radius:6px;">${statusText}</span>
                    <select onchange="changeUserStatus('${uid}', this.value)" style="padding:6px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.85rem; cursor:pointer; font-weight:700; color:#334155; background:white;">
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

// 상태 업데이트 통신 함수
window.changeUserStatus = function(uid, newStatus) {
    if(!newStatus) return;
    if(confirm('이 멤버의 접근 권한 상태를 변경하시겠습니까?')) {
        firebase.database().ref('users/' + uid).update({ status: newStatus }).then(() => {
            if(typeof window.showToast === 'function') window.showToast('✅ 상태가 업데이트 되었습니다.');
            loadUsers(); // 갱신된 리스트 재로드
        }).catch(err => alert("권한이 부족합니다. 보안 규칙을 확인하세요."));
    }
};
