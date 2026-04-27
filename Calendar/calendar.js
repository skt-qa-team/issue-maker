window.calCurrentDate = new Date();
window.calSchedules = [];

const holidays = {
    "01-01": "신정", "02-16": "설날 연휴", "02-17": "설날", "02-18": "설날 연휴",
    "03-01": "삼일절", "03-02": "대체공휴일", "05-05": "어린이날", "05-24": "부처님오신날",
    "05-25": "대체공휴일", "06-03": "전국동시지방선거일", "06-06": "현충일", "08-15": "광복절", "08-17": "대체공휴일",
    "09-24": "추석 연휴", "09-25": "추석", "09-26": "추석 연휴", "09-28": "대체공휴일",
    "10-03": "개천절", "10-05": "대체공휴일", "10-09": "한글날", "12-25": "성탄절"
};

const getCalDateStr = (y, m, d) => {
    const date = new Date(y, m, d);
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
};

window.fetchSchedulesFromFirebase = () => {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.database) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    firebase.database().ref('shared_schedules').on('value', (snapshot) => {
                        const data = snapshot.val();
                        window.calSchedules = data ? Object.values(data) : [];
                        window.renderCalendar();
                    }, (error) => {
                        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(error, 'Calendar Firebase Fetch');
                    });
                }
            });
        }
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Fetch Schedules From Firebase');
    }
};

document.addEventListener('componentsLoaded', () => {
    try {
        const calContainer = document.getElementById('calendar-placeholder');
        if (!calContainer) return;

        window.fetchSchedulesFromFirebase();
        window.renderCalendar();

        calContainer.addEventListener('click', (e) => {
            try {
                const target = e.target;
                if (target.id === 'btn-prev-month') window.changeMonth(-1);
                if (target.id === 'btn-next-month') window.changeMonth(1);
                if (target.id === 'btn-today') window.goToday();
                if (target.id === 'btn-add-schedule') {
                    if (typeof window.openScheduleModal === 'function') window.openScheduleModal();
                }
                if (target.id === 'btn-sync-month-kpi') {
                    window.syncMonthToKpi();
                }
                
                const scheduleEl = target.closest('.cal-schedule[data-sch-id]');
                if (scheduleEl) {
                    const schId = scheduleEl.dataset.schId;
                    if (schId && typeof window.openScheduleDetail === 'function') {
                        window.openScheduleDetail(schId);
                    }
                }
            } catch (err) {
                if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Calendar Click Event');
            }
        });

        const grid = document.getElementById('cal-grid');
        if (grid) {
            let activeSchId = null;

            grid.addEventListener('mouseover', (e) => {
                try {
                    const schItem = e.target.closest('.cal-schedule[data-sch-id]');
                    if (schItem) {
                        const schId = schItem.dataset.schId;
                        if (activeSchId !== schId) {
                            activeSchId = schId;
                            grid.querySelectorAll(`.cal-schedule[data-sch-id="${schId}"]`).forEach(el => {
                                el.classList.add('sch-active');
                                const parentDay = el.closest('.cal-day');
                                if (parentDay && !parentDay.classList.contains('sun') && !parentDay.classList.contains('sat')) {
                                    parentDay.classList.add('highlight-range');
                                }
                            });
                        }
                    }
                } catch (err) {
                    if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Calendar MouseOver Event');
                }
            });

            grid.addEventListener('mouseout', (e) => {
                try {
                    const schItem = e.target.closest('.cal-schedule[data-sch-id]');
                    if (schItem) {
                        const relatedTarget = e.relatedTarget;
                        const isStillSameSchedule = relatedTarget && 
                                                    relatedTarget.closest('.cal-schedule') && 
                                                    relatedTarget.closest('.cal-schedule').dataset.schId === activeSchId;

                        if (!isStillSameSchedule) {
                            activeSchId = null;
                            grid.querySelectorAll('.cal-day.highlight-range').forEach(el => el.classList.remove('highlight-range'));
                            grid.querySelectorAll('.cal-schedule.sch-active').forEach(el => el.classList.remove('sch-active'));
                        }
                    }
                } catch (err) {
                    if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Calendar MouseOut Event');
                }
            });
        }
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Calendar ComponentsLoaded');
    }
});

