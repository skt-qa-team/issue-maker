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
        targetTab.classList.add('active'); 
    }
    
    // 탭 전환 시 미리보기 화면 즉시 갱신
    generateKPI();
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

    const isChecked = data.isTwoDev ? 'checked' : '';

    row.innerHTML = `
        <select class="tc-poc kpi-input" onchange="generateKPI()">
            ${pocOptions}
        </select>
        <input type="text" class="tc-name kpi-input" placeholder="티켓 이름 (예: 무비 쿠폰)" value="${data.name || ''}" oninput="generateKPI()">
        <input type="text" class="tc-ticket kpi-input" placeholder="티켓 번호" value="${data.ticket || ''}" oninput="generateKPI()">
        <input type="number" class="tc-total kpi-input" placeholder="건수" value="${data.total || ''}" min="0" oninput="generateKPI()">
        <label class="tc-devices-label">
            <input type="checkbox" class="tc-devices" onchange="generateKPI()" ${isChecked}> 단말 2대
        </label>
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
    
    // 현재 활성화된 탭 식별
    const activeTabBtn = document.querySelector('.kpi-tab-btn.active');
    const activeTabId = activeTabBtn ? activeTabBtn.id.replace('btn-tab-', '') : 'perf';
    
    // 라벨 및 버튼 동적 업데이트용
    const previewLabel = document.getElementById('kpi_preview_label');
    const copyBtn = document.querySelector('.completion-preview-side .btn-save');

    let report = '';

    if (activeTabId === 'perf') {
        if(previewLabel) previewLabel.innerText = '📊 [업무 성과] 리포트 미리보기';
        if(copyBtn) copyBtn.innerText = '📋 [업무 성과] 복사하기';

        // 1. Defect 통계 산출
        const blocker = parseInt(getVal('def_blocker')) || 0;
        const critical = parseInt(getVal('def_critical')) || 0;
        const major = parseInt(getVal('def_major')) || 0;
        const minor = parseInt(getVal('def_minor')) || 0;
        const trivial = parseInt(getVal('def_trivial')) || 0;
        const totalDefect = blocker + critical + major + minor + trivial;
        const prevAvgStr = getVal('prev_avg');

        report += `Defect 검출 갯수 : 총 ${totalDefect}개\n`;
        
        if (totalDefect > 0) {
            if (blocker > 0) report += ` - Blocker ${blocker}개\n`;
            if (critical > 0) report += ` - Critical ${critical}개\n`;
            if (major > 0) report += ` - Major ${major}개\n`;
            if (minor > 0) report += ` - Minor ${minor}개\n`;
            if (trivial > 0) report += ` - Trivial ${trivial}개\n`;
        }

        // 전월 대비 팀 평균 계산 (소수점 지원 로직으로 수정됨)
        if (prevAvgStr !== '') {
            const prevAvg = parseFloat(prevAvgStr) || 0;
            const diff = totalDefect - prevAvg;
            
            // 소수점 첫째 자리까지만 표시 및 자바스크립트 부동소수점 오류(.00000001 등) 방지
            const absDiff = parseFloat(Math.abs(diff).toFixed(1));
            const displayPrevAvg = parseFloat(prevAvg.toFixed(1));

            let diffText = '';
            if (diff > 0) diffText = `${absDiff}개 상승`;
            else if (diff < 0) diffText = `${absDiff}개 하락`;
            else diffText = '동일';

            report += `\n전월 팀 평균 Defect 검출 갯수 : ${displayPrevAvg}개 (${diffText})\n`;
        }

        // 2. TC 수행 업무 (PoC별 취합)
        report += `\nTC 수행 업무\n`;
        const rows = document.querySelectorAll('.tc-row');
        let totalTc = 0;
        let pocGroups = {};

        rows.forEach(row => {
            const poc = row.querySelector('.tc-poc').value;
            const name = row.querySelector('.tc-name').value || '미지정 항목';
            const ticket = row.querySelector('.tc-ticket').value;
            const total = parseInt(row.querySelector('.tc-total').value) || 0;
            const isTwoDev = row.querySelector('.tc-devices').checked;

            totalTc += total;

            if (!pocGroups[poc]) pocGroups[poc] = { total: 0, items: [] };
            pocGroups[poc].total += total;

            let itemText = ` - ${name}`;
            if (ticket) itemText += ` (${ticket})`;
            itemText += `  ${total}건`;
            if (isTwoDev) itemText += ` (단말 2대)`;

            pocGroups[poc].items.push(itemText);
        });

        report += `* TC 수행 갯수: ${totalTc}개\n\n`;

        if (Object.keys(pocGroups).length > 0) {
            for (const [poc, data] of Object.entries(pocGroups)) {
                report += `* ${poc} : ${data.total}개\n`;
                report += data.items.join('\n') + '\n\n';
            }
        } else {
            report += `- 수행 내역 없음\n\n`;
        }

        // 3. TC 작성 및 수정 업무
        const tcUpdate = getVal('tc_update_text');
        report += `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
        
        if (tcUpdate) {
            const lines = tcUpdate.split('\n').map(line => line.trim()).filter(l => l);
            if (lines.length > 0) {
                lines.forEach(line => {
                    // 사용자가 하이픈을 안 썼을 경우 자동으로 붙여줌
                    if (line.startsWith('-')) report += ` ${line}\n`;
                    else report += ` - ${line}\n`;
                });
            } else {
                report += ` - 내용 없음\n`;
            }
        } else {
            report += ` - 내용 없음\n`;
        }

    } else if (activeTabId === 'contrib') {
        if(previewLabel) previewLabel.innerText = '📊 [팀 기여도] 리포트 미리보기';
        if(copyBtn) copyBtn.innerText = '📋 [팀 기여도] 복사하기';
        const contrib = getVal('kpi_contrib_text');
        report += contrib ? contrib : '입력된 팀 기여도 내역이 없습니다.';
        
    } else if (activeTabId === 'capa') {
        if(previewLabel) previewLabel.innerText = '📊 [개인 역량] 리포트 미리보기';
        if(copyBtn) copyBtn.innerText = '📋 [개인 역량] 복사하기';
        const capa = getVal('kpi_capa_text');
        report += capa ? capa : '입력된 개인 역량 내역이 없습니다.';
    }

    // 미리보기 반영
    const outEl = document.getElementById('output_kpi_result');
    if (outEl) outEl.value = report.trim();

    saveKpiData();
}

function saveKpiData() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    
    const tcData = [];
    document.querySelectorAll('.tc-row').forEach(row => {
        tcData.push({
            poc: row.querySelector('.tc-poc').value,
            name: row.querySelector('.tc-name').value,
            ticket: row.querySelector('.tc-ticket').value,
            total: row.querySelector('.tc-total').value,
            isTwoDev: row.querySelector('.tc-devices').checked
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
        alert('현재 활성화된 탭의 내용이 복사되었습니다!');
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
}
