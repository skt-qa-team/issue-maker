const provider = new firebase.auth.GoogleAuthProvider();

function login() {
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            handleUserStatus(result.user);
        })
        .catch((error) => {
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
    
    userRef.once('value').then((snapshot) => {
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
            userRef.set(newUser).then(() => {
                showAuthOverlay("pending");
            });
        } else if (userData.status === "approved") {
            hideAuthOverlay();
            updateUserPresence(user);
        } else if (userData.status === "pending") {
            showAuthOverlay("pending");
        } else {
            showAuthOverlay("rejected");
        }
    });
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
}

firebase.auth().onAuthStateChanged((user) => {
    handleUserStatus(user);
});
