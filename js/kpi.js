/**
 * [SKM] 이슈 생성기 - KPI 모듈 스크립트 (V20.12)
 * 작성자: 진혁
 * 주요기능: 업무성과(Defect/TC), 팀기여도, 개인역량 관리 및 리포트 생성
 */

let currentKpiTab = 'perf';

/**
 * KPI 모달 열기
 */
function openKpiModal() {
    const modal = document.getElementById('kpiModal');
    if (modal) {
        modal.style.display = 'flex';
        loadKpiLocal(); // 로컬 스토리지 데이터 로드
        switchKpiTab('perf'); // 기본탭 '업무성과'로 시작
    }
}

/**
 * KPI 모달 닫기 및 데이터 저장
 */
function closeKpiModal() {
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    
    // Firebase 동기화 (로그인 및 유저 정보 확인 시)
    if (saved && typeof currentUserId !== 'undefined' && currentUserId && typeof isAnonymousUser !== 'undefined' && !isAnonymousUser) {
        firebase.database().ref('users/' + currentUserId + '/kpi').set(saved);
    }
    
    document.getElementById('kpiModal').style.display = 'none';
}

/**
 * KPI 탭 전환 로직
 * @param {string} tabId - 'perf' | 'contrib' | 'capa'
 */
function switchKpiTab(tabId) {
    currentKpiTab = tabId;

    // 1. 모든 탭 버튼 및 컨텐츠 비활성화
    document.querySelectorAll('.kpi-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.kpi-tab-content').forEach(content => content.classList.remove('active'));
    
    // 2. 선택한 탭 활성화
    const targetBtn = document.getElementById('btn-tab-' + tabId);
    const targetContent = document.getElementById('tab-' + tabId);
    
    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');

    // 3. 미리보기 헤더 라벨 업데이트
    const labelMap = {
        'perf': '📊 [업무 성과] 리포트 미리보기',
        'contrib': '📊 [팀 기여도] 리포트 미리보기',
        'capa': '📊 [개인 역량] 리포트 미리보기'
    };
    const labelElem = document.getElementById('kpi_preview_label');
    if (labelElem) labelElem.innerText = labelMap[tabId];
    
    // 4. 미리보기 즉시 갱신
    generateKPI();
}

/**
 * 특정 탭 내용 초기화
 */
function clearKpiTab(tabId) {
    if (!confirm('현재 탭의 작성 내용을 모두 초기화하시겠습니까?')) return;
    
    if (tabId === 'perf') {
        const fields = ['def_blocker', 'def_critical', 'def_major', 'def_minor', 'def_trivial', 'prev_avg', 'tc_update_text'];
        fields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        document.getElementById('tc_container').innerHTML = '';
        addTcRow(); // 기본 1행 추가
    } else if (tabId === 'contrib') {
        document.getElementById('kpi_contrib_text').value = '';
    } else if (tabId === 'capa') {
        document.getElementById('kpi_capa_text').value = '';
    }
    
    generateKPI();
}

/**
 * [추가] 팀 평균 데이터만 초기화 (이미지 내 빨간 버튼 대응)
 */
function resetTeamAverage() {
    if (!confirm('전월 팀 평균 데이터를 초기화하시겠습니까?')) return;
    const avgInput = document.getElementById('prev_avg');
    if (avgInput) {
        avgInput.value = '';
        generateKPI();
    }
}

/**
 * TC 수행 업무 행 추가
 * @param {Object} data - 기존 저장된 데이터 (선택)
 */
function addTcRow(data = null) {
    const container = document.getElementById('tc_container');
    if (!container) return;

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

    // 데이터가 있을 경우 필드 채우기
    if (data) {
        row.querySelector('.tc-poc').value = data.poc || 'T 멤버십';
        row.querySelector('.tc-name').value = data.name || '';
        row.querySelector('.tc-id').value = data.id || '';
        row.querySelector('.tc-count').value = data.count || '';
        row.querySelector('.tc-dual').checked = data.dual || false;
    }

    generateKPI();
}

/**
 * 실시간 KPI 리포트 생성 및 로컬 저장
 */
