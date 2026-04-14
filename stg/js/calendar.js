let calCurrentDate = new Date();
let calSchedules = [];
let currentViewingScheduleId = null;

const holidays = {
    "01-01": "신정",
    "03-01": "3·1절",
    "05-05": "어린이날",
    "06-06": "현충일",
    "08-15": "광복절",
    "10-03": "개천절",
    "10-09": "한글날",
    "12-25": "기독탄신일"
};

function getLunarHolidays(year) {
    return {}; 
}

function fetchSchedulesFromFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                firebase.database().ref('shared_schedules').on('value', (snapshot) => {
                    const data = snapshot.val();
                    calSchedules = data ? Object.values(data) : [];
                    renderCalendar();
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadCalendarComponent = async () => {
        try {
            const response = await fetch('components/calendar.html');
            const html = await response.text();
            const placeholder = document.getElementById('comp-calendar');
            if (placeholder) {
                placeholder.innerHTML = html;
            }
            fetchSchedulesFromFirebase(); 
            renderCalendar();
        } catch (error) {
            console.error('Calendar component failed to load:', error);
        }
    };

    loadCalendarComponent();

    const injectCalButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.cal-btn-wrapper')) {
            clearInterval(injectCalButton);

            const calWrapper = document.createElement('div');
            calWrapper.className = 'menu-item-wrapper cal-btn-wrapper';
            calWrapper.onclick = () => switchMainTab('calendar');
            calWrapper.innerHTML = `<div class="setting-btn-float cal-icon">📅</div><span class="menu-label">일정 관리</span>`;

            const issueWrapper = document.createElement('div');
            issueWrapper.className = 'menu-item-wrapper issue-btn-wrapper';
            issueWrapper.onclick = () => switchMainTab('issue');
            issueWrapper.innerHTML = `<div class="setting-btn-float main-icon">📝</div><span class="menu-label">이슈 작성</span>`;

            topBarBtns.prepend(calWrapper);
            topBarBtns.prepend(issueWrapper);
        }
    }, 100);
});

window.switchMainTab = (tabName) => {
    const allTabs = document.querySelectorAll('.main-tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');

    if (tabName === 'calendar') {
        const calTab = document.getElementById('tab-calendar');
        if (calTab) {
            calTab.style.display = 'block';
            renderCalendar();
        }
    } else {
        const issueTab = document.getElementById('tab-issue-maker');
        if (issueTab) issueTab.style.display = 'block';
    }
};

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-month-year');
    if (!grid || !title) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); 

    title.innerText = `${year}. ${String(month + 1).padStart(2, '0')}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    const isThisMonth = (today.getFullYear() === year && today.getMonth() === month);
    const todayDate = today.getDate();

    grid.innerHTML = '';

    for (let i = firstDayIndex; i > 0; i--) {
        const prevDate = prevLastDay - i + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-day empty';
        cell.innerHTML = `<div class="day-number" style="color: #cbd5e1;">${prevDate}</div>`;
        grid.appendChild(cell);
    }

    for (let i = 1; i <= lastDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        
        const currentDayOfWeek = new Date(year, month, i).getDay();
        const dateStringMMDD = `${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateStringYYYYMMDD = `${year}-${dateStringMMDD}`;

        if (currentDayOfWeek === 0 || holidays[dateStringMMDD]) {
            cell.classList.add('sun');
        } else if (currentDayOfWeek === 6) {
            cell.classList.add('sat');
        }

        if (isThisMonth && i === todayDate) {
            cell.classList.add('today');
        }

        let holidayLabel = holidays[dateStringMMDD] ? `<span class="holiday-label">${holidays[dateStringMMDD]}</span>` : '';
        let htmlContent = `<div class="day-number">${i} ${holidayLabel}</div>`;

        const todaysSchedules = calSchedules.filter(s => s.start <= dateStringYYYYMMDD && s.end >= dateStringYYYYMMDD);
        
        todaysSchedules.forEach(schedule => {
            let spanClass = 'span-single';
            if (schedule.start !== schedule.end) {
                if (dateStringYYYYMMDD === schedule.start) spanClass = 'span-start';
                else if (dateStringYYYYMMDD === schedule.end) spanClass = 'span-end';
                else spanClass = 'span-mid';
            }

            let displayText = (spanClass === 'span-start' || spanClass === 'span-single' || currentDayOfWeek === 0 || i === 1) 
                              ? schedule.title : '&nbsp;';

            htmlContent += `<div class="cal-schedule ${spanClass}" style="background-color: ${schedule.color};" onclick="event.stopPropagation(); openScheduleDetail('${schedule.id}')">${displayText}</div>`;
        });

        cell.innerHTML = htmlContent;
        grid.appendChild(cell);
    }

    const totalCells = firstDayIndex + lastDay;
    const nextDays = (Math.ceil(totalCells / 7) * 7) - totalCells; 
    
    for (let i = 1; i <= nextDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day empty';
        cell.innerHTML = `<div class="day-number" style="color: #cbd5e1;">${i}</div>`;
        grid.appendChild(cell);
    }
}

