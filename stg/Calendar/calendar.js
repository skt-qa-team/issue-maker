window.calCurrentDate = new Date();
window.calSchedules = [];
window.currentViewingScheduleId = null;

const holidays = {
    "01-01": "신정", "02-16": "설날 연휴", "02-17": "설날", "02-18": "설날 연휴",
    "03-01": "삼일절", "03-02": "대체공휴일", "05-05": "어린이날", "05-24": "부처님오신날",
    "05-25": "대체공휴일", "06-06": "현충일", "08-15": "광복절", "08-17": "대체공휴일",
    "09-24": "추석 연휴", "09-25": "추석", "09-26": "추석 연휴", "09-28": "대체공휴일",
    "10-03": "개천절", "10-05": "대체공휴일", "10-09": "한글날", "12-25": "성탄절"
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
                    });
                }
            });
        }
    } catch (e) { console.error("[Firebase Load Error]:", e); }
};

document.addEventListener('componentsLoaded', () => {
    console.log("[Calendar] Components Loaded. Initializing...");
    window.fetchSchedulesFromFirebase();
    window.renderCalendar();
    window.updateQuotaDisplay();
});

window.openScheduleModal = (id = null) => {
    console.log("[Action] openScheduleModal called with ID:", id);
    
    try {
        if (typeof id !== 'string') id = null; 

        const modal = document.getElementById('scheduleModal');
        if (!modal) {
            console.error("[Error] scheduleModal element not found in DOM!");
            if (typeof window.showToast === 'function') window.showToast("❌ 모달 요소를 찾을 수 없습니다.");
            return;
        }
        
        const idField = document.getElementById('sch_id');
        if (idField) idField.value = id || '';

        if (id) {
            const sch = window.calSchedules.find(s => s.id === id);
            if (sch) {
                const setVal = (eid, val) => { const e = document.getElementById(eid); if(e) e.value = val; };
                setVal('sch_title', sch.title);
                setVal('sch_start', sch.start);
                setVal('sch_end', sch.end);
                setVal('sch_epic', sch.epic);
                setVal('sch_desc', sch.desc);
                const radio = document.querySelector(`input[name="sch_color"][value="${sch.color}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            ['sch_title', 'sch_start', 'sch_end', 'sch_epic', 'sch_desc'].forEach(eid => {
                const el = document.getElementById(eid);
                if(el) el.value = '';
            });
            const defaultRadio = document.querySelector(`input[name="sch_color"][value="#3b82f6"]`);
            if (defaultRadio) defaultRadio.checked = true;
        }
        
        window.handleScheduleTypeChange(); 
        window.updateQuotaDisplay();
        
        modal.classList.remove('d-none');
        console.log("[Success] scheduleModal displayed.");
    } catch (e) {
        console.error("[Runtime Error] openScheduleModal failed:", e);
        alert("모달을 여는 중 에러 발생: " + e.message);
    }
};

window.renderCalendar = () => {
    try {
        const grid = document.getElementById('cal-grid');
        const title = document.getElementById('cal-month-year');
        if (!grid || !title) return;

        const year = window.calCurrentDate.getFullYear();
        const month = window.calCurrentDate.getMonth();
        title.textContent = `${year}. ${String(month + 1).padStart(2, '0')}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        grid.innerHTML = '';
        const allDays = [];

        for (let i = firstDayIndex; i > 0; i--) allDays.push({ day: prevLastDay - i + 1, month: month - 1, year, type: 'empty' });
        for (let i = 1; i <= lastDay; i++) allDays.push({ day: i, month: month, year, type: 'current' });
        const remain = 42 - allDays.length;
        for (let i = 1; i <= remain; i++) allDays.push({ day: i, month: month + 1, year, type: 'empty' });

        const laneMap = new Map();
        const sortedSchedules = [...window.calSchedules].sort((a, b) => new Date(a.start) - new Date(b.start));

        for (let w = 0; w < 6; w++) {
            const weekDays = allDays.slice(w * 7, (w + 1) * 7);
            const firstDayOfWeek = `${weekDays[0].year}-${String(weekDays[0].month + 1).padStart(2, '0')}-${String(weekDays[0].day).padStart(2, '0')}`;
            const lastDayOfWeek = `${weekDays[6].year}-${String(weekDays[6].month + 1).padStart(2, '0')}-${String(weekDays[6].day).padStart(2, '0')}`;
            const weekSchedules = sortedSchedules.filter(s => s.start <= lastDayOfWeek && s.end >= firstDayOfWeek);
            const lanes = [];

            weekSchedules.forEach(sch => {
                let laneIndex = 0;
                while (lanes[laneIndex] && lanes[laneIndex].some(assigned => sch.start <= assigned.end && sch.end >= assigned.start)) laneIndex++;
                if (!lanes[laneIndex]) lanes[laneIndex] = [];
                lanes[laneIndex].push(sch);
                
                let isHeadAssigned = false;
                weekDays.forEach((wd, dayIdx) => {
                    const dateStr = `${wd.year}-${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
                    if (sch.start <= dateStr && sch.end >= dateStr) {
                        if (!laneMap.has(dateStr)) laneMap.set(dateStr, []);
                        let isHead = false;
                        let span = 0;
                        if (!isHeadAssigned) {
                            isHead = true;
                            isHeadAssigned = true;
                            for (let k = dayIdx; k < 7; k++) {
                                const checkDate = `${weekDays[k].year}-${String(weekDays[k].month + 1).padStart(2, '0')}-${String(weekDays[k].day).padStart(2, '0')}`;
                                if (sch.start <= checkDate && sch.end >= checkDate) span++;
                                else break;
                            }
                        }
                        laneMap.get(dateStr)[laneIndex] = { sch, isHead, span };
                    }
                });
            });
        }

        allDays.forEach((wd, idx) => {
            const cell = document.createElement('div');
            cell.className = `cal-day ${wd.type}`;
            const dateStr = `${wd.year}-${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
            const keyMMDD = `${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
            if (idx % 7 === 0 || (wd.type === 'current' && holidays[keyMMDD])) cell.classList.add('sun');
            else if (idx % 7 === 6) cell.classList.add('sat');
            const dayNumDiv = document.createElement('div');
            dayNumDiv.className = 'day-number';
            dayNumDiv.innerHTML = `${wd.day}${ (wd.type === 'current' && holidays[keyMMDD]) ? `<span class="holiday-label">${holidays[keyMMDD]}</span>` : '' }`;
            cell.appendChild(dayNumDiv);
            const schContainer = document.createElement('div');
            schContainer.className = 'sch-container';
            const dayLanes = laneMap.get(dateStr) || [];
            for (let l = 0; l < dayLanes.length; l++) {
                const item = dayLanes[l];
                const schDiv = document.createElement('div');
                if (item && item.isHead) {
                    schDiv.className = 'cal-schedule span-head';
                    schDiv.style.setProperty('--sch-bg', item.sch.color);
                    schDiv.style.setProperty('--sch-span', item.span);
                    schDiv.textContent = item.sch.title;
                    schDiv.onclick = (e) => { e.stopPropagation(); window.openScheduleDetail(item.sch.id); };
                } else { schDiv.className = 'cal-schedule spacer'; }
                schContainer.appendChild(schDiv);
            }
            cell.appendChild(schContainer);
            grid.appendChild(cell);
        });
    } catch (e) { console.error("[Render Error]:", e); }
};

window.changeMonth = (offset) => { window.calCurrentDate.setMonth(window.calCurrentDate.getMonth() + offset); window.renderCalendar(); };
window.goToday = () => { window.calCurrentDate = new Date(); window.renderCalendar(); };
window.closeScheduleModal = () => { const modal = document.getElementById('scheduleModal'); if (modal) modal.classList.add('d-none'); };

window.saveSchedule = () => {
    try {
        const idField = document.getElementById('sch_id');
        const id = (idField && idField.value) ? idField.value : Date.now().toString();
        const title = document.getElementById('sch_title')?.value.trim();
        const start = document.getElementById('sch_start')?.value;
        let end = document.getElementById('sch_end')?.value;
        const colorRadio = document.querySelector('input[name="sch_color"]:checked');
        const color = colorRadio ? colorRadio.value : '#3b82f6';
        if (colorRadio && colorRadio.getAttribute('data-type') !== '검증') end = start;
        if (!title || !start || !end) return alert("필수 정보를 입력하세요.");
        const newSch = { id, title, start, end, epic: document.getElementById('sch_epic')?.value || '', desc: document.getElementById('sch_desc')?.value || '', color };
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            firebase.database().ref('shared_schedules/' + id).set(newSch).then(() => {
                if(typeof window.showToast === 'function') window.showToast("✅ 저장되었습니다.");
                window.closeScheduleModal();
            }).catch(e => alert("저장 실패: " + e.message));
        } else {
            const idx = window.calSchedules.findIndex(s => s.id === id);
            if(idx > -1) window.calSchedules[idx] = newSch; else window.calSchedules.push(newSch);
            window.renderCalendar(); window.closeScheduleModal();
        }
    } catch (e) { console.error("[Save Error]:", e); }
};

window.handleScheduleTypeChange = () => {
    const selectedRadio = document.querySelector('input[name="sch_color"]:checked');
    if (!selectedRadio) return;
    const type = selectedRadio.getAttribute('data-type');
    const groupEnd = document.getElementById('group_sch_end');
    const groupEpic = document.getElementById('group_sch_epic');
    const labelStart = document.getElementById('label_sch_start');
    if (groupEnd) groupEnd.classList.toggle('d-none', type !== '검증');
    if (groupEpic) groupEpic.classList.toggle('d-none', type !== '검증');
    if (labelStart) {
        if (type === '검증') labelStart.textContent = '시작일 *';
        else if (type === '회의') labelStart.textContent = '회의 날짜 *';
        else labelStart.textContent = '날짜 *';
    }
};

window.updateQuotaDisplay = () => {
    const quotaInfo = document.getElementById('ai_quota_info');
    if (quotaInfo) {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        let usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
        if (usageData.date !== todayStr) usageData = { date: todayStr, count: 0 };
        const remaining = Math.max(0, 20 - usageData.count);
        quotaInfo.textContent = `⚡ 오늘 AI 자동 등록 남은 횟수: ${remaining} / 20`;
    }
};

window.openScheduleDetail = (id) => { /* 상세 로직 생략 */ };
window.closeScheduleDetail = () => { /* 상세 닫기 생략 */ };
window.deleteSchedule = () => { /* 삭제 로직 생략 */ };
