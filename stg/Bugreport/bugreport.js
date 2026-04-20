window.bugCurrentPage = 1;
window.bugItemsPerPage = 5;
window.bugDataCache = [];

document.addEventListener('componentsLoaded', () => {
    window.initBugBoard();
});

document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.id === 'btn-open-bug-modal') window.openBugReportModal();
    if (target.id === 'btn-close-bug-modal' || target.id === 'btn-close-bug-top') window.closeBugReportModal();
    if (target.id === 'btn-submit-bug') window.submitBugReport();
    
    if (target.classList.contains('pg-btn')) {
        const page = parseInt(target.dataset.page);
        if (page) window.changeBugPage(page);
    }
});

window.initBugBoard = () => {
    if (typeof firebase === 'undefined') return;
    
    const bugRef = firebase.database().ref('system_bugs');
    bugRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            window.bugDataCache = [];
        } else {
            window.bugDataCache = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp);
        }
        window.renderBugBoard();
    });
};

window.openBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('d-none');
        setTimeout(() => modal.classList.add('active'), 10);
        window.bugCurrentPage = 1;
        window.renderBugBoard();
    }
};

window.closeBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('d-none');
            const desc = document.getElementById('bug_description');
            if (desc) desc.value = '';
        }, 300);
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
        timestamp: firebase.database().ServerValue.TIMESTAMP
    };

    firebase.database().ref('system_bugs').push(bugData)
        .then(() => {
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 등록되었습니다.');
            if (descEl) descEl.value = '';
            window.bugCurrentPage = 1;
        })
        .catch((error) => {
            console.error("Bug Report Error:", error);
            if (typeof window.showToast === 'function') window.showToast('❌ 전송 실패');
        });
};

window.renderBugBoard = () => {
    const container = document.getElementById('bug_list_container');
    const pagination = document.getElementById('bug_pagination');
    if (!container) return;

    if (window.bugDataCache.length === 0) {
        container.innerHTML = '<p class="bug-empty-text">아직 제보된 버그가 없습니다. 🧹</p>';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    const startIndex = (window.bugCurrentPage - 1) * window.bugItemsPerPage;
    const endIndex = startIndex + window.bugItemsPerPage;
    const pagedData = window.bugDataCache.slice(startIndex, endIndex);

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
                    data-page="${i}">${i}</button>
        `;
    }
    pagination.innerHTML = pgHtml;
};

window.changeBugPage = (page) => {
    window.bugCurrentPage = page;
    window.renderBugBoard();
};

window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
