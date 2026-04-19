// 게시판 상태 관리 변수
window.bugCurrentPage = 1;
window.bugItemsPerPage = 5;
window.bugDataCache = [];

document.addEventListener('componentsLoaded', () => {
    // 컴포넌트 로드 시 리스너 연결 (초기 1회)
    window.initBugBoard();
});

window.initBugBoard = () => {
    const bugRef = firebase.database().ref('system_bugs');
    bugRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            window.bugDataCache = [];
        } else {
            // 객체를 배열로 변환하고 최신순(내림차순) 정렬
            window.bugDataCache = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).reverse();
        }
        window.renderBugBoard();
    });
};

window.openBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('d-none');
        window.bugCurrentPage = 1; // 열 때마다 1페이지로 리셋
        window.renderBugBoard();
    }
};

window.closeBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.add('d-none');
        const desc = document.getElementById('bug_description');
        if (desc) desc.value = '';
    }
};

window.submitBugReport = () => {
    const descEl = document.getElementById('bug_description');
    const descriptionStr = descEl ? descEl.value.trim() : '';

    if (!descriptionStr) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 내용을 입력해 주세요.');
        return;
    }

    const user = firebase.auth().currentUser;
    const bugData = {
        reporter: user ? {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0] || '익명'
        } : { name: 'Anonymous' },
        description: descriptionStr,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    firebase.database().ref('system_bugs').push(bugData)
        .then(() => {
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 등록되었습니다.');
            if (descEl) descEl.value = '';
            window.bugCurrentPage = 1; // 등록 시 최신글 확인을 위해 1페이지로 이동
        })
        .catch((error) => {
            console.error("Bug Report Error:", error);
            if (typeof window.showToast === 'function') window.showToast('❌ 전송 실패');
        });
};

// 게시판 렌더링 엔진
window.renderBugBoard = () => {
    const container = document.getElementById('bug_list_container');
    const pagination = document.getElementById('bug_pagination');
    if (!container) return;

    if (window.bugDataCache.length === 0) {
        container.innerHTML = '<p class="bug-empty-text">아직 제보된 버그가 없습니다. 🧹</p>';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    // 페이징 계산
    const startIndex = (window.bugCurrentPage - 1) * window.bugItemsPerPage;
    const endIndex = startIndex + window.bugItemsPerPage;
    const pagedData = window.bugDataCache.slice(startIndex, endIndex);

    // 리스트 생성
    let html = '';
    pagedData.forEach(bug => {
        const date = new Date(bug.timestamp).toLocaleString();
        html += `
            <div class="bug-post-card">
                <div class="bug-post-header">
                    <span class="bug-post-author">👤 ${window.escapeHTML(bug.reporter.name)}</span>
                    <span class="bug-post-date">${date}</span>
                </div>
                <div class="bug-post-content">${window.escapeHTML(bug.description).replace(/\n/g, '<br>')}</div>
            </div>
        `;
    });
    container.innerHTML = html;

    // 페이지네이션 생성
    window.renderBugPagination();
};

window.renderBugPagination = () => {
    const pagination = document.getElementById('bug_pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(window.bugDataCache.length / window.bugItemsPerPage);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let pgHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pgHtml += `
            <button class="pg-btn ${i === window.bugCurrentPage ? 'active' : ''}" 
                    onclick="window.changeBugPage(${i})">${i}</button>
        `;
    }
    pagination.innerHTML = pgHtml;
};

window.changeBugPage = (page) => {
    window.bugCurrentPage = page;
    window.renderBugBoard();
};

// 유틸리티: XSS 방지
window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
