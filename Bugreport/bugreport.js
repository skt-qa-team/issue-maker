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
    if (target.classList.contains('bug-edit-small-btn')) window.startEditBug(target.dataset.id);
    if (target.classList.contains('bug-delete-small-btn')) window.deleteBugReport(target.dataset.id);
    
    // 워크플로우 상태 변경 버튼 통합 처리
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
            if (!name) name = '익명';
            return { name, score: data.qa_score || 0 };
        })
        .filter(u => u.score > 0)
        .sort((a, b) => b.score - a.score);
    if (sortedUsers.length === 0) {
        rankContainer.innerHTML = '<p class="bug-empty-text">아직 획득한 점수가 없습니다. 🏁</p>';
        return;
    }
    rankContainer.innerHTML = sortedUsers.map((u, i) => `
        <div class="rank-item">
            <span class="rank-badge">${i + 1}위</span>
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
        if (typeof window.showToast === 'function') window.showToast('⚠️ 내용을 입력해 주세요.');
        return;
    }
    const user = firebase.auth().currentUser;
    if (!user) return;

    if (window.editingBugId) {
        // 수정 시 상태를 'pending'으로 리셋하여 재검수 유도
        firebase.database().ref(`system_bugs/${window.editingBugId}`).update({
            description: descriptionStr,
            type: bugType,
            status: 'pending',
            adminComment: null,
            lastUpdated: Date.now()
        }).then(() => {
            window.cancelBugEdit();
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 수정되어 검수 대기 상태로 전환되었습니다.');
        });
    } else {
        const bugData = {
            reporter: { 
                uid: user.uid, 
                name: user.displayName || user.email.split('@')[0] || '익명',
                email: user.email
            },
            description: descriptionStr,
            type: bugType,
            status: 'pending',
            timestamp: Date.now()
        };
        firebase.database().ref('system_bugs').push(bugData).then(() => {
            descEl.value = '';
            window.bugCurrentPage = 1;
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 등록되었습니다.');
        });
    }
};

window.processBugWorkflow = (id, newStatus) => {
    const user = firebase.auth().currentUser;
    if (!user || user.uid !== window.ADMIN_UID) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;

    // 완료(done) 또는 반려(rejected/no_issue) 시에만 의견 입력 유도
    let comment = null;
    if (['done', 'rejected', 'no_issue'].includes(newStatus)) {
        comment = prompt(`[${newStatus.toUpperCase()}] 의견을 남겨주세요:`, "");
        if (comment === null) return;
    }

    const updates = {};
    updates[`system_bugs/${id}/status`] = newStatus;
    if (comment !== null) updates[`system_bugs/${id}/adminComment`] = comment.trim() || null;

    // 점수 로직: 'done' 상태가 될 때만 점수 부여
    if (newStatus === 'done' && bug.reporter && bug.reporter.uid) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        const userScoreRef = firebase.database().ref(`users/${bug.reporter.uid}/qa_score`);
        userScoreRef.transaction((current) => (current || 0) + points);
    }

    firebase.database().ref().update(updates).then(() => {
        if (typeof window.showToast === 'function') window.showToast(`✅ 상태가 [${newStatus}]으로 변경되었습니다.`);
    });
};

window.deleteBugReport = (id) => {
    const user = firebase.auth().currentUser;
    if (!user || user.uid !== window.ADMIN_UID) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    if (!confirm('삭제하시겠습니까? 완료된 제보라면 점수도 회수됩니다.')) return;

    if (bug.status === 'done' && bug.reporter && bug.reporter.uid) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        const userScoreRef = firebase.database().ref(`users/${bug.reporter.uid}/qa_score`);
        userScoreRef.transaction((current) => (current || 0) - points);
    }
    firebase.database().ref(`system_bugs/${id}`).remove();
};

window.renderBugBoard = () => {
    const container = document.getElementById('bug_list_container');
    const currentUser = firebase.auth().currentUser;
    if (!container) return;
    if (window.bugDataCache.length === 0) {
        container.innerHTML = '<p class="bug-empty-text">아직 제보된 버그가 없습니다. 🧹</p>';
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
        const typeLabel = bug.type === 'ui' ? '🎨 UI' : '⚙️ 기능';
        
        // 상태별 뱃지 및 카드 클래스 설정
        const statusConfig = {
            pending: { label: '⏳ 대기중', class: 'status-pending' },
            in_progress: { label: '⚙️ 진행중', class: 'status-progress' },
            no_issue: { label: '🚫 이슈아님', class: 'status-no-issue' },
            review: { label: '🔍 검토중', class: 'status-review' },
            done: { label: '✅ 완료', class: 'status-done' },
            rejected: { label: '❌ 반려', class: 'status-rejected' }
        };
        const currentStatus = statusConfig[status] || statusConfig.pending;

        // Jira 스타일 동적 버튼 생성
        let workflowButtons = '';
        if (isAdmin) {
            if (status === 'pending') {
                workflowButtons = `
                    <button class="bug-status-btn progress" data-id="${bug.id}" data-status="in_progress">진행중</button>
                    <button class="bug-status-btn no-issue" data-id="${bug.id}" data-status="no_issue">이슈 아님</button>
                `;
            } else if (status === 'in_progress') {
                workflowButtons = `<button class="bug-status-btn review" data-id="${bug.id}" data-status="review">검토 요청</button>`;
            } else if (status === 'review') {
                workflowButtons = `
                    <button class="bug-status-btn done" data-id="${bug.id}" data-status="done">완료</button>
                    <button class="bug-status-btn reject" data-id="${bug.id}" data-status="rejected">반려</button>
                `;
            }
        }

        let commentHtml = bug.adminComment ? `<div class="bug-admin-comment"><strong>💬 Admin 피드백:</strong> ${window.escapeHTML(bug.adminComment)}</div>` : '';

        return `
            <div class="bug-post-card ${currentStatus.class}">
                <div class="bug-post-header">
                    <div class="bug-post-meta">
                        <span class="bug-status-label">${currentStatus.label}</span>
                        <span class="bug-type-badge">${typeLabel}</span>
                        <span class="bug-post-author">👤 ${window.escapeHTML(reporterName)}</span>
                        <span class="bug-post-date">${date}</span>
                    </div>
                    <div class="bug-post-actions">
                        ${workflowButtons}
                        ${(isAdmin || (isAuthor && ['pending', 'rejected', 'no_issue'].includes(status))) ? `<button class="bug-edit-small-btn" data-id="${bug.id}">수정</button>` : ''}
                        ${isAdmin ? `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>` : ''}
                    </div>
                </div>
                <div class="bug-post-content">${window.escapeHTML(bug.description).replace(/\n/g, '<br>')}</div>
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
        window.bugCurrentPage = 1;
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
        submitBtn.textContent = '재제출';
        submitBtn.classList.replace('bug-btn-primary', 'bug-btn-update');
        descEl.focus();
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
