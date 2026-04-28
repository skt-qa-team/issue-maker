window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.ResultForm = {
    generate: () => {
        const getDropdownOrCustom = (dropdownId, customId) => {
            const el = document.getElementById(dropdownId);
            if (!el) return '';
            if (el.value === 'direct') {
                const customEl = document.getElementById(customId);
                return customEl ? customEl.value.trim() : '';
            }
            return el.value.trim();
        };

        const prefixMap = { 'env': '', 'os': '', 'poc': '', 'critical': '', 'device': '', 'account': '', 'page': '' };

        const envVal = getDropdownOrCustom('prefix_env', 'prefix_env_custom');
        if (envVal) prefixMap['env'] = `[${envVal}]`;

        const osVal = getDropdownOrCustom('osType', 'osType_custom');
        if (osVal) prefixMap['os'] = `[${osVal}]`;

        let pocVal = getDropdownOrCustom('poc', 'poc_custom');
        if (pocVal === 'PC M.Web') pocVal = 'PCWeb';
        if (pocVal && pocVal !== 'T 멤버십') prefixMap['poc'] = `[${pocVal}]`;

        const critVal = getDropdownOrCustom('prefix_critical', 'prefix_critical_custom');
        if (critVal) prefixMap['critical'] = `[${critVal}]`;

        let deviceVal = '';
        const browserNone = document.getElementById('prefix_browser_none');
        if (!browserNone || !browserNone.checked) {
            let browserVals = [];
            document.querySelectorAll('.prefix-browser-cb:checked').forEach(cb => {
                if (cb.value === '기타') {
                    const custom = document.getElementById('prefix_browser_custom')?.value.trim();
                    if (custom) browserVals.push(custom);
                } else browserVals.push(cb.value);
            });
            if (browserVals.length > 0) deviceVal = browserVals.join('/');
        } else {
            deviceVal = document.getElementById('prefix_device_input')?.value.trim() || '';
        }
        if (deviceVal) prefixMap['device'] = `[${deviceVal}]`;

        const accVal = document.getElementById('prefix_account')?.value.trim() || '';
        if (accVal) prefixMap['account'] = `[${accVal}]`;

        const pageVal = document.getElementById('prefix_page')?.value.trim() || '';
        if (pageVal) prefixMap['page'] = `[${pageVal}]`;

        const container = document.getElementById('prefixContainer');
        let orderedPrefixString = '';
        
        if (container) {
            const items = Array.from(container.querySelectorAll('.prefix-item'));
            items.sort((a, b) => {
                const orderA = parseInt(a.querySelector('.prefix-order-input')?.value || 99);
                const orderB = parseInt(b.querySelector('.prefix-order-input')?.value || 99);
                return orderA - orderB;
            });

            items.forEach(item => {
                const id = item.dataset.id;
                if (prefixMap[id]) orderedPrefixString += prefixMap[id];
            });
        }

        const titleVal = document.getElementById('title')?.value.trim() || '';
        const titleText = `${orderedPrefixString} ${titleVal}`.replace(/\s+/g, ' ').trim();

        const pocDropdownVal = document.getElementById('poc')?.value || '';
        const osDropdownVal = document.getElementById('osType')?.value || '';
        const isPureWeb = pocDropdownVal === 'Admin' || pocDropdownVal === 'PC Web';
        const servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
        let devices = "";
        
        if (!isPureWeb) {
            let activeDeviceLists = [];
            const andMode = document.querySelector('input[name="and_dev_mode"]:checked')?.value;
            const iosMode = document.querySelector('input[name="ios_dev_mode"]:checked')?.value;
            
            const osGroup = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
            const showAnd = (osDropdownVal === "Android/iOS" || osDropdownVal === "Android" || osGroup.slice(3).includes(osDropdownVal));
            const showIos = (osDropdownVal === "Android/iOS" || osDropdownVal === "iOS" || osGroup.slice(3).includes(osDropdownVal));

            if (showAnd) activeDeviceLists.push(document.getElementById(`and${andMode === 'normal' ? 'Normal' : 'Special'}List`));
            if (showIos) activeDeviceLists.push(document.getElementById(`ios${iosMode === 'normal' ? 'Normal' : 'Special'}List`));

            let checkedDeviceValues = [];
            activeDeviceLists.forEach(list => {
                if (list) {
                    const checkedInList = Array.from(list.querySelectorAll('.issue-device-cb:checked'));
                    checkedDeviceValues.push(...checkedInList.map(cb => cb.value));
                }
            });
            devices = checkedDeviceValues.join(' / ');
        }

        const ver = document.getElementById('appVersion')?.value || '';
        const searchEngines = Array.from(document.querySelectorAll('.ver-type-cb:checked'))
            .map(cb => cb.value)
            .filter(val => ['삼성인터넷', 'Safari', 'Chrome', 'Edge'].includes(val))
            .join(' / ');

        let envSection = `[Environment]\n■ POC : ${pocDropdownVal === 'PC M.Web' ? 'PC M.Web' : pocDropdownVal === 'direct' ? document.getElementById('poc_custom')?.value.trim() : pocDropdownVal}\n`;

        if (pocDropdownVal === 'PC Web') {
            if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
            envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
        } else if (pocDropdownVal === 'PC M.Web') {
            envSection += `■ Device : ${devices || '-'}\n`;
            if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
            envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
        } else if (pocDropdownVal === 'Admin') {
            envSection += `■ 서버 : ${servers.join(' / ')}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
        } else {
            envSection += `■ Device : ${devices || '-'}\n■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}`;
            if (pocDropdownVal === 'AI Layer') {
                const aiModeVal = document.getElementById('aiMode')?.value || '';
                if (aiModeVal) envSection += `\n■ 모드 : ${aiModeVal}`;
            }
        }
        
        const prdRef = document.getElementById('ref_prd')?.value.trim() || '';
        const notes = document.getElementById('ref_notes')?.value.trim() || '';
        const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';
        
        const getVal = id => document.getElementById(id)?.value || '';
        const body = `${envSection}\n\n[Pre-Condition]\n${getVal('preCondition')}\n\n[재현스텝]\n${getVal('steps')}\n\n[실행결과-문제현상]\n${getVal('actualResult')}\n\n[기대결과]\n${getVal('expectedResult')}${refSection}`;
        
        const outTitle = document.getElementById('outputTitle');
        const outBody = document.getElementById('outputBody');
        if (outTitle) outTitle.value = titleText;
        if (outBody) outBody.value = body.trim();

        if (window.QA_CORE.InputForm && typeof window.QA_CORE.InputForm.saveDraft === 'function') {
            window.QA_CORE.InputForm.saveDraft();
        }
    },

    initEvents: () => {
        const resultContainer = document.getElementById('result-panel-placeholder');
        if (!resultContainer) return;

        resultContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'btnResultClear') {
                if (window.QA_CORE.Form && typeof window.QA_CORE.Form.clearForm === 'function') {
                    window.QA_CORE.Form.clearForm();
                }
            }
            
            if (target.classList.contains('btn-copy-target')) {
                const targetId = target.dataset.target;
                if (targetId && window.QA_CORE.UX && typeof window.QA_CORE.UX.copySpecific === 'function') {
                    window.QA_CORE.UX.copySpecific(targetId);
                }
            }
        });
    }
};

document.addEventListener('componentsLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.ResultForm) {
        window.QA_CORE.ResultForm.initEvents();
    }
});