window.changeMonth = (offset) => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderCalendar();
};

window.goToday = () => {
    calCurrentDate = new Date();
    renderCalendar();
};

window.openScheduleModal = (id = null) => {
    const modal = document.getElementById('scheduleModal');
    if (!modal) return;
    
    const idField = document.getElementById('sch_id');
    if (!idField) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'sch_id';
        modal.querySelector('.modal-content').appendChild(hiddenInput);
    }

    if (id) {
        const sch = calSchedules.find(s => s.id === id);
        if (sch) {
            document.getElementById('sch_id').value = sch.id;
            document.getElementById('sch_title').value = sch.title;
            document.getElementById('sch_start').value = sch.start;
            document.getElementById('sch_end').value = sch.end;
            document.getElementById('sch_epic').value = sch.epic;
            document.getElementById('sch_desc').value = sch.desc;
            const radio = document.querySelector(`input[name="sch_color"][value="${sch.color}"]`);
            if(radio) radio.checked = true;
        }
    } else {
        document.getElementById('sch_id').value = '';
        document.getElementById('sch_start').value = '';
        document.getElementById('sch_end').value = '';
        document.getElementById('sch_title').value = '';
        document.getElementById('sch_epic').value = '';
        document.getElementById('sch_desc').value = '';
    }
    
    closeScheduleDetail(); 
    modal.style.display = 'flex';
};

window.closeScheduleModal = () => {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.style.display = 'none';
};

window.saveSchedule = () => {
    const idField = document.getElementById('sch_id');
    const id = (idField && idField.value) ? idField.value : Date.now().toString();
    const title = document.getElementById('sch_title').value;
    const start = document.getElementById('sch_start').value;
    const end = document.getElementById('sch_end').value;
    const epic = document.getElementById('sch_epic').value;
    const desc = document.getElementById('sch_desc').value;
    const color = document.querySelector('input[name="sch_color"]:checked').value;

    if (!title || !start || !end) {
        alert("제목과 날짜를 모두 입력해주세요.");
        return;
    }

    if (start > end) {
        alert("종료일이 시작일보다 빠를 수 없습니다.");
        return;
    }

    const newSchedule = { id, title, start, end, epic, desc, color };

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.database().ref('shared_schedules/' + newSchedule.id).set(newSchedule)
            .then(() => {
                if(typeof showToast === 'function') showToast("일정이 저장되었습니다.");
                closeScheduleModal();
            })
            .catch((error) => {
                console.error("Firebase save error:", error);
                alert("권한이 없거나 저장에 실패했습니다.");
            });
    } else {
        const index = calSchedules.findIndex(s => s.id === id);
        if(index > -1) calSchedules[index] = newSchedule;
        else calSchedules.push(newSchedule);
        renderCalendar();
        closeScheduleModal();
    }
};

window.openScheduleDetail = (id) => {
    const sch = calSchedules.find(s => s.id === id);
    if (!sch) return;

    currentViewingScheduleId = id;

    const modal = document.getElementById('scheduleDetailModal');
    if (!modal) return;

    document.getElementById('detail_color_bar').style.backgroundColor = sch.color;
    document.getElementById('detail_title').innerText = sch.title;
    document.getElementById('detail_date').innerText = `${sch.start} ~ ${sch.end}`;
    document.getElementById('detail_epic').innerText = sch.epic || '등록된 링크 없음';
    document.getElementById('detail_desc').innerText = sch.desc || '상세 내용이 없습니다.';

    modal.style.display = 'flex';
};

window.closeScheduleDetail = () => {
    const modal = document.getElementById('scheduleDetailModal');
    if (modal) modal.style.display = 'none';
    currentViewingScheduleId = null;
};

window.deleteSchedule = () => {
    if (!currentViewingScheduleId) return;
    if (!confirm("이 일정을 정말 삭제하시겠습니까?")) return;

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.database().ref('shared_schedules/' + currentViewingScheduleId).remove()
            .then(() => {
                if(typeof showToast === 'function') showToast("일정이 삭제되었습니다.");
                closeScheduleDetail();
            });
    }
};

window.editSchedule = () => {
    if (!currentViewingScheduleId) return;
    openScheduleModal(currentViewingScheduleId);
};

window.startScheduleWorkflow = () => {
    if (!currentViewingScheduleId) return;
    const sch = calSchedules.find(s => s.id === currentViewingScheduleId);
    
    if (!sch || !sch.epic) {
        alert("Epic Link가 입력되지 않았습니다. 이슈 연동을 진행할 수 없습니다.");
        return;
    }

    closeScheduleDetail();
    switchMainTab('issue');
    
    const prefixPageInput = document.getElementById('prefix_page');
    if (prefixPageInput) {
        prefixPageInput.value = sch.epic;
        if (typeof generateTemplate === 'function') generateTemplate();
        
        prefixPageInput.style.transition = "all 0.3s";
        prefixPageInput.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.5)";
        setTimeout(() => { prefixPageInput.style.boxShadow = "none"; }, 1500);
    }
};
