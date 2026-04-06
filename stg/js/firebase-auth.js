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
    const list = document.getElementById('presence-list');
    if (!list) return;
    const allUsersRef = database.ref('presence');
    allUsersRef.on('value', (snapshot) => {
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
    auth.onAuthStateChanged((user) => {
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
                syncFromCloud(currentUserId);
            }
            myUserRef.onDisconnect().remove();
        } else auth.signInAnonymously();
    });
}

function syncFromCloud(uid) {
    database.ref('users/' + uid + '/settings').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('qa_system_config_master', JSON.stringify(snapshot.val()));
            if (typeof syncEnvironmentByOS === 'function') syncEnvironmentByOS();
        }
    });
    database.ref('users/' + uid + '/kpi').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('skm_kpi_data', JSON.stringify(snapshot.val()));
            if (typeof loadKpiLocal === 'function') loadKpiLocal();
        }
    });
}

function toggleAuth() { 
    if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut(); 
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
}
