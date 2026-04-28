window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.FIREBASE_CONFIG = {
    apiKey: "AIzaSyABC8d0MA-JVpc9muPo1pjAnCp6xSabckw",
    authDomain: "skm-issue-helper.firebaseapp.com",
    databaseURL: "https://skm-issue-helper-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "skm-issue-helper",
    storageBucket: "skm-issue-helper.firebasestorage.app",
    messagingSenderId: "315338055920",
    appId: "1:315338055920:web:bd1129cc9afb1569aba235",
    measurementId: "G-98H9S1FQB0"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(window.QA_CORE.CONSTANTS.FIREBASE_CONFIG);
}

window.QA_CORE.Auth = {
    provider: typeof firebase !== 'undefined' ? new firebase.auth.GoogleAuthProvider() : null,

    login: () => {
        if (!window.QA_CORE.Auth.provider) return;
        
        const loginBtn = document.getElementById('btn-do-login');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "로그인 중...";
        }

        firebase.auth().signInWithPopup(window.QA_CORE.Auth.provider).catch((error) => {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Google 로그인";
            }
            if (window.QA_CORE.ErrorHandler) {
                window.QA_CORE.ErrorHandler.handle(error, 'Firebase Login');
            }
            if (window.QA_CORE.UI) {
                window.QA_CORE.UI.showToast("로그인에 실패했습니다.", "error");
            }
        });
    },

    logout: () => {
        if (typeof firebase === 'undefined') return;
        firebase.auth().signOut().then(() => {
            location.reload();
        });
    },

    toggle: () => {
        if (typeof firebase === 'undefined') return;
        const user = firebase.auth().currentUser;
        if (user) {
            if (confirm("로그아웃 하시겠습니까?")) window.QA_CORE.Auth.logout();
        } else {
            window.QA_CORE.Auth.login();
        }
    },

    handleUserStatus: (user) => {
        if (!user) {
            window.QA_CORE.Auth.showOverlay("login");
            return;
        }

        const userRef = firebase.database().ref('users/' + user.uid);
        userRef.on('value', (snapshot) => {
            const userData = snapshot.val();

            if (!userData) {
                const newUser = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || user.email.split('@')[0] || 'Unknown',
                    photoURL: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    status: "pending",
                    requestedAt: firebase.database.ServerValue.TIMESTAMP
                };
                userRef.set(newUser);
            } else {
                const status = userData.status;
                if (status === "approved") {
                    window.QA_CORE.Auth.hideOverlay();
                    window.QA_CORE.Auth.updatePresence(user);
                    window.QA_CORE.Auth.applyLegacyFixes();
                    if (window.QA_CORE.UI && typeof window.QA_CORE.UI.renderPresence === 'function') {
                        setTimeout(window.QA_CORE.UI.renderPresence, 500);
                    }
                } else {
                    window.QA_CORE.Auth.showOverlay(status === "rejected" ? "rejected" : "pending");
                }
            }
        }, (error) => {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Auth User Sync');
        });
    },

    applyLegacyFixes: () => {
        setTimeout(() => {
            const targetNodes = document.querySelectorAll('.menu-label, .version-info, .status-badge');
            targetNodes.forEach(node => {
                if (node.textContent.includes('대기중')) {
                    node.textContent = node.textContent.replace('대기중', '온라인');
                    node.classList.add('legacy-status-online');
                }
                if (node.textContent.includes('V21.11')) {
                    node.textContent = node.textContent.replace('V21.11', 'V21.18');
                }
            });
        }, 500);
    },

    showOverlay: (mode) => {
        let overlay = document.getElementById('auth-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auth-overlay';
            overlay.className = 'auth-overlay-container';
            
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'btn-do-login') window.QA_CORE.Auth.login();
                if (e.target.id === 'btn-do-logout') window.QA_CORE.Auth.logout();
            });
            
            document.body.appendChild(overlay);
        }

        document.body.classList.add('auth-locked');
        overlay.classList.add('auth-active');

        let contentHtml = '';
        if (mode === "login") {
            contentHtml = `
                <div class="auth-box">
                    <h2>🔒 Access Restricted</h2>
                    <p>승인된 인원만 이용 가능한 시스템입니다.<br>로그인 후 관리자 승인을 요청해 주세요.</p>
                    <button id="btn-do-login" class="btn-login-google">Google 로그인</button>
                </div>`;
        } else if (mode === "pending") {
            contentHtml = `
                <div class="auth-box">
                    <h2>⏳ Approval Pending</h2>
                    <p>계정 승인 요청이 전송되었습니다.<br>관리자의 승인이 완료될 때까지 기다려 주세요.</p>
                    <button id="btn-do-logout" class="btn-logout-sub">다른 계정으로 로그인</button>
                </div>`;
        } else if (mode === "rejected") {
            contentHtml = `
                <div class="auth-box">
                    <h2>🚫 Access Denied</h2>
                    <p>죄송합니다. 사용 권한이 거부되었습니다.<br>문의 사항은 관리자에게 연락 바랍니다.</p>
                    <button id="btn-do-logout" class="btn-logout-sub">로그아웃</button>
                </div>`;
        }
        overlay.innerHTML = contentHtml;
    },

    hideOverlay: () => {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.classList.remove('auth-active');
            document.body.classList.remove('auth-locked');
        }
    },

    updatePresence: (user) => {
        if (typeof firebase === 'undefined') return;
        const presenceRef = firebase.database().ref('presence/' + user.uid);
        const data = {
            name: user.displayName || user.email.split('@')[0] || 'Unknown',
            photo: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            lastActive: firebase.database.ServerValue.TIMESTAMP
        };
        
        presenceRef.set(data);
        presenceRef.onDisconnect().remove();
        
        const allPresenceRef = firebase.database().ref('presence');
        allPresenceRef.off('value');
        allPresenceRef.on('value', () => {
            if (window.QA_CORE.UI && typeof window.QA_CORE.UI.renderPresence === 'function') {
                window.QA_CORE.UI.renderPresence();
            }
        });
    },

    init: () => {
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged((user) => {
                window.QA_CORE.Auth.handleUserStatus(user);
            });
        }
    }
};

window.QA_CORE.Auth.init();
