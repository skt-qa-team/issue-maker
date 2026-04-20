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
    if (target.id === 'btn-close-bug-top') window.closeBugReportModal();
    if (target.id === 'btn-submit-bug') window.submitBugReport();
    if (target.classList.contains('bug-edit-small-btn')) window.startEditBug(target.dataset.id);
    if (target.classList.contains('bug-delete-small-btn')) window.deleteBugReport(target.dataset.id);
    if (target.classList.contains('bug-status-btn')) {
        window.processBugWorkflow(target.dataset.id, target.dataset.status);
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
                window.bugDataCache = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => b.timestamp - a.timestamp) : [];
                window.renderBugBoard();
            });
            const userRef = firebase.database().ref('users');
            userRef.on('value', (snapshot) => {
                const usersData = snapshot.val();
                window.renderScoreDashboard(usersData);
            });
        }
    });
};

window.renderScoreDashboard = (usersData) => {
    const rankContainer = document.getElementById('score_rank_list');
    if (!rankContainer || !usersData) return;
    const sortedUsers = Object.entries(usersData)
        .map(([uid, data]) => {
            let name = data.nickname || data.name;
            if (!name && data.email) name = data.email.split('@')[0];
            return { name: name || '익명', score: data.qa_score || 0 };
        })
        .filter(u => u.score > 0)
        .sort((a, b) => b.score - a.score);
    if (sortedUsers.length === 0) {
        rankContainer.innerHTML = '<p class="bug-empty-text">기여 데이터가 없습니다. 🏁</p>';
        return;
    }
    rankContainer.innerHTML = sortedUsers.map((u, i) => `
        <div class="rank-item">
            <span class="rank-badge">TOP ${i + 1}</span>
            <span class="rank-name">${window.escapeHTML(u.name)}</span>
            <span class="rank-score">${u.score.toFixed(1)}pt</span>
        </div>
    `).join('');
};

window.submitBugReport = () => {
    const descEl = document.getElementById('bug_description');
    const typeEl = document.getElementById('bug_type');
    const descriptionStr = descEl ? descEl.value.trim() : '';
    const bugType = typeEl ? typeEl.value : 'ui';
    if (!descriptionStr) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 내용을 입력하세요.');
        return;
    }
    const user = firebase.auth().currentUser;
    if (!user) return;
    if (window.editingBugId) {
        firebase.database().ref(`system_bugs/${window.editingBugId}`).update({
            description: descriptionStr,
            type: bugType,
            status: 'pending',
            adminComment: null,
            lastUpdated: Date.now()
        }).then(() => {
            window.cancelBugEdit();
            if (typeof window.showToast === 'function') window.showToast('✅ 이슈가 업데이트되었습니다.');
        });
    } else {
        const bugData = {
            reporter: { uid: user.uid, name: user.displayName || user.email.split('@')[0], email: user.email },
            description: descriptionStr,
            type: bugType,
            status: 'pending',
            timestamp: Date.now()
        };
        firebase.database().ref('system_bugs').push(bugData).then(() => {
            descEl.value = '';
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 성공적으로 접수되었습니다.');
        });
    }
};

window.processBugWorkflow = (id, newStatus) => {
    const user = firebase.auth().currentUser;
    if (!user || user.uid !== window.ADMIN_UID) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    let comment = null;
    if (['done', 'rejected', 'no_issue', 'approved'].includes(newStatus)) {
        const promptMsg = newStatus === 'approved' ? '최종 승인 의견 (점수 부여)' : `[${newStatus.toUpperCase()}] 의견`;
        comment = prompt(`${promptMsg}을 남겨주세요:`, "");
        if (comment === null) return;
    }
    const updates = {};
    updates[`system_bugs/${id}/status`] = newStatus;
    if (comment !== null) updates[`system_bugs/${id}/adminComment`] = comment.trim() || null;
    if (newStatus === 'approved' && bug.reporter && bug.reporter.uid) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        firebase.database().ref(`users/${bug.reporter.uid}/qa_score`).transaction((curr) => (curr || 0) + points);
    }
    firebase.database().ref().update(updates).then(() => {
        const finalMsg = newStatus === 'approved' ? '🎉 최종 승인 및 점수 부여 완료!' : `상태가 [${newStatus}]으로 변경되었습니다.`;
        if (typeof window.showToast === 'function') window.showToast(finalMsg);
    });
};

window.deleteBugReport = (id) => {
    const user = firebase.auth().currentUser;
    if (!user || user.uid !== window.ADMIN_UID) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    if (!confirm('삭제하시겠습니까? 승인된 건은 점수도 회수됩니다.')) return;
    if (bug.status === 'approved' && bug.reporter && bug.reporter.uid) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        firebase.database().ref(`users/${bug.reporter.uid}/qa_score`).transaction((curr) => (curr || 0) - points);
    }
    firebase.database().ref(`system_bugs/${id}`).remove();
};