function generateKPI() {
    const v = (id) => parseInt(document.getElementById(id)?.value) || 0;
    const rawV = (id) => document.getElementById(id)?.value || '';

    // 1. Defect 섹션 계산
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
        if (d.count > 0) defectListText += ` - ${d.name} ${d.count}개\n`;
    });

    const prevAvg = v('prev_avg');
    const diff = totalDefects - prevAvg;
    let diffText = "동일";
    if (diff > 0) diffText = `${diff}개 상승`;
    else if (diff < 0) diffText = `${Math.abs(diff)}개 하락`;

    let defectSection = `Defect 검출 갯수 : 총 ${totalDefects}개\n* T 멤버십 : ${totalDefects}개\n${defectListText}\n전월 팀 평균 Defect 검출 갯수 : ${prevAvg}개 (${diffText})\n`;

    // 2. TC 수행 업무 섹션 계산
    let totalTcCount = 0;
    const pocGroups = {};
    const tcArrayToSave = [];

    document.querySelectorAll('.tc-row').forEach(row => {
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
        tcSection += `* ${poc} : ${data.count}개\n${data.items.join('\n')}\n\n`;
    }

    // 3. TC 수정 업무 섹션
    const updateText = rawV('tc_update_text');
    let updateSection = `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
    if (updateText.trim()) {
        updateText.split('\n').forEach(line => {
            if(line.trim()) updateSection += ` - ${line.trim()}\n`;
        });
    } else {
        updateSection += ` - 내용 없음\n`;
    }
    
    // 4. 각 탭별 결과물 조합
    const perfReport = `${defectSection}\n${tcSection}${updateSection}`.trim();
    const contribReport = rawV('kpi_contrib_text').trim() || "입력된 팀 기여도 내역이 없습니다.";
    const capaReport = rawV('kpi_capa_text').trim() || "입력된 개인 역량 강화 내역이 없습니다.";

    // 5. 미리보기 화면 갱신
    const previewArea = document.getElementById('output_kpi_result');
    if (previewArea) {
        if (currentKpiTab === 'perf') previewArea.value = perfReport;
        else if (currentKpiTab === 'contrib') previewArea.value = contribReport;
        else if (currentKpiTab === 'capa') previewArea.value = capaReport;
    }

    // 6. 로컬 스토리지 저장 (자동 저장 기능)
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

/**
 * 저장된 데이터 로드
 */
function loadKpiLocal() {
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    const container = document.getElementById('tc_container');
    if (!container) return;
    
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
        if (container.children.length === 0) addTcRow();
    }
    generateKPI();
}

/**
 * 전체 KPI 리포트 복사 (최종 통합본)
 */
async function copyKpiReport() {
    generateKPI(); // 최신 데이터로 동기화
    const saved = JSON.parse(localStorage.getItem('skm_kpi_data'));
    if (!saved) return;
    
    const v = (val) => parseInt(val) || 0;
    let totalDefects = v(saved.blocker) + v(saved.critical) + v(saved.major) + v(saved.minor) + v(saved.trivial);
    let diff = totalDefects - v(saved.prevAvg);
    let diffText = (diff > 0) ? `${diff}개 상승` : (diff < 0) ? `${Math.abs(diff)}개 하락` : "동일";

    // 리포트 텍스트 조합
    let report = `[업무 성과]\nDefect 검출 : 총 ${totalDefects}개 (전월대비 ${diffText})\n`;
    if (saved.updateText) report += `TC 업데이트 : ${saved.updateText.split('\n').length}건\n`;
    
    if (saved.contribText) report += `\n[팀 기여도]\n${saved.contribText}\n`;
    if (saved.capaText) report += `\n[역량 강화]\n${saved.capaText}`;

    // 실제 복사 실행
    try {
        await navigator.clipboard.writeText(report);
        alert('전체 KPI 리포트가 복사되었습니다!');
    } catch (err) {
        const t = document.createElement("textarea");
        t.value = report;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        document.body.removeChild(t);
        alert('리포트가 복사되었습니다.');
    }
}
