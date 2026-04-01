function openKpiModal() {
    document.getElementById('kpiModal').style.display = 'flex';
    if (document.querySelectorAll('.tc-row').length === 0) {
        addTcRow();
    } else {
        generateKPI();
    }
}

function closeKpiModal() {
    document.getElementById('kpiModal').style.display = 'none';
}

function addTcRow() {
    const container = document.getElementById('tc_container');
    const row = document.createElement('div');
    row.className = 'tc-row';
    row.innerHTML = `
        <select class="tc-poc" onchange="generateKPI()" style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem;">
            <option value="T 멤버십">T 멤버십</option>
            <option value="에이닷">에이닷</option>
            <option value="PC Web">PC Web</option>
            <option value="AI Layer">AI Layer</option>
            <option value="Admin">Admin</option>
        </select>
        <input type="text" class="tc-name" placeholder="티켓 이름 (예: 무비 쿠폰 2차)" oninput="generateKPI()" style="padding: 10px; font-size: 0.95rem;">
        <input type="text" class="tc-id" placeholder="티켓 번호 (예: MKG-119)" oninput="generateKPI()" style="padding: 10px; font-size: 0.95rem;">
        <input type="number" class="tc-count" placeholder="건수" min="0" oninput="generateKPI()" style="padding: 10px; font-size: 0.95rem;">
        <label class="checkbox-label" style="font-size: 0.95rem;"><input type="checkbox" class="tc-dual" onchange="generateKPI()"> 단말 2대</label>
        <button class="btn-remove" onclick="this.parentElement.remove(); generateKPI();" style="padding: 10px 15px; font-size: 0.95rem;">삭제</button>
    `;
    container.appendChild(row);
    generateKPI();
}

function generateKPI() {
    const v = (id) => parseInt(document.getElementById(id).value) || 0;

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

    const tcRows = document.querySelectorAll('.tc-row');
    tcRows.forEach(row => {
        const poc = row.querySelector('.tc-poc').value;
        const name = row.querySelector('.tc-name').value.trim();
        const id = row.querySelector('.tc-id').value.trim();
        const count = parseInt(row.querySelector('.tc-count').value) || 0;
        const isDual = row.querySelector('.tc-dual').checked;

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

    const updateText = document.getElementById('tc_update_text').value.trim();
    let updateSection = `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
    
    if (updateText) {
        const lines = updateText.split('\n');
        lines.forEach(line => {
            if(line.trim()) updateSection += ` - ${line.trim()}\n`;
        });
    } else {
        updateSection += ` - 내용 없음\n`;
    }

    const finalReport = `${defectSection}\n${tcSection}${updateSection}`;
    document.getElementById('output_kpi_result').value = finalReport.trim();
}

function copyKpiReport() {
    const el = document.getElementById('output_kpi_result');
    el.select();
    document.execCommand('copy');
    alert('KPI 리포트가 복사되었습니다!');
}
