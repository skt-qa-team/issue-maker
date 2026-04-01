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
        <input type="text" class="tc-name" placeholder="티켓 이름 (예: 무비 쿠폰 2차)" oninput="generateKPI()">
        <input type="text" class="tc-id" placeholder="티켓 번호 (예: MKG-119)" oninput="generateKPI()">
        <input type="number" class="tc-count" placeholder="수행건수" min="0" value="0" oninput="generateKPI()">
        <label class="checkbox-label"><input type="checkbox" class="tc-dual" onchange="generateKPI()"> 단말 2대</label>
        <button class="btn-remove" onclick="this.parentElement.remove(); generateKPI();">삭제</button>
    `;
    container.appendChild(row);
    generateKPI();
}

function generateKPI() {
    const v = (id) => parseInt(document.getElementById(id).value) || 0;
    
    const blocker = v('def_blocker');
    const critical = v('def_critical');
    const major = v('def_major');
    const minor = v('def_minor');
    const trivial = v('def_trivial');
    const totalDefects = blocker + critical + major + minor + trivial;
    
    const prevAvg = v('prev_avg');
    const diff = totalDefects - prevAvg;
    let diffText = "동일";
    if (diff > 0) diffText = `${diff}개 상승`;
    else if (diff < 0) diffText = `${Math.abs(diff)}개 하락`;

    let defectSection = `Defect 검출 갯수 : 총 ${totalDefects}개\n`;
    defectSection += `* T 멤버십 : ${totalDefects}개\n`;
    defectSection += ` - Blocker ${blocker}개\n`;
    defectSection += ` - Critical ${critical}개\n`;
    defectSection += ` - Major ${major}개\n`;
    defectSection += ` - Minor ${minor}개\n`;
    defectSection += ` - Trivial ${trivial}개\n\n`;
    defectSection += `전월 팀 평균 Defect 검출 갯수 : ${prevAvg}개 (${diffText})\n`;

    let totalTcCount = 0;
    let tcListText = "";
    const tcRows = document.querySelectorAll('.tc-row');
    
    tcRows.forEach(row => {
        const name = row.querySelector('.tc-name').value.trim();
        const id = row.querySelector('.tc-id').value.trim();
        const count = parseInt(row.querySelector('.tc-count').value) || 0;
        const isDual = row.querySelector('.tc-dual').checked;
        
        totalTcCount += count;
        
        if (name || id || count > 0) {
            const idStr = id ? ` (${id})` : '';
            const dualStr = isDual ? ' (단말 2대)' : '';
            tcListText += ` - ${name}${idStr} ${count}건${dualStr}\n`;
        }
    });

    let tcSection = `TC 수행 업무\n`;
    tcSection += `* TC 수행 갯수: ${totalTcCount}개\n`;
    tcSection += `* T 멤버십 : ${totalTcCount}개\n`;
    if (tcListText) tcSection += tcListText;

    const updateText = document.getElementById('tc_update_text').value.trim();
    let updateSection = `\n본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
    updateSection += updateText ? updateText : "내용 없음";

    const finalReport = `${defectSection}\n${tcSection}${updateSection}`;
    document.getElementById('output_kpi_result').value = finalReport;
}

function copyKpiReport() {
    const el = document.getElementById('output_kpi_result');
    el.select();
    document.execCommand('copy');
    alert('KPI 리포트가 복사되었습니다!');
}