window.renderBugBoard = () => {
    const container = document.getElementById('bug_list_container');
    const currentUser = firebase.auth().currentUser;
    if (!container) return;
    if (window.bugDataCache.length === 0) {
        container.innerHTML = '<p class="bug-empty-text">파이프라인이 깨끗합니다. 🧹</p>';
        return;
    }
    const startIndex = (window.bugCurrentPage - 1) * window.bugItemsPerPage;
    const pagedData = window.bugDataCache.slice(startIndex, startIndex + window.bugItemsPerPage);
    container.innerHTML = pagedData.map(bug => {
        const date = new Date(bug.timestamp).toLocaleString();
        const isAdmin = currentUser && currentUser.uid === window.ADMIN_UID;
        const reporterUid = bug.reporter ? bug.reporter.uid : null;
        const reporterName = bug.reporter ? bug.reporter.name : '익명';
        const isAuthor = currentUser && reporterUid === currentUser.uid;
        const status = bug.status || 'pending';
        const statusConfig = {
            pending: { label: 'TODO', class: 'status-pending' },
            in_progress: { label: 'IN PROGRESS', class: 'status-progress' },
            no_issue: { label: 'NO ISSUE', class: 'status-no-issue' },
            review: { label: 'REVIEW', class: 'status-review' },
            done: { label: 'DONE', class: 'status-done' },
            rejected: { label: 'REJECTED', class: 'status-rejected' },
            approved: { label: 'APPROVED', class: 'status-approved' }
        };
        const current = statusConfig[status] || statusConfig.pending;
        let workflowButtons = '';
        if (isAdmin) {
            if (status === 'pending') {
                workflowButtons = `<button class="bug-status-btn" data-id="${bug.id}" data-status="in_progress">Start</button><button class="bug-status-btn" data-id="${bug.id}" data-status="no_issue">X</button>`;
            } else if (status === 'in_progress') {
                workflowButtons = `<button class="bug-status-btn" data-id="${bug.id}" data-status="review">Request Review</button>`;
            } else if (status === 'review') {
                workflowButtons = `<button class="bug-status-btn" data-id="${bug.id}" data-status="done">Pass</button><button class="bug-status-btn" data-id="${bug.id}" data-status="rejected">Fail</button>`;
            } else if (status === 'done') {
                workflowButtons = `<button class="bug-status-btn approved" data-id="${bug.id}" data-status="approved">Sign-off</button>`;
            }
        }
        let commentHtml = bug.adminComment ? `<div class="bug-admin-comment"><strong>Feedback:</strong> ${window.escapeHTML(bug.adminComment)}</div>` : '';
        return `
            <div class="bug-post-card ${current.class}">
                <div class="bug-post-header">
                    <div class="bug-post-meta">
                        <span class="bug-status-label">${current.label}</span>
                        <span class="bug-type-badge">${bug.type === 'ui' ? '🎨 UI' : '⚙️ Functional'}</span>
                        <span class="bug-post-author">👤 ${window.escapeHTML(reporterName)}</span>
                    </div>
                    <div class="bug-post-actions">
                        ${workflowButtons}
                        ${(isAdmin || (isAuthor && ['pending', 'rejected', 'no_issue'].includes(status))) ? `<button class="bug-edit-small-btn" data-id="${bug.id}">수정</button>` : ''}
                        ${isAdmin ? `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>` : ''}
                    </div>
                </div>
                <div class="bug-post-content">${window.escapeHTML(bug.description).replace(/\n/g, '<br>')}</div>
                <div class="bug-post-date">${date}</div>
                ${commentHtml}
            </div>
        `;
    }).join('');
    window.renderBugPagination();
};

window.openBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('d-none');
        setTimeout(() => modal.classList.add('active'), 10);
        window.renderBugBoard();
    }
};

window.closeBugReportModal = () => {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('d-none'), 300);
    }
};

window.startEditBug = (id) => {
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    const descEl = document.getElementById('bug_description');
    const typeEl = document.getElementById('bug_type');
    const submitBtn = document.getElementById('btn-submit-bug');
    if (descEl && typeEl && submitBtn) {
        window.editingBugId = id;
        descEl.value = bug.description;
        typeEl.value = bug.type || 'ui';
        submitBtn.textContent = 'Issue Update';
        descEl.focus();
    }
};

window.cancelBugEdit = () => {
    window.editingBugId = null;
    document.getElementById('bug_description').value = '';
    document.getElementById('btn-submit-bug').textContent = '제보하기';
};

window.renderBugPagination = () => {
    const pagination = document.getElementById('bug_pagination');
    if (!pagination) return;
    const totalPages = Math.ceil(window.bugDataCache.length / window.bugItemsPerPage);
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let pgHtml = '';
    for (let i = 1; i <= totalPages; i++) pgHtml += `<button class="pg-btn ${i === window.bugCurrentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    pagination.innerHTML = pgHtml;
};

window.changeBugPage = (page) => {
    window.bugCurrentPage = page;
    window.renderBugBoard();
};

window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};
