function openKpiModal() {
    document.getElementById('kpiModal').style.display = 'flex';
    loadKpiLocal();
}

function closeKpiModal() {
    document.getElementById('kpiModal').style.display = 'none';
}

function switchKpiTab(tabId) {
    document.querySelectorAll('.kpi-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.kpi-tab-content').forEach(content => content.style.display = 'none');
    
    const activeBtn = document.getElementById(`btn-tab-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active'); // 애니메이션을 위한 클래스 유지
    }
}

function clearKpiTab(tabId) {
    if (!confirm('현재 탭의 내용을 초기화하시겠습니까?')) return;
    
    if (tabId === 'perf') {
        ['def_blocker', 'def_critical', 'def_major', 'def_minor', 'def_trivial', 'prev_avg', 'tc_update_text'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        const tcContainer = document.getElementById('tc_container');
        if (tcContainer) tcContainer.innerHTML = '';
    } else if (tabId === 'contrib') {
        const el = document.getElementById('kpi_contrib_text');
        if(el) el.value = '';
    } else if (tabId === 'capa') {
        const el = document.getElementById('kpi_capa_text');
        if(el) el.value = '';
    }
    generateKPI();
}

function resetTeamAverage() {
    const el = document.getElementById('prev_avg');
    if(el) {
        el.value = '';
        generateKPI();
    }
}

function addTcRow(data = {}) {
    const container = document.getElementById('tc_container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'tc-row';
    
    const pocList = ['T 멤버십', '에이닷', 'PC Web', 'AI Layer', 'Admin', '기타'];
    let pocOptions = '';
    pocList.forEach(p => {
        const selected = (data.poc === p) ? 'selected' : '';
        pocOptions += `<option value="${p}" ${selected}>${p}</option>`;
    });

    row.innerHTML = `
        <select class="tc-poc kpi-input" onchange="generateKPI()">
            ${pocOptions}
        </select>
        <input type="text" class="tc-name kpi-input" placeholder="TC 항목명" value="${data.name || ''}" oninput="generateKPI()">
        <input type="number" class="tc-total kpi-input" placeholder="Total" value="${data.total || ''}" min="0" oninput="generateKPI()">
        <input type="number" class="tc-pass kpi-input" placeholder="Pass" value="${data.pass || ''}" min="0" oninput="generateKPI()">
        <input type="number" class="tc-fail kpi-input" placeholder="Fail" value="${data.fail || ''}" min="0" oninput="generateKPI()">
        <button class="btn-remove" onclick="removeTcRow(this)">삭제</button>
    `;
    container.appendChild(row);
    generateKPI();
}

function removeTcRow(btn) {
    if (btn && btn.closest('.tc-row')) {
        btn.closest('.tc-row').remove();
        generateKPI();
    }
}

function generateKPI() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    
    const blocker = getVal('def_blocker') || 0;
    const critical = getVal('def_critical') || 0;
    const major = getVal('def_major') || 0;
    const minor = getVal('def_minor') || 0;
    const trivial = getVal('def_trivial') || 0;
    const totalDefect = parseInt(blocker) + parseInt(critical) + parseInt(major) + parseInt(minor) + parseInt(trivial);
    const prevAvg = getVal('prev_avg');

    let report = `[1. 업무 성과]\n\n■ 1. Defect 검출 현황 (총 ${totalDefect}건)\n`;
    report += `- Blocker: ${blocker}건\n- Critical: ${critical}건\n- Major: ${major}건\n- Minor: ${minor}건\n- Trivial: ${trivial}건\n`;
    if (prevAvg) report += `* 전월 팀 평균(${prevAvg}건) 대비 검출량 비교 참고\n`;

    report += `\n■ 2. TC 수행 업무\n`;
    const rows = document.querySelectorAll('.tc-row');
    if (rows.length === 0) {
        report += `- 수행 내역 없음\n`;
    } else {
        rows.forEach(row => {
            const poc = row.querySelector('.tc-poc').value;
            const name = row.querySelector('.tc-name').value || '미지정 항목';
            const total = row.querySelector('.tc-total').value || 0;
            const pass = row.querySelector('.tc-pass').value || 0;
            const fail = row.querySelector('.tc-fail').value || 0;
            report += `- [${poc}] ${name} : Total ${total} (Pass ${pass} / Fail ${fail})\n`;
        });
    }

    const tcUpdate = getVal('tc_update_text');
    if (tcUpdate) {
        report += `\n■ 3. TC 작성 및 수정\n${tcUpdate}\n`;
    }

    const contrib = getVal('kpi_contrib_text');
    const capa = getVal('kpi_capa_text');

    if (contrib) report += `\n\n[2. 팀 기여도]\n${contrib}\n`;
    if (capa) report += `\n\n[3. 개인 역량]\n${capa}\n`;

    const outEl = document.getElementById('output_kpi_result');
    if (outEl) outEl.value = report;

    saveKpiData();
}

function saveKpiData() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    
    const tcData = [];
    document.querySelectorAll('.tc-row').forEach(row => {
        tcData.push({
            poc: row.querySelector('.tc-poc').value,
            name: row.querySelector('.tc-name').value,
            total: row.querySelector('.tc-total').value,
            pass: row.querySelector('.tc-pass').value,
            fail: row.querySelector('.tc-fail').value
        });
    });

    const data = {
        blocker: getVal('def_blocker'),
        critical: getVal('def_critical'),
        major: getVal('def_major'),
        minor: getVal('def_minor'),
        trivial: getVal('def_trivial'),
        prevAvg: getVal('prev_avg'),
        tcRows: tcData,
        tcUpdate: getVal('tc_update_text'),
        contrib: getVal('kpi_contrib_text'),
        capa: getVal('kpi_capa_text')
    };

    localStorage.setItem('skm_kpi_data', JSON.stringify(data));

    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user && !user.isAnonymous) {
            firebase.database().ref('users/' + user.uid + '/kpi').set(data);
        }
    }
}

function loadKpiLocal() {
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    if (!saved) return;

    const setVal = (id, val) => { 
        const el = document.getElementById(id);
        if(el) el.value = val || ''; 
    };
    
    setVal('def_blocker', saved.blocker);
    setVal('def_critical', saved.critical);
    setVal('def_major', saved.major);
    setVal('def_minor', saved.minor);
    setVal('def_trivial', saved.trivial);
    setVal('prev_avg', saved.prevAvg);
    setVal('tc_update_text', saved.tcUpdate);
    setVal('kpi_contrib_text', saved.contrib);
    setVal('kpi_capa_text', saved.capa);

    const container = document.getElementById('tc_container');
    if (container) {
        container.innerHTML = ''; 
        if (saved.tcRows && saved.tcRows.length > 0) {
            saved.tcRows.forEach(row => addTcRow(row));
        }
    }
    
    // UI 로드 후 미리보기 결과 업데이트
    generateKPI();
}

function copyKpiReport() {
    const el = document.getElementById('output_kpi_result');
    if (!el) return;
    try {
        el.select();
        document.execCommand('copy');
        alert('KPI 리포트가 클립보드에 복사되었습니다!');
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
}
