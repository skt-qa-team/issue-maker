window.bugCurrentPage = 1;
window.bugItemsPerPage = 5;
window.bugDataCache = [];
window.editingBugId = null;

if (!window.ADMIN_UID) {
    window.ADMIN_UID = '4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2';
}

document.addEventListener('componentsLoaded', () => {
    window.initBugBoard();
});

document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.id === 'btn-open-bug-modal') window.openBugReportModal();
    if (target.id === 'btn-close-bug-modal' || target.id === 'btn-close-bug-top') window.closeBugReportModal();
    if (target.id === 'btn-submit-bug') window.submitBugReport();
    
    if (target.classList.contains('bug-edit-small-btn')) {
        window.startEditBug(target.dataset.id);
    }

    if (target.classList.contains('bug-delete-small-btn')) {
        window.deleteBugReport(target.dataset.id);
    }

    if (target.classList.contains('pg-btn')) {
        const page = parseInt(target.dataset.page);
        if (page) window.changeBugPage(page);
    }
});

window.initBugBoard = () => {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.database) return;

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
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
            }, (error) => {
                console.error("Firebase Read Error:", error);
                const container = document.getElementById('bug_list_container');
                if (container) {
                    container.innerHTML = '<p class="bug-empty-text">🔒 접근 권한이 없거나 승인 대기 중입니다.</p>';
                }
            });
        } else {
            window.bugDataCache = [];
            window.renderBugBoard();
        }
    });
};

window.openBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('d-none');
        setTimeout(() => modal.classList.add('active'), 10);
        window.bugCurrentPage = 1;
        window.cancelBugEdit();
        window.renderBugBoard();
    }
};

window.closeBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('d-none');
            window.cancelBugEdit();
        }, 300);
    }
};

window.startEditBug = (id) => {
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;

    const descEl = document.getElementById('bug_description');
    const submitBtn = document.getElementById('btn-submit-bug');

    if (descEl && submitBtn) {
        window.editingBugId = id;
        descEl.value = bug.description;
        submitBtn.textContent = '수정완료';
        submitBtn.classList.replace('bug-btn-primary', 'bug-btn-update');
        descEl.focus();
        
        document.querySelector('.bug-modal-body').scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.cancelBugEdit = () => {
    window.editingBugId = null;
    const descEl = document.getElementById('bug_description');
    const submitBtn = document.getElementById('btn-submit-bug');
    
    if (descEl) descEl.value = '';
    if (submitBtn) {
        submitBtn.textContent = '제보하기';
        submitBtn.classList.add('bug-btn-primary');
        submitBtn.classList.remove('bug-btn-update');
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
    if (!user) {
        if (typeof window.showToast === 'function') window.showToast('🔒 로그인이 필요합니다.');
        return;
    }

    if (window.editingBugId) {
        firebase.database().ref(`system_bugs/${window.editingBugId}`).update({
            description: descriptionStr,
            lastUpdated: Date.now()
        }).then(() => {
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 수정되었습니다.');
            window.cancelBugEdit();
        });
    } else {
        const bugData = {
            reporter: {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0] || '익명'
            },
            description: descriptionStr,
            timestamp: Date.now()
        };

        firebase.database().ref('system_bugs').push(bugData).then(() => {
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 등록되었습니다.');
            if (descEl) descEl.value = '';
            window.bugCurrentPage = 1;
        });
    }
};

window.deleteBugReport = (id) => {
    if (!confirm('해당 제보를 영구적으로 삭제하시겠습니까?')) return;

    firebase.database().ref(`system_bugs/${id}`).remove().then(() => {
        if (typeof window.showToast === 'function') window.showToast('🗑️ 제보가 삭제되었습니다.');
    }).catch(error => {
        console.error(error);
        if (typeof window.showToast === 'function') window.showToast('❌ 삭제 실패');
    });
};

window.renderBugBoard = () => {
    const container = document.getElementById('bug_list_container');
    const pagination = document.getElementById('bug_pagination');
    const currentUser = firebase.auth().currentUser;
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
        const isAuthor = currentUser && bug.reporter && bug.reporter.uid === currentUser.uid;
        const isAdmin = currentUser && currentUser.uid === window.ADMIN_UID;

        let actionButtons = '';
        if (isAuthor) actionButtons += `<button class="bug-edit-small-btn" data-id="${bug.id}">수정</button>`;
        if (isAdmin) actionButtons += `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>`;

        html += `
            <div class="bug-post-card">
                <div class="bug-post-header">
                    <div class="bug-post-meta">
                        <span class="bug-post-author">👤 ${window.escapeHTML(bug.reporter.name)}</span>
                        <span class="bug-post-date">${date}</span>
                    </div>
                    <div class="bug-post-actions">
                        ${actionButtons}
                    </div>
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
