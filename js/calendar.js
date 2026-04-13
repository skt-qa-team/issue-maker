// 현재 보고 있는 달력의 기준 날짜 (초기값은 오늘)
let calCurrentDate = new Date();

// 💡 추후 파이어베이스에서 불러올 데이터 형식 (현재는 테스트용 가짜 데이터)
let calSchedules = [
    { date: '2026-04-10', title: '🚀 V21.18 상용 배포', type: 'release' },
    { date: '2026-04-15', title: '👥 주간 QA 미팅', type: 'meeting' },
    { date: '2026-04-15', title: '📝 테스트 케이스 리뷰', type: 'default' },
    { date: '2026-04-24', title: '🔥 핫픽스 검증', type: 'release' },
];

document.addEventListener('DOMContentLoaded', () => {
    // ✨ 필수 로직: components/calendar.html 뼈대를 불러와서 화면에 삽입
    const loadCalendarComponent = async () => {
        try {
            const response = await fetch('components/calendar.html');
            const html = await response.text();
            const placeholder = document.getElementById('comp-calendar');
            if (placeholder) {
                placeholder.innerHTML = html;
            }
            // HTML 뼈대가 완전히 삽입된 후에 달력을 그립니다.
            renderCalendar();
        } catch (error) {
            console.error('Calendar component failed to load:', error);
        }
    };

    // 로드 함수 실행
    loadCalendarComponent();

    // 상단 메뉴바에 '이슈 작성'과 '일정 관리' 버튼을 자동으로 꽂아넣는 로직
    const injectCalButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.cal-btn-wrapper')) {
            clearInterval(injectCalButton);

            // 1. 일정 관리(달력) 버튼 생성
            const calWrapper = document.createElement('div');
            calWrapper.className = 'menu-item-wrapper cal-btn-wrapper';
            calWrapper.onclick = () => switchMainTab('calendar');
            calWrapper.innerHTML = `<div class="setting-btn-float cal-icon">📅</div><span class="menu-label">일정 관리</span>`;

            // 2. 메인(이슈틀) 복귀 버튼 생성
            const issueWrapper = document.createElement('div');
            issueWrapper.className = 'menu-item-wrapper issue-btn-wrapper';
            issueWrapper.onclick = () => switchMainTab('issue');
            issueWrapper.innerHTML = `<div class="setting-btn-float main-icon">📝</div><span class="menu-label">이슈 작성</span>`;

            // 메뉴바 맨 앞에 두 버튼을 나란히 추가
            topBarBtns.prepend(calWrapper);
            topBarBtns.prepend(issueWrapper);
        }
    }, 100);
});

// 메인 탭 전환 함수 (이슈틀 <-> 일정 관리)
window.switchMainTab = (tabName) => {
    // 모든 탭 숨기기
    const allTabs = document.querySelectorAll('.main-tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
    });

    // 선택한 탭만 보여주기
    if (tabName === 'calendar') {
        const calTab = document.getElementById('tab-calendar');
        if (calTab) {
            calTab.style.display = 'block';
            renderCalendar(); // 탭 열 때마다 최신 날짜로 새로고침
        }
    } else {
        const issueTab = document.getElementById('tab-issue-maker');
        if (issueTab) issueTab.style.display = 'block';
    }
};

// 캘린더 그리기 핵심 로직
function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-month-year');
    if (!grid || !title) return; // 뼈대가 없으면 동작 중지

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); // 0 ~ 11

    // 상단 연/월 타이틀 업데이트 (예: 2026. 04)
    title.innerText = `${year}. ${String(month + 1).padStart(2, '0')}`;

    // 이번 달 1일의 요일 (0: 일요일, 6: 토요일)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // 이번 달의 총 일수
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // 이전 달의 총 일수 (빈칸 채우기 용도)
    const prevLastDay = new Date(year, month, 0).getDate();

    // 오늘 날짜 정보 (하이라이트 용도)
    const today = new Date();
    const isThisMonth = (today.getFullYear() === year && today.getMonth() === month);
    const todayDate = today.getDate();

    grid.innerHTML = '';

    // 1. 이전 달 빈칸 채우기
    for (let i = firstDayIndex; i > 0; i--) {
        const prevDate = prevLastDay - i + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-day empty';
        cell.innerHTML = `<div class="day-number" style="color: #cbd5e1;">${prevDate}</div>`;
        grid.appendChild(cell);
    }

    // 2. 이번 달 날짜 채우기
    for (let i = 1; i <= lastDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        
        // 요일 계산해서 주말 색상 입히기
        const currentDayOfWeek = new Date(year, month, i).getDay();
        if (currentDayOfWeek === 0) cell.classList.add('sun');
        if (currentDayOfWeek === 6) cell.classList.add('sat');

        // 오늘 날짜 하이라이트
        if (isThisMonth && i === todayDate) {
            cell.classList.add('today');
        }

        // 해당 날짜의 YYYY-MM-DD 포맷 만들기
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        let htmlContent = `<div class="day-number">${i}</div>`;

        // 💡 이 날짜에 해당하는 스케줄이 있는지 검사하고 그리기
        const todaysSchedules = calSchedules.filter(s => s.date === dateString);
        todaysSchedules.forEach(schedule => {
            const typeClass = schedule.type === 'release' ? 'type-release' : (schedule.type === 'meeting' ? 'type-meeting' : '');
            htmlContent += `<div class="cal-schedule ${typeClass}" onclick="event.stopPropagation(); alert('${schedule.title} 상세 보기')">${schedule.title}</div>`;
        });

        cell.innerHTML = htmlContent;
        
        // 날짜 칸 클릭 이벤트 (나중에 일정 추가 창 띄우기 등에 활용)
        cell.onclick = () => {
            if (typeof showToast === 'function') {
                showToast(`${year}년 ${month + 1}월 ${i}일 선택됨`);
            } else {
                console.log(`${year}년 ${month + 1}월 ${i}일 선택됨`);
            }
        };

        grid.appendChild(cell);
    }

    // 3. 다음 달 빈칸 채우기 (그리드 모양 예쁘게 유지)
    const totalCells = firstDayIndex + lastDay;
    const nextDays = 42 - totalCells; // 최대 6줄(42칸) 기준
    
    for (let i = 1; i <= nextDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day empty';
        cell.innerHTML = `<div class="day-number" style="color: #cbd5e1;">${i}</div>`;
        grid.appendChild(cell);
    }
}

// 이전 달, 다음 달 이동 버튼 로직
window.changeMonth = (offset) => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderCalendar();
};

// '오늘' 버튼 로직
window.goToday = () => {
    calCurrentDate = new Date();
    renderCalendar();
};

// 일정 추가 버튼 로직 (추후 모달창 연결)
window.openScheduleModal = () => {
    const y = calCurrentDate.getFullYear();
    const m = calCurrentDate.getMonth() + 1;
    alert(`[${y}년 ${m}월] 새로운 일정 추가 팝업 띄우기 로직 개발 예정!`);
};
