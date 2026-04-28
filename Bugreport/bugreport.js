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
    if (target.id === 'btn-submit-bug') window.handleBugSubmissionFlow();
    if (target.classList.contains('bug-edit-small-btn')) window.startEditBugConfirm(target.dataset.id);
    if (target.classList.contains('bug-delete-small-btn')) window.deleteBugReportConfirm(target.dataset.id);
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

window.handleBugSubmissionFlow = () => {
    const descEl = document.getElementById('bug_description');
    const typeEl = document.getElementById('bug_type');

    const descriptionStr = descEl ? descEl.value.trim() : '';
    const bugType = typeEl ? typeEl.value : 'ui';

    if (!descriptionStr) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 버그 내용을 상세히 입력해주세요.');
        return;
    }

    const bugPayload = {
        description: descriptionStr,
        type: bugType
    };

    window.submitBugReport(bugPayload);
};

window.submitBugReport = (payload) => {
    const user = firebase.auth().currentUser;
    if (!user) return;

    if (window.editingBugId) {
        firebase.database().ref(`system_bugs/${window.editingBugId}`).update({
            description: payload.description,
            type: payload.type,
            status: 'pending', // [수정] 명세서: 수정 완료 시 [등록] 상태로 변경
            lastUpdated: Date.now()
        }).then(() => {
            window.cancelBugEdit();
            if (typeof window.showToast === 'function') window.showToast('✅ 이슈가 업데이트되었습니다.');
        });
    } else {
        const bugData = {
            reporter: { uid: user.uid, name: user.displayName || user.email.split('@')[0], email: user.email },
            description: payload.description,
            type: payload.type,
            status: 'pending',
            timestamp: Date.now(),
            pointsAwarded: false
        };
        firebase.database().ref('system_bugs').push(bugData).then(() => {
            window.clearBugForm();
            if (typeof window.showToast === 'function') window.showToast('✅ 제보가 성공적으로 접수되었습니다.');
        });
    }
};

window.clearBugForm = () => {
    const descEl = document.getElementById('bug_description');
    if (descEl) descEl.value = '';
};

// [추가] 컨펌 창을 띄우는 수정 시작 랩퍼 함수
window.startEditBugConfirm = (id) => {
    if (confirm('수정하시겠습니까?')) {
        window.startEditBug(id);
    }
};

window.startEditBug = (id) => {
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    const descEl = document.getElementById('bug_description');
    const typeEl = document.getElementById('bug_type');
    const submitBtn = document.getElementById('btn-submit-bug');

    if (descEl && submitBtn) {
        window.editingBugId = id;
        descEl.value = bug.description || '';
        if (typeEl) typeEl.value = bug.type || 'ui';
        submitBtn.textContent = 'Issue Update';
        descEl.focus();
    }
};

window.cancelBugEdit = () => {
    window.editingBugId = null;
    window.clearBugForm();
    const submitBtn = document.getElementById('btn-submit-bug');
    if (submitBtn) submitBtn.textContent = '제보하기';
};

// [추가] 컨펌 창을 띄우는 삭제 랩퍼 함수
window.deleteBugReportConfirm = (id) => {
    if (confirm('삭제하시겠습니까?')) {
        window.deleteBugReport(id);
    }
};

window.deleteBugReport = (id) => {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;
    
    if (bug.pointsAwarded && bug.reporter && bug.reporter.uid) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        firebase.database().ref(`users/${bug.reporter.uid}/qa_score`).transaction((curr) => (curr || 0) - points);
    }
    firebase.database().ref(`system_bugs/${id}`).remove();
    if (typeof window.showToast === 'function') window.showToast('🗑️ 게시물이 삭제되었습니다.');
};

