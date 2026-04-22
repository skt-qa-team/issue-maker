let currentKpiTab = 'perf';

function openKpiModal() {
    const modal = document.getElementById('kpiModal');
    if (modal) modal.classList.add('active');
    loadKpiLocal();
}

function closeKpiModal() {
    const modal = document.getElementById('kpiModal');
    if (modal) modal.classList.remove('active');
}

function switchKpiTab(tabId) {
    currentKpiTab = tabId;
    document.querySelectorAll('.kpi-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `btn-tab-${tabId}`);
    });

    document.querySelectorAll('.kpi-tab-content').forEach(content => {
        const isActive = content.id === `tab-${tabId}`;
        content.classList.toggle('d-none', !isActive);
        content.classList.toggle('active', isActive);
    });
    
    generateKPI();
}

function clearKpiTab(tabId) {
    if (!confirm('현재 탭의 내용을 초기화하시겠습니까?')) return;
    
    if (tabId === 'perf') {
        const ids = ['def_blocker', 'def_critical', 'def_major', 'def_minor', 'def_trivial', 'prev_avg', 'tc_update_text'];
        ids.forEach(id => {
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
    let pocOptions = pocList.map(p => {
        const selected = (data.poc === p) ? 'selected' : '';
        return `<option value="${p}" ${selected}>${p}</option>`;
    }).join('');

    const isChecked = data.isTwoDev ? 'checked' : '';

    row.innerHTML = `
        <div class="tc-input-item">
            <select class="tc-poc" onchange="generateKPI()">
                ${pocOptions}
            </select>
        </div>
        <div class="tc-input-item" style="flex:1;">
            <input type="text" class="tc-name" placeholder="티켓 이름" value="${data.name || ''}" oninput="generateKPI()">
        </div>
        <div class="tc-input-item">
            <input type="text" class="tc-ticket" placeholder="티켓 번호" value="${data.ticket || ''}" oninput="generateKPI()">
        </div>
        <div class="tc-input-item">
            <input type="number" class="tc-total" placeholder="건수" value="${data.total || ''}" min="0" oninput="generateKPI()">
        </div>
        <div class="tc-input-item tc-devices-label" style="min-width: 80px;">
            <label style="display:flex; align-items:center; gap:5px; font-weight:normal; width:auto; text-align:left;">
                <input type="checkbox" class="tc-devices" onchange="generateKPI()" ${isChecked}> 단말 2대
            </label>
        </div>
        <div class="tc-actions">
            <button class="btn-tc-del" onclick="removeTcRow(this)">🗑️</button>
        </div>
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
    const activeTabBtn = document.querySelector('.kpi-tab-btn.active');
    const activeTabId = activeTabBtn ? activeTabBtn.id.replace('btn-tab-', '') : 'perf';
    
    const previewLabel = document.getElementById('kpi_preview_label');
    const copyBtn = document.querySelector('.btn-kpi-copy');

    let report = '';

    if (activeTabId === 'perf') {
        if(previewLabel) previewLabel.textContent = '📊 [업무 성과] 리포트 미리보기';
        if(copyBtn) copyBtn.textContent = '📋 [업무 성과] 복사하기';

        const levels = ['blocker', 'critical', 'major', 'minor', 'trivial'];
        let totalDefect = 0;
        let defectDetails = [];

        levels.forEach(lv => {
            const count = parseInt(getVal(`def_${lv}`)) || 0;
            totalDefect += count;
            if (count > 0) defectDetails.push(` - ${lv.charAt(0).toUpperCase() + lv.slice(1)} ${count}개`);
        });

        report += `Defect 검출 갯수 : 총 ${totalDefect}개\n`;
        if (defectDetails.length > 0) report += defectDetails.join('\n') + '\n';

        const prevAvgStr = getVal('prev_avg');
        if (prevAvgStr !== '') {
            const prevAvg = parseFloat(prevAvgStr) || 0;
            const diff = totalDefect - prevAvg;
            const absDiff = parseFloat(Math.abs(diff).toFixed(1));
            let diffText = diff > 0 ? `${absDiff}개 상승` : (diff < 0 ? `${absDiff}개 하락` : '동일');
            report += `\n전월 팀 평균 Defect 검출 갯수 : ${parseFloat(prevAvg.toFixed(1))}개 (${diffText})\n`;
        }

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

            let itemText = ` - ${name}${ticket ? ` (${ticket})` : ''}  ${total}건${isTwoDev ? ' (단말 2대)' : ''}`;
            pocGroups[poc].items.push(itemText);
        });

        report += `* TC 수행 갯수: ${totalTc}개\n\n`;
        if (Object.keys(pocGroups).length > 0) {
            for (const [poc, data] of Object.entries(pocGroups)) {
                report += `* ${poc} : ${data.total}개\n${data.items.join('\n')}\n\n`;
            }
        } else {
            report += `- 수행 내역 없음\n\n`;
        }

        const tcUpdate = getVal('tc_update_text');
        report += `본인영역 TC 작성 및 수정 업무 (TC 최신화 유지 > 변경사항 즉시 반영)\n`;
        if (tcUpdate) {
            const lines = tcUpdate.split('\n').map(line => line.trim()).filter(l => l);
            if (lines.length > 0) {
                lines.forEach(line => {
                    report += line.startsWith('-') ? ` ${line}\n` : ` - ${line}\n`;
                });
            } else report += ` - 내용 없음\n`;
        } else report += ` - 내용 없음\n`;

    } else if (activeTabId === 'contrib') {
        if(previewLabel) previewLabel.textContent = '📊 [팀 기여도] 리포트 미리보기';
        if(copyBtn) copyBtn.textContent = '📋 [팀 기여도] 복사하기';
        report += getVal('kpi_contrib_text') || '입력된 팀 기여도 내역이 없습니다.';
    } else if (activeTabId === 'capa') {
        if(previewLabel) previewLabel.textContent = '📊 [개인 역량] 리포트 미리보기';
        if(copyBtn) copyBtn.textContent = '📋 [개인 역량] 복사하기';
        report += getVal('kpi_capa_text') || '입력된 개인 역량 내역이 없습니다.';
    }

    const outEl = document.getElementById('output_kpi_result');
    if (outEl) outEl.value = report.trim();
    saveKpiData();
}

function generateNarrativeReport() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    const blocker = parseInt(getVal('def_blocker')) || 0;
    const critical = parseInt(getVal('def_critical')) || 0;
    const major = parseInt(getVal('def_major')) || 0;
    const minor = parseInt(getVal('def_minor')) || 0;
    const trivial = parseInt(getVal('def_trivial')) || 0;
    const totalDefect = blocker + critical + major + minor + trivial;
    const prevAvgStr = getVal('prev_avg');
    
    let defectText = "";
    if (totalDefect > 0) {
        defectText = `이번 달은 총 ${totalDefect}개의 Defect를 검출`;
        if (prevAvgStr !== '') {
            const prevAvg = parseFloat(prevAvgStr) || 0;
            const diff = totalDefect - prevAvg;
            const absDiff = parseFloat(Math.abs(diff).toFixed(1));
            if (diff > 0) defectText += `하며 전월 팀 평균 대비 ${absDiff}개 높은 성과를 달성했습니다. `;
            else if (diff < 0) defectText += `하여 전월 팀 평균 대비 ${absDiff}개 낮은 수치를 기록했습니다. `;
            else defectText += `하여 전월 팀 평균과 동일한 성과를 달성했습니다. `;
        } else defectText += `하는 성과를 달성했습니다. `;
        
        if (blocker > 0 || critical > 0) {
            defectText += `특히 서비스에 치명적일 수 있는 고위험 결함을 사전에 식별하여 앱 안정성에 크게 기여했습니다.\n\n`;
        } else defectText += `꼼꼼한 검증을 통해 서비스 품질 향상에 기여했습니다.\n\n`;
    } else {
        defectText = `이번 달은 안정적인 서비스 품질을 유지하는 데 집중하며 검증 업무를 수행했습니다.\n\n`;
    }

    let totalTc = 0;
    let pocSet = new Set();
    document.querySelectorAll('.tc-row').forEach(row => {
        const poc = row.querySelector('.tc-poc').value;
        const total = parseInt(row.querySelector('.tc-total').value) || 0;
        totalTc += total;
        if(poc !== '기타') pocSet.add(poc);
    });
    
    let tcText = "";
    if (totalTc > 0) {
        const pocListStr = Array.from(pocSet).join(', ');
        tcText = `검증 업무로는 ${pocListStr ? pocListStr + ' 등의 ' : ''}프로젝트를 중심으로 총 ${totalTc}건의 TC를 수행했습니다. 교차 확인을 위해 단말기 2대로 꼼꼼하게 테스트를 진행하여 누락을 최소화했습니다.\n\n`;
    }

    const tcUpdate = getVal('tc_update_text');
    let updateText = "";
    if (tcUpdate.trim().length > 0) {
        const lines = tcUpdate.split('\n').map(line => line.trim()).filter(l => l);
        updateText = `또한, 본인 영역의 TC 최신화 작업에도 매진하여 총 ${lines.length}가지 주요 항목에 대한 현행화를 완료했습니다. 앞으로도 지속적인 TC 관리로 프로젝트 품질 향상에 노력하겠습니다.`;
    } else {
        updateText = `앞으로도 적극적인 이슈 검출과 꼼꼼한 TC 관리로 팀 프로젝트의 전반적인 품질 향상에 지속적으로 기여하겠습니다.`;
    }

    const contribEl = document.getElementById('kpi_contrib_text');
    if (contribEl) {
        if (contribEl.value.trim() !== '' && !confirm('기존 작성된 내용이 자동 생성 내용으로 교체됩니다. 계속하시겠습니까?')) return;
        contribEl.value = defectText + tcText + updateText;
        generateKPI();
    }
}

function saveKpiData() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    const tcData = Array.from(document.querySelectorAll('.tc-row')).map(row => ({
        poc: row.querySelector('.tc-poc').value,
        name: row.querySelector('.tc-name').value,
        ticket: row.querySelector('.tc-ticket').value,
        total: row.querySelector('.tc-total').value,
        isTwoDev: row.querySelector('.tc-devices').checked
    }));

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
            firebase.database().ref(`users/${user.uid}/kpi`).set(data);
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
    
    ['blocker', 'critical', 'major', 'minor', 'trivial'].forEach(lv => setVal(`def_${lv}`, saved[lv]));
    setVal('prev_avg', saved.prevAvg);
    setVal('tc_update_text', saved.tcUpdate);
    setVal('kpi_contrib_text', saved.contrib);
    setVal('kpi_capa_text', saved.capa);

    const container = document.getElementById('tc_container');
    if (container) {
        container.innerHTML = ''; 
        if (saved.tcRows) saved.tcRows.forEach(row => addTcRow(row));
    }
    generateKPI();
}

async function copyKpiReport() {
    const el = document.getElementById('output_kpi_result');
    if (!el || !el.value.trim()) {
        if (typeof showToast === 'function') showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }

    const textToCopy = el.value.trim();

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof showToast === 'function') showToast('📋 리포트가 복사되었습니다!');
        } else throw new Error();
    } catch (err) {
        fallbackCopyKpiText(textToCopy);
    }
}

function fallbackCopyKpiText(text) {
    const t = document.createElement("textarea");
    t.style.position = "fixed";
    t.style.left = "-9999px";
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('📋 리포트가 복사되었습니다!');
    } catch (err) {
        console.error('Copy fallback failed', err);
    }
    document.body.removeChild(t);
}
