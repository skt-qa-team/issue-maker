let currentKpiTab = 'perf';

function openKpiModal() {
    document.getElementById('kpiModal').style.display = 'flex';
    loadKpiLocal();
    switchKpiTab('perf');
}

function closeKpiModal() {
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    if (saved && typeof currentUserId !== 'undefined' && currentUserId && typeof isAnonymousUser !== 'undefined' && !isAnonymousUser) {
        firebase.database().ref('users/' + currentUserId + '/kpi').set(saved);
    }
    document.getElementById('kpiModal').style.display = 'none';
}

function switchKpiTab(tabId) {
    currentKpiTab = tabId;
    document.querySelectorAll('.kpi-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.kpi-tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById('btn-tab-' + tabId).classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');

    const labelMap = {
        'perf': '📊 [업무 성과] 리포트 미리보기',
        'contrib': '📊 [팀 기여도] 리포트 미리보기',
        'capa': '📊 [개인 역량] 리포트 미리보기'
    };
    document.getElementById('kpi_preview_label').innerText = labelMap[tabId];
    
    generateKPI();
}

function clearKpiTab(tabId) {
    if (!confirm('현재 탭의 작성 내용을 모두 초기화하시겠습니까?')) return;
    
    if (tabId === 'perf') {
        ['def_blocker', 'def_critical', 'def_major', 'def_minor', 'def_trivial', 'prev_avg', 'tc_update_text'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('tc_container').innerHTML = '';
        addTcRow();
    } else if (tabId === 'contrib') {
        document.getElementById('kpi_contrib_text').value = '';
    } else if (tabId === 'capa') {
        document.getElementById('kpi_capa_text').value = '';
    }
    generateKPI();
}

function addTcRow(data = null) {
    const container = document.getElementById('tc_container');
    const row = document.createElement('div');
    row.className = 'tc-row';
    row.innerHTML = `
        <select class="tc-poc kpi-input" onchange="generateKPI()">
            <option value="T 멤버십">T 멤버십</option>
            <option value="에이닷">에이닷</option>
            <option value="PC Web">PC Web</option>
            <option value="AI Layer">AI Layer</option>
            <option value="Admin">Admin</option>
        </select>
        <input type="text" class="tc-name kpi-input" placeholder="티켓 이름 (예: 무비 쿠폰 2차)" oninput="generateKPI()">
        <input type="text" class="tc-id kpi-input" placeholder="티켓 번호 (예: MKG-119)" oninput="generateKPI()">
        <input type="number" class="tc-count kpi-input" placeholder="건수" min="0" oninput="generateKPI()">
        <label class="checkbox-label"><input type="checkbox" class="tc-dual" onchange="generateKPI()"> 단말 2대</label>
        <button class="btn-remove" onclick="this.parentElement.remove(); generateKPI();">삭제</button>
    `;
    container.appendChild(row);

    if (data) {
        row.querySelector('.tc-poc').value = data.poc || 'T 멤버십';
        row.querySelector('.tc-name').value = data.name || '';
        row.querySelector('.tc-id').value = data.id || '';
        row.querySelector('.tc-count').value = data.count || '';
        row.querySelector('.tc-dual').checked = data.dual || false;
    }

    generateKPI();
}

function generateKPI() {
    const v = (id) => parseInt(document.getElementById(id).value) || 0;
    const rawV = (id) => document.getElementById(id).value;

    const defects = [
        { name: 'Blocker', count: v('def_blocker') },
        { name: 'Critical', count: v('def_critical') },
        { name: 'Major', count: v('def_major') },
        { name: 'Minor', count: v('def_minor') },
        { name: 'Trivial', count: v('def_trivial') }
    ];

    let totalDefects = 0;
    let defectListText = "";
    
    defects.forEach(d => {
        totalDefects += d.count;
        if (d.count > 0) {
            defectListText += ` - ${d.name} ${d.count}개\n`;
        }
    });

    const prevAvg = v('prev_avg');
    const diff = totalDefects - prevAvg;
    let diffText = "동일";
    if (diff > 0) diffText = `${diff}개 상승`;
    else if (diff < 0) diffText = `${Math.abs(diff)}개 하락`;

    let defectSection = `Defect 검출 갯수 : 총 ${totalDefects}개\n`;
    defectSection += `* T 멤버십 : ${totalDefects}개\n`;
    if (defectListText) defectSection += defectListText;
    defectSection += `\n전월 팀 평균 Defect 검출 갯수 : ${prevAvg}개 (${diffText})\n`;

    let totalTcCount = 0;
    const pocGroups = {};
    const tcArrayToSave = [];

    const tcRows = document.querySelectorAll('.tc-row');
    tcRows.forEach(row => {
        const poc = row.querySelector('.tc-poc').value;
        const name = row.querySelector('.tc-name').value.trim();
        const id = row.querySelector('.tc-id').value.trim();
        const countRaw = row.querySelector('.tc-count').value;
        const count = parseInt(countRaw) || 0;
        const isDual = row.querySelector('.tc-dual').checked;

        tcArrayToSave.push({ poc: poc, name: name, id: id, count: countRaw, dual: isDual });

        if (count > 0 || name || id) {
            if (!pocGroups[poc]) pocGroups[poc] = { count: 0, items: [] };
            
            pocGroups[poc].count += count;
            totalTcCount += count;

            const idStr = id ? ` (${id})` : '';
            const dualStr = isDual ? ' (단말 2대)' : '';
            pocGroups[poc].items.push(` - ${name}${idStr} ${count}건${dualStr}`);
        }
    });

    let tcSection = `TC 수행 업무\n* TC 수행 갯수: ${totalTcCount}개\n\n`;
    for (const [poc, data] of Object.entries(pocGroups)) {
        tcSection += `* ${poc} : ${data.count}개\n`;
        tcSection += data.items.join('\n') + '\n\n';
    }

    const updateText = rawV('tc_update_text');
    let updateSection = `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
    if (updateText.trim()) {
        const lines = updateText.split('\n');
        lines.forEach(line => {
            if(line.trim()) updateSection += ` - ${line.trim()}\n`;
        });
    } else {
        updateSection += ` - 내용 없음\n`;
    }
    
    const perfReport = `${defectSection}\n${tcSection}${updateSection}`.trim();
    const contribReport = rawV('kpi_contrib_text').trim() || "입력된 팀 기여도 내역이 없습니다.";
    const capaReport = rawV('kpi_capa_text').trim() || "입력된 개인 역량 강화 내역이 없습니다.";

    const previewArea = document.getElementById('output_kpi_result');
    if (currentKpiTab === 'perf') {
        previewArea.value = perfReport;
    } else if (currentKpiTab === 'contrib') {
        previewArea.value = contribReport;
    } else if (currentKpiTab === 'capa') {
        previewArea.value = capaReport;
    }

    const kpiData = {
        blocker: rawV('def_blocker'),
        critical: rawV('def_critical'),
        major: rawV('def_major'),
        minor: rawV('def_minor'),
        trivial: rawV('def_trivial'),
        prevAvg: rawV('prev_avg'),
        updateText: updateText,
        tcs: tcArrayToSave,
        contribText: rawV('kpi_contrib_text'),
        capaText: rawV('kpi_capa_text')
    };
    localStorage.setItem('skm_kpi_data', JSON.stringify(kpiData));
}

function loadKpiLocal() {
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    const container = document.getElementById('tc_container');
    
    if (saved) {
        document.getElementById('def_blocker').value = saved.blocker || '';
        document.getElementById('def_critical').value = saved.critical || '';
        document.getElementById('def_major').value = saved.major || '';
        document.getElementById('def_minor').value = saved.minor || '';
        document.getElementById('def_trivial').value = saved.trivial || '';
        document.getElementById('prev_avg').value = saved.prevAvg || '';
        document.getElementById('tc_update_text').value = saved.updateText || '';
        document.getElementById('kpi_contrib_text').value = saved.contribText || '';
        document.getElementById('kpi_capa_text').value = saved.capaText || '';

        container.innerHTML = '';
        if (saved.tcs && saved.tcs.length > 0) {
            saved.tcs.forEach(tc => addTcRow(tc));
        } else {
            addTcRow();
        }
    } else {
        if (document.querySelectorAll('.tc-row').length === 0) {
            addTcRow();
        }
    }
    generateKPI();
}

function copyKpiReport() {
    generateKPI();
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    
    const v = (val) => parseInt(val) || 0;
    let totalDefects = v(saved.blocker) + v(saved.critical) + v(saved.major) + v(saved.minor) + v(saved.trivial);
    let diff = totalDefects - v(saved.prevAvg);
    let diffText = "동일";
    if (diff > 0) diffText = `${diff}개 상승`; else if (diff < 0) diffText = `${Math.abs(diff)}개 하락`;

    let defectSection = `Defect 검출 갯수 : 총 ${totalDefects}개\n* T 멤버십 : ${totalDefects}개\n`;
    if (v(saved.blocker)>0) defectSection += ` - Blocker ${saved.blocker}개\n`;
    if (v(saved.critical)>0) defectSection += ` - Critical ${saved.critical}개\n`;
    if (v(saved.major)>0) defectSection += ` - Major ${saved.major}개\n`;
    if (v(saved.minor)>0) defectSection += ` - Minor ${saved.minor}개\n`;
    if (v(saved.trivial)>0) defectSection += ` - Trivial ${saved.trivial}개\n`;
    defectSection += `\n전월 팀 평균 Defect 검출 갯수 : ${saved.prevAvg || 0}개 (${diffText})\n`;

    let totalTcCount = 0;
    const pocGroups = {};
    if (saved.tcs) {
        saved.tcs.forEach(tc => {
            const count = v(tc.count);
            if (count > 0 || tc.name || tc.id) {
                if (!pocGroups[tc.poc]) pocGroups[tc.poc] = { count: 0, items: [] };
                pocGroups[tc.poc].count += count;
                totalTcCount += count;
                const idStr = tc.id ? ` (${tc.id})` : '';
                const dualStr = tc.dual ? ' (단말 2대)' : '';
                pocGroups[tc.poc].items.push(` - ${tc.name}${idStr} ${count}건${dualStr}`);
            }
        });
    }
    let tcSection = `TC 수행 업무\n* TC 수행 갯수: ${totalTcCount}개\n\n`;
    for (const [poc, data] of Object.entries(pocGroups)) {
        tcSection += `* ${poc} : ${data.count}개\n`;
        tcSection += data.items.join('\n') + '\n\n';
    }

    let updateSection = `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
    if (saved.updateText && saved.updateText.trim()) {
        saved.updateText.split('\n').forEach(line => {
            if(line.trim()) updateSection += ` - ${line.trim()}\n`;
        });
    } else {
        updateSection += ` - 내용 없음\n`;
    }

    let fullReport = `${defectSection}\n${tcSection}${updateSection}`.trim();

    if (saved.contribText && saved.contribText.trim()) fullReport += `\n\n[팀 기여도 및 업무태도]\n${saved.contribText.trim()}`;
    if (saved.capaText && saved.capaText.trim()) fullReport += `\n\n[역량강화 (개인 역량)]\n${saved.capaText.trim()}`;

    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = fullReport;
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 KPI 리포트가 복사되었습니다!');
    
    if (saved && typeof currentUserId !== 'undefined' && currentUserId && typeof isAnonymousUser !== 'undefined' && !isAnonymousUser) {
        firebase.database().ref('users/' + currentUserId + '/kpi').set(saved);
    }
}
