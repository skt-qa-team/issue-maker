window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

// 🚨 [DEBUG] 전역 디버거 유틸리티 (콘솔에 로그를 예쁘게 찍어줍니다)
window.QA_DEBUG = (action, detail = "") => {
    const time = new Date().toLocaleTimeString();
    console.log(`%c[🔍 QA_DEBUG | ${time}] ${action}`, 'color: #3b82f6; font-weight: bold;', detail);
};

// 🚨 [DEBUG] 화면 전체 클릭 추적기 (클릭이 막히는지, 버튼이 눌리는지 확인)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) {
        console.log(`%c[🖱️ CLICK_TRACKER] 버튼 눌림 -> ID: ${btn.id || '없음'} | ONCLICK: ${btn.getAttribute('onclick') || '없음'}`, 'color: #10b981;');
    }
});

window.QA_CORE.CONSTANTS.SCHEDULE = {
    GAS_URL: "https://script.google.com/macros/s/AKfycbza7-LwOx9sS6V0RUemwMxzggzw-ikOCJqUJ4uACI4PXT48Thu_ql_THytZUPgIxect/exec",
    SECRET_KEY: "Qpalzm123",
    MAX_AI_QUOTA: 20,
    GEMINI_MODEL: "gemini-2.0-flash"
};

window.QA_CORE.ScheduleDetail = {
    handleTypeChange: () => {
        const selectedRadio = document.querySelector('input[name="sch_color"]:checked');
        if (!selectedRadio) return;
        
        const type = selectedRadio.getAttribute('data-type');
        const isValidation = type === '검증';

        const groupEnd = document.getElementById('group_sch_end');
        const groupPoc = document.getElementById('group_sch_poc');
        const groupOpTicket = document.getElementById('group_sch_op_ticket');
        const groupTicket = document.getElementById('group_sch_ticket');
        const groupAuthor = document.getElementById('group_sch_author');
        const labelStart = document.getElementById('label_sch_start');
        const startInput = document.getElementById('sch_start');
        const endInput = document.getElementById('sch_end');

        if (groupEnd) groupEnd.classList.toggle('d-none', type === '회의');
        if (groupPoc) groupPoc.classList.toggle('d-none', !isValidation);
        if (groupOpTicket) groupOpTicket.classList.toggle('d-none', !isValidation);
        if (groupTicket) groupTicket.classList.toggle('d-none', !isValidation);
        if (groupAuthor) groupAuthor.classList.toggle('d-none', type !== '회의');
        
        if (labelStart) {
            if (isValidation || type === '할 일') labelStart.textContent = '시작일 *';
            else if (type === '회의') labelStart.textContent = '회의 날짜 *';
            else labelStart.textContent = '날짜 *';
        }

        if (!isValidation && type !== '할 일' && startInput && endInput) {
            endInput.value = startInput.value;
        }
    },

    handleDateChange: (target) => {
        if (!target) return;

        if (target.id === 'sch_start') {
            const startVal = target.value;
            const endInput = document.getElementById('sch_end');
            const typeRadio = document.querySelector('input[name="sch_color"]:checked');
            const type = typeRadio ? typeRadio.getAttribute('data-type') : '';
            
            if (startVal) {
                const year = parseInt(startVal.split('-')[0]);
                if (year > 9999) {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("연도는 9999년까지만 입력 가능합니다.", 'warning');
                    target.value = '';
                    return;
                }
            }

            if (type !== '검증' && type !== '할 일') {
                if (endInput) endInput.value = startVal;
            } else if (endInput && endInput.value && endInput.value < startVal) {
                endInput.value = startVal;
            }
        }

        if (target.id === 'sch_end') {
            const endVal = target.value;
            const startInput = document.getElementById('sch_start');

            if (endVal) {
                const year = parseInt(endVal.split('-')[0]);
                if (year > 9999) {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("연도는 9999년까지만 입력 가능합니다.", 'warning');
                    target.value = '';
                    return;
                }
            }

            if (startInput && startInput.value && endVal < startInput.value) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("종료일이 시작일보다 이전일 수 없습니다.", 'warning');
                target.value = startInput.value;
            }
        }
    },

    updateQuotaDisplay: () => {
        const quotaInfo = document.getElementById('ai_quota_info');
        if (!quotaInfo) return;
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        let usageData;
        try {
            usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
        } catch (e) { usageData = { date: todayStr, count: 0 }; }
        
        if (usageData.date !== todayStr) {
            usageData = { date: todayStr, count: 0 };
            localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
        }
        const remaining = Math.max(0, window.QA_CORE.CONSTANTS.SCHEDULE.MAX_AI_QUOTA - usageData.count);
        quotaInfo.textContent = `⚡ 오늘 AI 자동 등록 남은 횟수: ${remaining} / ${window.QA_CORE.CONSTANTS.SCHEDULE.MAX_AI_QUOTA}`;
    },

    processScreenshot: async (file) => {
        let savedKey = localStorage.getItem('GEMINI_API_KEY');
        if (!savedKey) {
            savedKey = prompt("Gemini API 키가 필요합니다.");
            if (!savedKey) return;
            localStorage.setItem('GEMINI_API_KEY', savedKey.trim());
        }
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        let usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
        if (usageData.date !== todayStr) usageData = { date: todayStr, count: 0 };
        
        if (usageData.count >= window.QA_CORE.CONSTANTS.SCHEDULE.MAX_AI_QUOTA) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("오늘 무료 제공량을 모두 소진했습니다.", 'warning');
            return;
        }

        const dropzoneContent = document.getElementById('ai_dropzone_content');
        const loadingContent = document.getElementById('ai_loading_content');
        if (dropzoneContent && loadingContent) {
            dropzoneContent.classList.add('d-none');
            loadingContent.classList.remove('d-none');
        }

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64Image = reader.result.split(',')[1];
                    const modelEndpoint = window.QA_CORE.CONSTANTS.SCHEDULE.GEMINI_MODEL;
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${savedKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: "이 이미지에서 일정 데이터를 추출해. [{title, start, end}] JSON 배열만 반환해." },
                                    { inline_data: { mime_type: file.type, data: base64Image } }
                                ]
                            }]
                        })
                    });
                    const result = await response.json();
                    let textResult = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
                    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsedArray = JSON.parse(textResult);
                    
                    if (Array.isArray(parsedArray)) {
                        usageData.count++;
                        localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
                        window.QA_CORE.ScheduleDetail.updateQuotaDisplay();
                        
                        for (const [index, item] of parsedArray.entries()) {
                            if (!item.title || !item.start) continue;
                            const id = Date.now().toString() + index;
                            const newSch = { id, title: item.title, start: item.start, end: item.end || item.start, opTicket: '', ticket: '', desc: 'AI 추출', color: '#3b82f6', author: '', poc: '기타' };
                            await firebase.database().ref('shared_schedules/' + id).set(newSch);
                        }
                        if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("AI 일정 추출 및 등록이 완료되었습니다.", "success");
                        window.QA_CORE.ScheduleDetail.closeForm();
                    }
                } catch (innerError) { 
                    if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(innerError, 'Gemini API Parsed'); 
                } finally {
                    if (dropzoneContent && loadingContent) {
                        dropzoneContent.classList.remove('d-none');
                        loadingContent.classList.add('d-none');
                    }
                }
            };
        } catch (error) { 
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Process Screenshot'); 
        }
    },

    openModal: (id = null) => {
        window.QA_DEBUG("openModal() 호출됨", { id });
        const modal = document.getElementById('schedule-modal');
        if (modal) {
            modal.classList.remove('d-none');
            setTimeout(() => modal.classList.add('active'), 10);
        } else {
            console.error("🚨 [ERROR] 'schedule-modal' 요소를 찾을 수 없습니다.");
        }

        const idField = document.getElementById('sch_id');
        if (idField) idField.value = id || '';
        
        if (id) {
            const sch = window.QA_CORE.Calendar.State.schedules.find(s => s.id === id);
            if (sch) {
                document.getElementById('sch_title').value = sch.title;
                document.getElementById('sch_start').value = sch.start;
                document.getElementById('sch_end').value = sch.end;
                document.getElementById('sch_op_ticket').value = sch.opTicket || '';
                document.getElementById('sch_ticket').value = sch.ticket || '';
                document.getElementById('sch_desc').value = sch.desc || '';
                document.getElementById('sch_author').value = sch.author || '';
                
                const pocRadio = document.querySelector(`input[name="sch_poc"][value="${sch.poc || '기타'}"]`);
                if (pocRadio) pocRadio.checked = true;

                const radio = document.querySelector(`input[name="sch_color"][value="${sch.color}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            ['sch_title', 'sch_start', 'sch_end', 'sch_op_ticket', 'sch_ticket', 'sch_desc', 'sch_author'].forEach(eid => {
                const el = document.getElementById(eid);
                if (el) el.value = '';
            });
            
            const defaultPoc = document.querySelector(`input[name="sch_poc"][value="기타"]`);
            if (defaultPoc) defaultPoc.checked = true;
            
            const defaultRadio = document.querySelector(`input[name="sch_color"][value="#3b82f6"]`);
            if (defaultRadio) defaultRadio.checked = true;
        }
        window.QA_CORE.ScheduleDetail.handleTypeChange(); 
    },

    closeForm: () => {
        window.QA_DEBUG("closeForm() 호출됨");
        const modal = document.getElementById('schedule-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('d-none'), 300);
        }
    },

    save: async () => {
        window.QA_DEBUG("save() 호출됨");
        const btn = document.getElementById('btn-save-sch');
        if (btn && btn.disabled) return;

        const idField = document.getElementById('sch_id');
        const id = (idField && idField.value) ? idField.value : Date.now().toString();
        const title = document.getElementById('sch_title')?.value.trim();
        const start = document.getElementById('sch_start')?.value;
        let end = document.getElementById('sch_end')?.value;
        const author = document.getElementById('sch_author')?.value.trim() || '';
        
        const colorRadio = document.querySelector('input[name="sch_color"]:checked');
        const color = colorRadio ? colorRadio.value : '#3b82f6';
        const type = colorRadio ? colorRadio.getAttribute('data-type') : '';
        
        const pocRadio = document.querySelector('input[name="sch_poc"]:checked');
        const poc = pocRadio ? pocRadio.value : '기타';
        
        const opTicket = document.getElementById('sch_op_ticket')?.value.trim() || '';
        const ticket = document.getElementById('sch_ticket')?.value.trim() || '';

        if (type !== '검증' && type !== '할 일') end = start;
        
        if (!title || !start || !end) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("필수 정보를 입력하세요.", 'warning');
            return;
        }

        try {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.textContent = '저장 중...';
            }

            const newSch = { 
                id, title, start, end, author, poc, opTicket, ticket,
                desc: document.getElementById('sch_desc')?.value || '', 
                color 
            };
            
            window.QA_DEBUG("Firebase에 저장 시도", newSch);
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                await firebase.database().ref('shared_schedules/' + id).set(newSch);
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("일정이 성공적으로 저장되었습니다.", "success");
                window.QA_CORE.ScheduleDetail.closeForm();
            } else {
                console.error("🚨 [ERROR] Firebase가 정의되지 않았거나 로그인이 풀렸습니다.");
            }
        } catch (err) {
            console.error("🚨 [ERROR] 저장 중 에러 발생", err);
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Save Schedule Firebase');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = '저장하기';
            }
        }
    },

    open: (id) => {
        window.QA_DEBUG("open() 상세 모달 호출됨", { id });
        const sch = window.QA_CORE.Calendar.State.schedules.find(s => s.id === id);
        if (!sch) {
            console.error("🚨 [ERROR] 일정 ID를 찾을 수 없습니다:", id);
            return;
        }
        window.QA_CORE.Calendar.State.activeSchId = id;

        const modal = document.getElementById('schedule-detail-modal');
        if (modal) {
            modal.classList.remove('d-none');
            setTimeout(() => modal.classList.add('active'), 10);
        } else {
            console.error("🚨 [ERROR] 'schedule-detail-modal' 요소를 찾을 수 없습니다.");
        }
        
        const colorBar = document.getElementById('detail_color_bar');
        if (colorBar) colorBar.style.setProperty('--detail-bg', sch.color);
        
        document.getElementById('detail_title').textContent = sch.title;
        document.getElementById('detail_date').textContent = `${sch.start} ~ ${sch.end}`;

        const descEl = document.getElementById('detail_desc');
        if (descEl) {
            let rawDesc = sch.desc || '-';
            rawDesc = rawDesc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            rawDesc = rawDesc.replace(urlRegex, '<a href="$1" target="_blank" class="color-blue" style="text-decoration: underline; word-break: break-all;">$1</a>');
            rawDesc = rawDesc.replace(/\n/g, '<br>');
            descEl.innerHTML = rawDesc;
        }

        const pocWrapper = document.getElementById('detail_poc_wrapper');
        if (pocWrapper) {
            pocWrapper.classList.toggle('d-none', !sch.poc);
            const elPoc = document.getElementById('detail_poc');
            if (elPoc) elPoc.textContent = sch.poc || '';
        }

        const opTicketWrapper = document.getElementById('detail_op_ticket_wrapper');
        const syncKpiBtn = document.getElementById('btn-sync-kpi');
        
        if (sch.opTicket && sch.opTicket.trim() !== '') {
            if (opTicketWrapper) opTicketWrapper.classList.remove('d-none');
            if (syncKpiBtn) syncKpiBtn.classList.remove('d-none');
            const elOp = document.getElementById('detail_op_ticket');
            if (elOp) {
                const val = sch.opTicket.trim();
                const link = val.startsWith('http') ? val : `https://jira.tde.sktelecom.com/browse/${val}`;
                
                elOp.innerHTML = ''; 
                const aTag = document.createElement('a');
                aTag.href = link;
                aTag.target = '_blank';
                aTag.className = 'color-blue';
                aTag.textContent = `${val} 🔗`;
                elOp.appendChild(aTag);
            }
        } else {
            if (opTicketWrapper) opTicketWrapper.classList.add('d-none');
            if (syncKpiBtn) syncKpiBtn.classList.add('d-none');
        }

        const ticketWrapper = document.getElementById('detail_ticket_wrapper');
        const startWorkflowBtn = document.getElementById('btn-start-workflow');
        const elTicket = document.getElementById('detail_ticket');
        
        if (sch.ticket && sch.ticket.trim() !== '') {
            if (ticketWrapper) ticketWrapper.classList.remove('d-none');
            if (startWorkflowBtn) startWorkflowBtn.classList.remove('d-none');
            if (elTicket) {
                const val = sch.ticket.trim();
                const link = val.startsWith('http') ? val : `https://jira.tde.sktelecom.com/browse/${val}`;
                
                elTicket.innerHTML = '';
                const aTag = document.createElement('a');
                aTag.href = link;
                aTag.target = '_blank';
                aTag.className = 'color-blue';
                aTag.textContent = `${val} 🔗`;
                elTicket.appendChild(aTag);
            }
        } else {
            if (ticketWrapper) ticketWrapper.classList.add('d-none');
            if (startWorkflowBtn) startWorkflowBtn.classList.add('d-none');
        }

        const authorWrapper = document.getElementById('detail_author_wrapper');
        const elAuthor = document.getElementById('detail_author');
        if (sch.author && sch.author.trim() !== '') {
            if (authorWrapper) authorWrapper.classList.remove('d-none');
            if (elAuthor) elAuthor.textContent = sch.author;
        } else {
            if (authorWrapper) authorWrapper.classList.add('d-none');
        }
    },

    closeDetail: () => {
        window.QA_DEBUG("closeDetail() 호출됨");
        const modal = document.getElementById('schedule-detail-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('d-none');
                window.QA_CORE.Calendar.State.activeSchId = null;
            }, 300);
        }
    },

    delete: async () => {
        window.QA_DEBUG("delete() 호출됨");
        const btn = document.getElementById('btn-delete-sch');
        if (btn && btn.disabled) return;

        const id = window.QA_CORE.Calendar.State.activeSchId;
        if (!id || !confirm("일정을 삭제하시겠습니까?")) return;

        try {
            if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
            await firebase.database().ref('shared_schedules/' + id).remove();
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("일정이 삭제되었습니다.", "success");
            window.QA_CORE.ScheduleDetail.closeDetail();
        } catch (err) {
            console.error("🚨 [ERROR] 삭제 중 에러", err);
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Delete Schedule Firebase');
        } finally {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        }
    },

    edit: () => {
        window.QA_DEBUG("edit() 호출됨");
        const id = window.QA_CORE.Calendar.State.activeSchId;
        if (id) {
            window.QA_CORE.Calendar.State.activeSchId = null;
            window.QA_CORE.ScheduleDetail.closeDetail();
            setTimeout(() => window.QA_CORE.ScheduleDetail.openModal(id), 350);
        } else {
            console.error("🚨 [ERROR] 활성화된 일정 ID가 없습니다.");
        }
    },

    startWorkflow: () => {
        window.QA_DEBUG("startWorkflow() 호출됨");
        const id = window.QA_CORE.Calendar.State.activeSchId;
        if (!id) return;
        const sch = window.QA_CORE.Calendar.State.schedules.find(s => s.id === id);
        if (!sch || !sch.ticket) return;
        
        window.QA_CORE.ScheduleDetail.closeDetail();
        if (typeof window.switchMainTab === 'function') window.switchMainTab('issue');
        
        const epicInput = document.getElementById('guide_epic') || document.getElementById('targetUrl');
        if (epicInput) {
            epicInput.value = sch.ticket;
            epicInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
                setTimeout(() => window.QA_CORE.ResultForm.generate(), 100);
            }
        }
    },

    syncToKpi: async () => {
        window.QA_DEBUG("syncToKpi() 호출됨");
        const btn = document.getElementById('btn-sync-kpi');
        if (btn && btn.disabled) return;

        try {
            const id = window.QA_CORE.Calendar.State.activeSchId;
            if (!id) return;
            const sch = window.QA_CORE.Calendar.State.schedules.find(s => s.id === id);
            if (!sch) return;

            let targetName = localStorage.getItem('qa_system_tester_name') || "";
            const nameInput = prompt("이 구글 시트에서 검색할 '본인 이름'을 입력해주세요:", targetName);
            
            if (nameInput === null || nameInput.trim() === "") return;
            targetName = nameInput.trim();
            localStorage.setItem('qa_system_tester_name', targetName);

            if (btn) { btn.disabled = true; btn.textContent = '연동 중...'; }

            let totalItems = 0; 
            const urlMatch = sch.desc ? sch.desc.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)[^\s]*/) : null;

            if (urlMatch) {
                const sheetId = urlMatch[1];
                try {
                    const GAS_URL = window.QA_CORE.CONSTANTS.SCHEDULE.GAS_URL;
                    const SECRET_KEY = window.QA_CORE.CONSTANTS.SCHEDULE.SECRET_KEY; 

                    window.QA_DEBUG("GAS 연동 시작", { sheetId });
                    const response = await fetch(`${GAS_URL}?id=${sheetId}&name=${encodeURIComponent(targetName)}&key=${encodeURIComponent(SECRET_KEY)}`);
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.error) {
                            throw new Error(`GAS Server Error: ${result.error}`);
                        }
                        totalItems = result.total || 0;
                    } else {
                        throw new Error("Proxy Server Network Error");
                    }

                } catch (e) {
                    console.warn("GAS 연동 실패, 수동 입력 전환", e);
                    const manualInput = prompt(`[보안/권한 정책] 데이터 자동 수집에 실패했습니다.\n본인(${targetName})이 검증한 총항목(TC) 개수를 직접 입력해주세요 (0 입력 시 추가 안 함):`, "0");
                    if (manualInput !== null) {
                        totalItems = parseInt(manualInput, 10) || 0;
                    } else {
                        return; 
                    }
                }
            } else {
                const manualInput = prompt(`[${sch.title}]\nURL이 없습니다. 본인이 검증한 총항목(TC) 개수를 입력해주세요 (0 입력 시 추가 안 함):`, "0");
                if (manualInput !== null) {
                    totalItems = parseInt(manualInput, 10) || 0;
                } else {
                    return;
                }
            }

            if (totalItems === 0) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast(`⚠️ [${targetName}] 님의 내역을 찾을 수 없어 KPI 추가를 취소했습니다.`, 'warning');
                return;
            }

            let kpiData;
            try {
                kpiData = JSON.parse(localStorage.getItem('skm_kpi_data')) || { tcRows: [] };
            } catch (e) {
                kpiData = { tcRows: [] };
            }

            const ticketName = sch.title;
            const newTcRow = {
                poc: sch.poc || '기타',
                name: ticketName,
                ticket: sch.opTicket || '',
                total: totalItems,
                isTwoDev: false
            };

            kpiData.tcRows.push(newTcRow);
            localStorage.setItem('skm_kpi_data', JSON.stringify(kpiData));

            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                if (user && !user.isAnonymous) {
                    await firebase.database().ref(`users/${user.uid}/kpi`).set(kpiData);
                }
            }

            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast(`📊 KPI 리포트에 검증 내역이 추가되었습니다. (TC: ${totalItems}건)`, 'success');
        } catch (err) {
            console.error("🚨 [ERROR] KPI 연동 중 에러", err);
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Sync Schedule To KPI');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '📊 KPI와 연동'; }
        }
    },

    initEvents: () => {
        try {
            window.QA_DEBUG("initEvents() 바인딩 시작");
            document.addEventListener('paste', async (e) => {
                const modal = document.getElementById('schedule-modal');
                if (modal && modal.classList.contains('active')) {
                    const items = e.clipboardData?.items || [];
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const file = items[i].getAsFile();
                            if (file) await window.QA_CORE.ScheduleDetail.processScreenshot(file);
                            break;
                        }
                    }
                }
            });
        } catch (e) {
            console.error("🚨 [ERROR] initEvents 초기화 실패", e);
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.ScheduleDetail) {
        window.QA_DEBUG("componentsLoaded 이벤트 감지 -> 초기화 실행");
        window.QA_CORE.ScheduleDetail.updateQuotaDisplay();
        window.QA_CORE.ScheduleDetail.initEvents();
    }
});
