const firebaseConfig = {
    apiKey: "AIzaSyABC8d0MA-JVpc9muPo1pjAnCp6xSabckw",
    authDomain: "skm-issue-helper.firebaseapp.com",
    databaseURL: "https://skm-issue-helper-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "skm-issue-helper",
    storageBucket: "skm-issue-helper.firebasestorage.app",
    messagingSenderId: "315338055920",
    appId: "1:315338055920:web:bd1129cc9afb1569aba235",
    measurementId: "G-98H9S1FQB0"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

let currentUserId = null;
let isAnonymousUser = true;
const anonColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
let myAnonName = sessionStorage.getItem('anonName') || ("동료_" + Math.random().toString(36).substring(7, 10).toUpperCase());
let myAnonColor = sessionStorage.getItem('anonColor') || anonColors[Math.floor(Math.random() * anonColors.length)];
sessionStorage.setItem('anonName', myAnonName);
sessionStorage.setItem('anonColor', myAnonColor);

function initPresenceSystem() {
    const allUsersRef = database.ref('presence');
    
    // UI 업데이트 로직 (화면 조각이 늦게 오더라도 에러가 나지 않도록 내부에서 예외 처리)
    allUsersRef.on('value', (snapshot) => {
        const list = document.getElementById('presence-list');
        if (!list) return; 
        
        list.innerHTML = '';
        const users = snapshot.val();
        if (users) {
            Object.keys(users).forEach((id) => {
                const userData = users[id];
                const isMe = (id === currentUserId);
                let avatarContent = userData.photo ? `<img src="${userData.photo}" alt="p">` : (isMe ? "Me" : userData.name.charAt(0));
                list.innerHTML += `<div class="user-avatar" style="background: ${userData.color || '#cbd5e1'}; ${isMe ? 'border-color: #3b82f6;' : ''}" data-name="${userData.name}">${avatarContent}</div>`;
            });
        }
    });

    // 로그인 상태 감지 (UI와 무관하게 항상 실행되어야 함)
    auth.onAuthStateChanged((user) => {
        // UI 버튼 변경은 화면에 버튼이 있을 때만 시도
        const icon = document.getElementById('auth-btn-icon');
        const label = document.getElementById('auth-btn-label');
        
        if (user) {
            currentUserId = user.uid;
            const myUserRef = database.ref('presence/' + currentUserId);
            
            if (user.isAnonymous) {
                isAnonymousUser = true;
                if(label) label.innerText = '로그인';
                if(icon) icon.style.background = '#ef4444';
                myUserRef.set({ name: myAnonName, color: myAnonColor, photo: "", lastActive: firebase.database.ServerValue.TIMESTAMP });
            } else {
                isAnonymousUser = false;
                if(label) label.innerText = '로그아웃';
                if(icon) icon.style.background = '#3b82f6';
                myUserRef.set({ name: user.displayName, photo: user.photoURL, color: "#3b82f6", lastActive: firebase.database.ServerValue.TIMESTAMP });
                
                // 로그인 확인 시 클라우드 데이터 동기화
                syncFromCloud(currentUserId);
            }
            myUserRef.onDisconnect().remove();
        } else {
            auth.signInAnonymously();
        }
    });
}

function syncFromCloud(uid) {
    // 1. 설정값 동기화
    database.ref('users/' + uid + '/settings').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('qa_system_config_master', JSON.stringify(snapshot.val()));
            
            // 안전장치: 화면 조각(DOM)이 완전히 로드될 때까지 기다렸다가 단말기 렌더링
            const checkDom = setInterval(() => {
                if (document.getElementById('osType')) {
                    clearInterval(checkDom);
                    // 클라우드 데이터를 가져왔으므로 초기 렌더링 상태로 깃발 초기화 (기본 단말기 자동 체크를 위함)
                    if (typeof isInitialRender !== 'undefined') {
                        isInitialRender = true; 
                    }
                    if (typeof syncEnvironmentByOS === 'function') syncEnvironmentByOS();
                }
            }, 50);
        }
    });

    // 2. KPI 데이터 동기화
    database.ref('users/' + uid + '/kpi').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('skm_kpi_data', JSON.stringify(snapshot.val()));
            // 모달 조각이 로드된 후에 KPI 데이터 삽입
            const checkKpi = setInterval(() => {
                if (document.getElementById('def_blocker')) {
                    clearInterval(checkKpi);
                    if (typeof loadKpiLocal === 'function') loadKpiLocal();
                }
            }, 50);
        }
    });
}

function toggleAuth() { 
    if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut(); 
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
}