window.processBugWorkflow = (id, newStatus) => {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const bug = window.bugDataCache.find(b => b.id === id);
    if (!bug) return;

    let comment = null;
    // [수정] 이슈 작업 아님 상태일 때 사유 입력 prompt
    if (newStatus === 'no_issue') {
        comment = prompt("이슈 작업 아님 사유를 입력해주세요:", "");
        if (comment === null) return; // 취소 클릭 시
    } 

    const updates = {};
    updates[`system_bugs/${id}/status`] = newStatus;
    if (comment !== null && comment.trim() !== "") {
        updates[`system_bugs/${id}/adminComment`] = comment.trim();
    }

    if (newStatus === 'approved' && bug.reporter && bug.reporter.uid && !bug.pointsAwarded) {
        const scoreMap = { ui: 0.5, functional: 1.0 };
        const points = scoreMap[bug.type] || 0;
        firebase.database().ref(`users/${bug.reporter.uid}/qa_score`).transaction((curr) => (curr || 0) + points);
        updates[`system_bugs/${id}/pointsAwarded`] = true;
    }

    firebase.database().ref().update(updates).then(() => {
        let msg = `상태가 변경되었습니다.`;
        if (newStatus === 'in_progress') msg = '진행중 상태로 변경되었습니다.';
        if (newStatus === 'done') msg = '완료 상태로 변경되었습니다.';
        if (newStatus === 'no_issue') msg = '이슈 작업 아님 상태로 변경되었습니다.';
        if (newStatus === 'approved') msg = '🎉 최종 승인 및 점수 부여 완료!';
        if (typeof window.showToast === 'function') window.showToast(msg);
    });
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
            pending: { label: '등록', class: 'status-pending' },
            in_progress: { label: '진행중', class: 'status-progress' },
            no_issue: { label: '이슈 작업 아님', class: 'status-no-issue' },
            review: { label: '검토', class: 'status-review' },
            done: { label: '완료', class: 'status-done' },
            rejected: { label: '반려', class: 'status-rejected' },
            approved: { label: '최종 승인', class: 'status-approved' }
        };
        const current = statusConfig[status] || statusConfig.pending;
        
        // [핵심 로직] 명세서 기반 권한 및 상태별 버튼 노출 로직
        let workflowButtons = '';
        let editBtn = '';
        let deleteBtn = '';

        if (isAdmin) {
            // Admin 삭제 버튼 (모든 상태 공통)
            deleteBtn = `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>`;

            switch (status) {
                case 'pending': // 등록 상태
                    workflowButtons = `
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="no_issue">이슈 작업 아님</button>
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="in_progress">진행중</button>
                    `;
                    break;
                case 'in_progress': // 진행중 상태
                    workflowButtons = `
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="no_issue">이슈 작업 아님</button>
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="review">검토</button>
                    `;
                    break;
                case 'review': // 검토 상태 (Admin 버튼 명세 없음 - 삭제만 노출)
                    break;
                case 'done': // 완료 상태
                    workflowButtons = `<button class="bug-status-btn approved" data-id="${bug.id}" data-status="approved">최종 승인</button>`;
                    break;
                case 'no_issue': // 이슈 작업 아님 (Admin 버튼 명세 없음 - 삭제만 노출)
                    break;
            }
        } 
        
        if (isAuthor && !isAdmin) {
            switch (status) {
                case 'pending': // 등록 상태
                case 'in_progress': // 진행중 상태
                case 'no_issue': // 이슈 작업 아님 상태
                    editBtn = `<button class="bug-edit-small-btn" data-id="${bug.id}">수정</button>`;
                    deleteBtn = `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>`;
                    break;
                case 'review': // 검토 상태
                    workflowButtons = `
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="done">완료</button>
                        <button class="bug-status-btn" data-id="${bug.id}" data-status="in_progress">반려</button>
                    `;
                    editBtn = `<button class="bug-edit-small-btn" data-id="${bug.id}">수정</button>`;
                    deleteBtn = `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>`;
                    break;
                case 'done': // 완료 상태
                    deleteBtn = `<button class="bug-delete-small-btn" data-id="${bug.id}">삭제</button>`;
                    break;
            }
        }

        let commentHtml = bug.adminComment ? `<div class="bug-admin-comment"><strong>관리자 피드백:</strong> ${window.escapeHTML(bug.adminComment)}</div>` : '';
        
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
                        ${editBtn}
                        ${deleteBtn}
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

window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};