window.renderCalendar = () => {
    try {
        const grid = document.getElementById('cal-grid');
        const title = document.getElementById('cal-month-year');
        if (!grid || !title) return;

        const now = new Date();
        const todayStr = getCalDateStr(now.getFullYear(), now.getMonth(), now.getDate());

        const year = window.calCurrentDate.getFullYear();
        const month = window.calCurrentDate.getMonth();
        title.textContent = `${year}. ${String(month + 1).padStart(2, '0')}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        grid.innerHTML = '';
        const allDays = [];
        for (let i = firstDayIndex; i > 0; i--) {
            allDays.push({ year, month: month - 1, day: prevLastDay - i + 1, type: 'dimmed' });
        }
        for (let i = 1; i <= lastDay; i++) {
            allDays.push({ year, month: month, day: i, type: 'current' });
        }
        const remain = 42 - allDays.length;
        for (let i = 1; i <= remain; i++) {
            allDays.push({ year, month: month + 1, day: i, type: 'dimmed' });
        }

        const sortedSchedules = [...window.calSchedules].sort((a, b) => new Date(a.start) - new Date(b.start));

        for (let w = 0; w < 6; w++) {
            const weekRow = document.createElement('div');
            weekRow.className = 'cal-week';
            
            const weekDays = allDays.slice(w * 7, (w + 1) * 7);
            const firstDayOfWeek = getCalDateStr(weekDays[0].year, weekDays[0].month, weekDays[0].day);
            const lastDayOfWeek = getCalDateStr(weekDays[6].year, weekDays[6].month, weekDays[6].day);
            const weekSchedules = sortedSchedules.filter(s => s.start <= lastDayOfWeek && s.end >= firstDayOfWeek);
            
            const lanes = [];
            const weekLaneMap = new Map();

            weekSchedules.forEach(sch => {
                let laneIndex = 0;
                while (lanes[laneIndex] && lanes[laneIndex].some(assigned => sch.start <= assigned.end && sch.end >= assigned.start)) laneIndex++;
                if (!lanes[laneIndex]) lanes[laneIndex] = [];
                lanes[laneIndex].push(sch);
                
                let isHeadAssigned = false;
                weekDays.forEach((wd, dayIdx) => {
                    const dateStr = getCalDateStr(wd.year, wd.month, wd.day);
                    const dateObj = new Date(wd.year, wd.month, wd.day);
                    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(dateObj.getDate()).padStart(2, '0');
                    const keyMMDD = `${mm}-${dd}`;
                    const isNonWorkDay = (dayIdx === 0 || dayIdx === 6 || holidays[keyMMDD]);

                    if (sch.start <= dateStr && sch.end >= dateStr) {
                        if (!weekLaneMap.has(dateStr)) weekLaneMap.set(dateStr, []);
                        let isHead = false; 
                        let span = 0;

                        if (!isNonWorkDay) {
                            if (!isHeadAssigned) {
                                isHead = true; 
                                isHeadAssigned = true;
                                for (let k = dayIdx; k < 7; k++) {
                                    const kStr = getCalDateStr(weekDays[k].year, weekDays[k].month, weekDays[k].day);
                                    const kObj = new Date(weekDays[k].year, weekDays[k].month, weekDays[k].day);
                                    const kMMDD = `${String(kObj.getMonth() + 1).padStart(2, '0')}-${String(kObj.getDate()).padStart(2, '0')}`;
                                    const kNonWork = (k === 0 || k === 6 || holidays[kMMDD]);
                                    if (sch.start <= kStr && sch.end >= kStr && !kNonWork) span++;
                                    else break;
                                }
                            }
                        } else {
                            isHeadAssigned = false;
                        }
                        weekLaneMap.get(dateStr)[laneIndex] = { sch, isHead, span };
                    }
                });
            });

            weekDays.forEach((wd, dayIdx) => {
                const cell = document.createElement('div');
                cell.className = `cal-day ${wd.type}`;
                cell.dataset.date = getCalDateStr(wd.year, wd.month, wd.day);
                
                cell.style.zIndex = 100 - dayIdx;
                
                const dateStr = getCalDateStr(wd.year, wd.month, wd.day);
                const dateObj = new Date(wd.year, wd.month, wd.day);
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const keyMMDD = `${mm}-${dd}`;

                if (dayIdx === 0 || holidays[keyMMDD]) cell.classList.add('sun');
                else if (dayIdx === 6) cell.classList.add('sat');

                const dayNumDiv = document.createElement('div');
                dayNumDiv.className = 'day-number';
                dayNumDiv.innerHTML = `${dateObj.getDate()}${ holidays[keyMMDD] ? `<span class="holiday-label">${holidays[keyMMDD]}</span>` : '' }`;
                cell.appendChild(dayNumDiv);

                const schContainer = document.createElement('div');
                schContainer.className = 'sch-container';
                
                if (wd.type !== 'dimmed') {
                    const dayLanes = weekLaneMap.get(dateStr) || [];
                    for (let l = 0; l < dayLanes.length; l++) {
                        const item = dayLanes[l];
                        const schDiv = document.createElement('div');
                        if (item) {
                            schDiv.dataset.schId = item.sch.id;
                            if (item.isHead) {
                                const isPast = item.sch.end < todayStr && item.sch.color !== '#10b981';
                                schDiv.className = `cal-schedule span-head ${isPast ? 'is-past' : ''}`;
                                schDiv.style.setProperty('--sch-bg', item.sch.color);
                                schDiv.style.setProperty('--sch-span', item.span);
                                schDiv.textContent = item.sch.title;
                            } else { 
                                schDiv.className = 'cal-schedule spacer'; 
                            }
                        } else {
                            schDiv.className = 'cal-schedule spacer none';
                        }
                        schContainer.appendChild(schDiv);
                    }
                }
                cell.appendChild(schContainer);
                weekRow.appendChild(cell);
            });
            grid.appendChild(weekRow);
        }
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Calendar Render Event');
    }
};

window.changeMonth = (offset) => { 
    try {
        window.calCurrentDate.setMonth(window.calCurrentDate.getMonth() + offset); 
        window.renderCalendar(); 
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Change Month');
    }
};

window.goToday = () => { 
    try {
        window.calCurrentDate = new Date(); 
        window.renderCalendar(); 
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Go Today');
    }
};

window.syncMonthToKpi = async () => {
    let progressOverlay = null;
    try {
        if (!window.calSchedules || window.calSchedules.length === 0) return;

        const y = window.calCurrentDate.getFullYear();
        const m = window.calCurrentDate.getMonth();
        
        const firstDayOfMonth = getCalDateStr(y, m, 1);
        const lastDayOfMonth = getCalDateStr(y, m + 1, 0);

        const targetSchedules = window.calSchedules.filter(sch => {
            const isValidation = sch.color === '#3b82f6';
            const isOverlapping = sch.start <= lastDayOfMonth && sch.end >= firstDayOfMonth;
            return isValidation && isOverlapping;
        });

        if (targetSchedules.length === 0) {
            if (typeof window.showToast === 'function') window.showToast("📊 현재 월에 연동할 검증 일정이 없습니다.");
            else alert("📊 현재 월에 연동할 검증 일정이 없습니다.");
            return;
        }

        if (!confirm(`현재 월의 검증 일정 ${targetSchedules.length}건을 KPI 리포트에 일괄 연동하시겠습니까?`)) return;

        progressOverlay = document.createElement('div');
        progressOverlay.id = 'sync-progress-overlay';
        progressOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff;';
        
        const spinner = document.createElement('div');
        spinner.innerHTML = '⏳';
        spinner.style.cssText = 'font-size: 3rem; margin-bottom: 20px;';
        
        const statusText = document.createElement('h3');
        statusText.id = 'sync-progress-text';
        statusText.style.cssText = 'margin: 0 0 15px 0; font-size: 1.2rem; font-weight: bold; text-align: center; max-width: 80%; line-height: 1.5;';
        statusText.textContent = `데이터 수집 준비 중...`;

        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = 'width: 300px; height: 12px; background: rgba(255,255,255,0.2); border-radius: 6px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);';
        
        const progressBar = document.createElement('div');
        progressBar.id = 'sync-progress-bar';
        progressBar.style.cssText = 'width: 0%; height: 100%; background: #3b82f6; transition: width 0.3s ease;';

        progressBarContainer.appendChild(progressBar);
        progressOverlay.appendChild(spinner);
        progressOverlay.appendChild(statusText);
        progressOverlay.appendChild(progressBarContainer);
        document.body.appendChild(progressOverlay);

        const config = JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        const defaultDevices = [...(config.andDefaultDevices || []), ...(config.iosDefaultDevices || [])];
        const targetDevice = defaultDevices.length > 0 ? defaultDevices[0] : null;

        let kpiData;
        try {
            kpiData = JSON.parse(localStorage.getItem('skm_kpi_data')) || { tcRows: [] };
        } catch (e) {
            kpiData = { tcRows: [] };
        }

        const GAS_URL = "https://script.google.com/macros/s/AKfycbza7-LwOx9sS6V0RUemwMxzggzw-ikOCJqUJ4uACI4PXT48Thu_ql_THytZUPgIxect/exec";
        const SECRET_KEY = "Qpalzm123!@#";

        let currentCount = 0;
        const totalCount = targetSchedules.length;

        for (const sch of targetSchedules) {
            currentCount++;
            statusText.textContent = `[${sch.title}]\n데이터 연동 중... (${currentCount} / ${totalCount})`;
            progressBar.style.width = `${(currentCount / totalCount) * 100}%`;

            let totalItems = 1;
            const urlMatch = sch.desc ? sch.desc.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)[^\s]*/) : null;

            if (urlMatch && targetDevice) {
                const sheetId = urlMatch[1];
                try {
                    const response = await fetch(`${GAS_URL}?id=${sheetId}&device=${encodeURIComponent(targetDevice)}&key=${encodeURIComponent(SECRET_KEY)}`);
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.error) {
                            console.error(`💡 [${sch.title}] GAS 디버깅 정보:`, result);
                            throw new Error(`GAS Server Error: ${result.error}`);
                        }
                        totalItems = result.total || 1;
                    } else {
                        throw new Error("Proxy Server Network Error");
                    }
                } catch (e) {
                    console.warn(`[Calendar] GAS Proxy Failed for [${sch.title}].`, e);
                    
                    progressOverlay.style.display = 'none';
                    const manualInput = prompt(`[보안/권한 정책] [${sch.title}]의 데이터 수집에 실패했습니다.\n설정하신 기본 단말(${targetDevice})의 총항목(TC) 개수를 직접 입력해주세요:`, "65");
                    if (manualInput !== null) {
                        totalItems = parseInt(manualInput, 10) || 1;
                    }
                    progressOverlay.style.display = 'flex';
                }
            } else {
                progressOverlay.style.display = 'none';
                const manualInput = prompt(`[${sch.title}]\nURL이 없습니다. 검증에 수행된 총항목(TC) 개수를 입력해주세요:`, "1");
                if (manualInput !== null) {
                    totalItems = parseInt(manualInput, 10) || 1;
                }
                progressOverlay.style.display = 'flex';
            }

            const newTcRow = {
                poc: sch.poc || '기타',
                name: sch.title,
                ticket: sch.opTicket || '',
                total: totalItems,
                isTwoDev: false
            };
            kpiData.tcRows.push(newTcRow);
        }

        localStorage.setItem('skm_kpi_data', JSON.stringify(kpiData));

        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const user = firebase.auth().currentUser;
            if (user && !user.isAnonymous) {
                firebase.database().ref(`users/${user.uid}/kpi`).set(kpiData).catch(err => {
                    if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'KPI Firebase Sync (Month)');
                });
            }
        }

        if (progressOverlay) progressOverlay.remove();

        if (typeof window.showToast === 'function') {
            window.showToast(`📊 ${targetSchedules.length}건의 일정이 KPI 리포트에 성공적으로 연동되었습니다.`);
        } else {
            alert(`📊 ${targetSchedules.length}건의 일정이 KPI 리포트에 성공적으로 연동되었습니다.`);
        }
    } catch (err) {
        if (progressOverlay) progressOverlay.remove();
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Sync Month To KPI');
    }
};
