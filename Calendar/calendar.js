window.calCurrentDate = new Date();
window.calSchedules = [];

const holidays = {
    "01-01": "신정", "02-16": "설날 연휴", "02-17": "설날", "02-18": "설날 연휴",
    "03-01": "삼일절", "03-02": "대체공휴일", "05-05": "어린이날", "05-24": "부처님오신날",
    "05-25": "대체공휴일", "06-06": "현충일", "08-15": "광복절", "08-17": "대체공휴일",
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
};

document.addEventListener('componentsLoaded', () => {
    const calContainer = document.getElementById('calendar-placeholder');
    if (!calContainer) return;

    window.fetchSchedulesFromFirebase();
    window.renderCalendar();

    // 창 크기 조절 시 일정 바 너비 재계산 (디바운스 적용)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            window.updateScheduleWidths();
        }, 100);
    });

    calContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.id === 'btn-prev-month') window.changeMonth(-1);
        if (target.id === 'btn-next-month') window.changeMonth(1);
        if (target.id === 'btn-today') window.goToday();
        if (target.id === 'btn-add-schedule') {
            if (typeof window.openScheduleModal === 'function') window.openScheduleModal();
        }
        const scheduleEl = target.closest('.cal-schedule[data-sch-id]');
        if (scheduleEl) {
            const schId = scheduleEl.dataset.schId;
            if (schId && typeof window.openScheduleDetail === 'function') {
                window.openScheduleDetail(schId);
            }
        }
    });

    const grid = document.getElementById('cal-grid');
    if (grid) {
        let activeSchId = null;

        grid.addEventListener('mouseover', (e) => {
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
        });

        grid.addEventListener('mouseout', (e) => {
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
        });
    }
});

// 일정 바 너비를 동적으로 계산하고 적용하는 함수
window.updateScheduleWidths = () => {
    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    // 기준이 될 첫 번째 칸의 너비를 측정
    const sampleDay = grid.querySelector('.cal-day');
    if (!sampleDay) return;
    
    // getBoundingClientRect()를 사용하여 소수점까지 정확한 너비 확보
    const cellWidth = sampleDay.getBoundingClientRect().width;
    const gapWidth = 2; // cal-grid의 gap 속성값
    
    const spanHeads = document.querySelectorAll('.cal-schedule.span-head');
    spanHeads.forEach(head => {
        const span = parseInt(head.dataset.span || 1);
        if (span > 1) {
            // (칸 너비 * 걸치는 칸 수) + (간격 너비 * (걸치는 칸 수 - 1)) - (좌우 여백)
            const totalWidth = (cellWidth * span) + (gapWidth * (span - 1)) - 16;
            head.style.width = `${totalWidth}px`;
        } else {
            head.style.width = 'calc(100% - 16px)'; // 단일 일정은 CSS 100% 사용
        }
    });
};

window.renderCalendar = () => {
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

    const laneMap = new Map();
    const sortedSchedules = [...window.calSchedules].sort((a, b) => new Date(a.start) - new Date(b.start));

    for (let w = 0; w < 6; w++) {
        const weekDays = allDays.slice(w * 7, (w + 1) * 7);
        const firstDayOfWeek = getCalDateStr(weekDays[0].year, weekDays[0].month, weekDays[0].day);
        const lastDayOfWeek = getCalDateStr(weekDays[6].year, weekDays[6].month, weekDays[6].day);
        const weekSchedules = sortedSchedules.filter(s => s.start <= lastDayOfWeek && s.end >= firstDayOfWeek);
        const lanes = [];

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
                    if (!laneMap.has(dateStr)) laneMap.set(dateStr, []);
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
                    laneMap.get(dateStr)[laneIndex] = { sch, isHead, span };
                }
            });
        });
    }

    allDays.forEach((wd, idx) => {
        const cell = document.createElement('div');
        cell.className = `cal-day ${wd.type}`;
        cell.dataset.date = getCalDateStr(wd.year, wd.month, wd.day);
        cell.style.zIndex = 100 - idx; 

        const dateStr = getCalDateStr(wd.year, wd.month, wd.day);
        const dateObj = new Date(wd.year, wd.month, wd.day);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const keyMMDD = `${mm}-${dd}`;

        if (idx % 7 === 0 || holidays[keyMMDD]) cell.classList.add('sun');
        else if (idx % 7 === 6) cell.classList.add('sat');

        const dayNumDiv = document.createElement('div');
        dayNumDiv.className = 'day-number';
        dayNumDiv.innerHTML = `${dateObj.getDate()}${ holidays[keyMMDD] ? `<span class="holiday-label">${holidays[keyMMDD]}</span>` : '' }`;
        cell.appendChild(dayNumDiv);

        const schContainer = document.createElement('div');
        schContainer.className = 'sch-container';
        
        if (wd.type !== 'dimmed') {
            const dayLanes = laneMap.get(dateStr) || [];
            for (let l = 0; l < dayLanes.length; l++) {
                const item = dayLanes[l];
                const schDiv = document.createElement('div');
                if (item) {
                    schDiv.dataset.schId = item.sch.id;
                    if (item.isHead) {
                        const isPast = item.sch.end < todayStr && item.sch.color !== '#10b981';
                        schDiv.className = `cal-schedule span-head ${isPast ? 'is-past' : ''}`;
                        schDiv.style.setProperty('--sch-bg', item.sch.color);
                        
                        // CSS의 calc() 대신 JS에서 데이터로 저장 후 연산
                        schDiv.dataset.span = item.span; 
                        
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
        grid.appendChild(cell);
    });

    // 캘린더 렌더링 직후 너비 강제 동기화
    // setTimeout을 사용하여 DOM 그리기 완료 후 계산되도록 보장
    setTimeout(() => {
        window.updateScheduleWidths();
    }, 0);
};

window.changeMonth = (offset) => { 
    window.calCurrentDate.setMonth(window.calCurrentDate.getMonth() + offset); 
    window.renderCalendar(); 
};

window.goToday = () => { 
    window.calCurrentDate = new Date(); 
    window.renderCalendar(); 
};
