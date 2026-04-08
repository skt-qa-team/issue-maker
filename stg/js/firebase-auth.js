const provider = new firebase.auth.GoogleAuthProvider();

function login() {
    firebase.auth().signInWithPopup(provider).catch((error) => {
        console.error("Login Error:", error);
        alert("로그인에 실패했습니다.");
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        location.reload();
    });
}

function handleUserStatus(user) {
    if (!user) {
        showAuthOverlay("login");
        return;
    }

    const userRef = firebase.database().ref('users/' + user.uid);
    
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();

        if (!userData) {
            const newUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                status: "pending",
                requestedAt: firebase.database.ServerValue.TIMESTAMP
            };
            userRef.set(newUser);
        } else if (userData.status === "approved") {
            hideAuthOverlay();
            updateUserPresence(user);
            fixLegacyUI(); 
            // ✨ 추가: 승인 완료 시 접속자 명단 강제 갱신 트리거
            if (typeof renderPresence === 'function') {
                setTimeout(renderPresence, 1000); 
            }
        } else if (userData.status === "pending") {
            showAuthOverlay("pending");
        } else {
            showAuthOverlay("rejected");
        }
    });
}

function fixLegacyUI() {
    setTimeout(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.includes('대기중')) {
                node.nodeValue = node.nodeValue.replace('대기중', '온라인');
                if (node.parentElement) {
                    node.parentElement.style.color = '#10b981';
                    node.parentElement.style.fontWeight = '800';
                }
            }
        }
        
        const walker2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node2;
        while ((node2 = walker2.nextNode())) {
            if (node2.nodeValue.includes('V21.11')) {
                node2.nodeValue = node2.nodeValue.replace('V21.11', 'V21.18');
            }
        }
    }, 800);
}

function showAuthOverlay(mode) {
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        document.body.appendChild(overlay);
    }

    document.body.classList.add('auth-locked');
    overlay.style.display = 'flex';

    if (mode === "login") {
        overlay.innerHTML = `
            <div class="auth-box">
                <h2>🔒 접근 제한</h2>
                <p>이 도구는 승인된 인원만 사용할 수 있습니다.<br>로그인 후 승인을 요청해 주세요.</p>
                <button onclick="login()" class="btn-login-google">Google 계정으로 로그인</button>
            </div>
        `;
    } else if (mode === "pending") {
        overlay.innerHTML = `
            <div class="auth-box">
                <h2>⏳ 승인 대기 중</h2>
                <p>접근 권한을 요청했습니다.<br>관리자(대장님)의 승인이 완료될 때까지 잠시만 기다려 주세요.</p>
                <button onclick="logout()" class="btn-logout-sub">다른 계정으로 로그인</button>
            </div>
        `;
    } else if (mode === "rejected") {
        overlay.innerHTML = `
            <div class="auth-box">
                <h2>🚫 접근 거부</h2>
                <p>이 계정은 사용 권한이 거부되었습니다.</p>
                <button onclick="logout()" class="btn-logout-sub">로그아웃</button>
            </div>
        `;
    }
}

function hideAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('auth-locked');
}

function updateUserPresence(user) {
    const presenceRef = firebase.database().ref('presence/' + user.uid);
    presenceRef.set({
        name: user.displayName,
        photo: user.photoURL,
        lastActive: firebase.database.ServerValue.TIMESTAMP
    });
    presenceRef.onDisconnect().remove();
    
    // ✨ 추가: 내 정보가 등록된 직후 전체 명단을 한 번 더 불러오도록 강제 실행
    firebase.database().ref('presence').off('value'); // 중복 리스너 방지
    firebase.database().ref('presence').on('value', (snapshot) => {
        if (typeof renderPresence === 'function') {
            renderPresence();
        }
    });
}

firebase.auth().onAuthStateChanged((user) => {
    handleUserStatus(user);
});
