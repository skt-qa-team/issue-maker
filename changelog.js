/**
 * [SKM] 이슈틀 생성기 - Patch Notes Data
 * 새로운 업데이트 발생 시 이 배열의 맨 위에 객체를 추가하면 자동으로 렌더링됩니다.
 */

const changelogData = [
    {
        version: "V18.7",
        date: "2026-03-31",
        changes: [
            "<b>[UI/UX]</b> CSS 변수(Variables) 아키텍처 도입 및 무한 색상 커스텀 팔레트(Color Picker) 기능 탑재",
            "<b>[개인화]</b> 배경, 패널, 텍스트 색상을 자유롭게 선택하고 실시간 프리뷰 및 개별 로컬 저장하는 테마 엔진 구축"
        ]
    },
    {
        version: "V18.5",
        date: "2026-03-31",
        changes: [
            "<b>[버그 픽스]</b> 익명 -> 구글 계정 전환 시 이전 아바타가 지워지지 않고 남아있는 유령 세션(Ghost Session) 현상 해결",
            "<b>[보안]</b> onAuthStateChanged 내부에 강제 삭제(Remove) 로직 탑재하여 안티 고스팅(Anti-Ghosting) 적용"
        ]
    },
    {
        version: "V18.4",
        date: "2026-03-31",
        changes: [
            "<b>[아키텍처]</b> 익명 게스트 + 구글 인증 사용자 하이브리드(Hybrid) 접속 시스템 구축",
            "<b>[세션 관리]</b> 백그라운드 익명 자동 로그인 및 무중단 세션 전환(업그레이드/다운그레이드) 로직 적용"
        ]
    },
    {
        version: "V18.3",
        date: "2026-03-31",
        changes: [
            "<b>[아키텍처]</b> 패치 노트 시스템 모듈화 (changelog.js 분리)",
            "<b>[최적화]</b> index.html 코드 경량화 및 동적 렌더링 엔진 탑재"
        ]
    },
    {
        version: "V18.2",
        date: "2026-03-31",
        changes: [
            "<b>[UI/UX]</b> 화면 100% 풀스크린 와이드 레이아웃(Full-bleed) 적용",
            "<b>[UI/UX]</b> 좌측 가이드 350px 고정, 중앙 및 우측 패널 1:1 유동적 공간 분배"
        ]
    },
    {
        version: "V18.1",
        date: "2026-03-31",
        changes: [
            "<b>[UX 최적화]</b> 디바이스 선택창 세로 1열 고정 정렬 적용",
            "<b>[UX 최적화]</b> 텍스트 입력칸 기본 높이 120px 확장 및 로그인 딜레이 깜빡임(Flickering) 방지"
        ]
    },
    {
        version: "V18.0",
        date: "2026-03-31",
        changes: [
            "<b>[계정 연동]</b> 구글 로그인(Google Auth) 연동 시스템 구축",
            "<b>[실시간]</b> 익명의 동물 대신 실제 구글 프로필 사진 및 실명 연동"
        ]
    },
    {
        version: "V17.4",
        date: "2026-03-31",
        changes: [
            "<b>[실시간 서버]</b> Firebase Realtime Database (싱가포르 리전) 연동 완료",
            "<b>[보안]</b> 익명 인증(Anonymous Auth) 및 onDisconnect를 통한 실시간 접속자 세션 관리 로직 구축"
        ]
    },
    {
        version: "V17.2",
        date: "2026-03-31",
        changes: [
            "<b>[UI/UX]</b> 구글 스프레드시트 스타일의 '실시간 접속자(Presence)' UI 헤더 탑재"
        ]
    },
    {
        version: "V17.0",
        date: "2026-03-31",
        changes: [
            "<b>[기능 추가]</b> 개별 필드 CASE 주입 컨트롤러 탑재 (CASE 1~4 자동 생성)",
            "<b>[버그 픽스]</b> 디바이스 선택 필드 내 체크박스 중복 노출 결함 해결 (Pill UI 최적화)"
        ]
    },
    {
        version: "V16.4",
        date: "2026-03-30",
        changes: [
            "<b>[로직 개선]</b> 서버 배열 처리 시 슬래시(/) 공백 분리 로직 적용 (제목: 공백X / 본문: 공백O)"
        ]
    },
    {
        version: "V16.0",
        date: "2026-03-24",
        changes: [
            "<b>[템플릿 엔진]</b> 리포트 자동 생성 로직(Template Engine) 전면 리팩토링 및 텍스트 조합 성능 최적화",
            "<b>[버그 픽스]</b> 특정 조건에서 Prefix가 중복 출력되던 현상 수정"
        ]
    },
    {
        version: "V15.0",
        date: "2026-03-22",
        changes: [
            "<b>[UI/UX]</b> 우측 결과 출력 패널(Result Panel) 다크 테마(Dark Theme) 전면 적용 및 코드 가독성 향상",
            "<b>[기능 추가]</b> '제목만 복사', '본문만 복사' 개별 클립보드 복사 버튼 추가"
        ]
    },
    {
        version: "V14.0",
        date: "2026-03-20",
        changes: [
            "<b>[로직 개선]</b> POC(Admin, PC Web) 전환 시 불필요한 OS 및 단말기 선택 영역 자동 숨김/표시 처리 로직 고도화",
            "<b>[시스템]</b> 환경 설정 및 패치 노트 모달(Modal) 창 UI 디자인 개선"
        ]
    },
    {
        version: "V13.0",
        date: "2026-03-18",
        changes: [
            "<b>[기능 추가]</b> 제목 Prefix 상세 조건(Critical, 특수 계정, 특정 Device, 이슈 페이지) 세분화 및 개별 입력 폼 신설",
            "<b>[UI/UX]</b> 폼 요소 간격(Margin/Padding) 미세 조정 및 전체 레이아웃 안정성 강화"
        ]
    },
    {
        version: "V12.0",
        date: "2026-03-15",
        changes: [
            "<b>[아키텍처]</b> 구버전(V12) 호환성 체크 후 데이터 마이그레이션 로직 추가",
            "<b>[로직 개선]</b> 로컬 스토리지 마스터 키(STORAGE_KEY) 체계 통합"
        ]
    },
    {
        version: "V11.0",
        date: "2026-03-12",
        changes: [
            "<b>[기능 추가]</b> 원클릭 클립보드 복사(전체/제목/본문) 모듈 탑재",
            "<b>[UI/UX]</b> 하단 고정형 결과 패널 및 복사 버튼 시각화 디자인 적용"
        ]
    },
    {
        version: "V10.0",
        date: "2026-03-10",
        changes: [
            "<b>[시스템]</b> 환경 설정(Admin URL, PC URL, 기기 목록) 로컬 스토리지(Local Storage) 저장 로직 구현",
            "<b>[UI/UX]</b> 톱니바퀴(⚙️) 아이콘 및 환경 설정 모달(Modal) 창 신규 개발"
        ]
    },
    {
        version: "V9.0",
        date: "2026-03-08",
        changes: [
            "<b>[아키텍처]</b> 업무 효율 극대화를 위한 화면 3단 분할 그리드(Grid) 레이아웃 적용",
            "<b>[기능 추가]</b> 상단 헤더 바(Header) 및 실시간 시스템 시계(Clock) 렌더링 도입"
        ]
    },
    {
        version: "V8.0",
        date: "2026-03-06",
        changes: [
            "<b>[로직 개선]</b> OS(Android/iOS) 선택에 따른 테스트 디바이스 체크박스 동적 분리 렌더링",
            "<b>[UI/UX]</b> 알약(Pill) 형태의 체크박스 UI 디자인 최초 도입"
        ]
    },
    {
        version: "V7.0",
        date: "2026-03-05",
        changes: [
            "<b>[기능 추가]</b> 테스트 환경(STG, DEV, PRD) 다중 선택 및 자동 변환(PRD -> 상용) 로직 적용",
            "<b>[기능 추가]</b> 앱 버전 입력 필드 추가 및 OS 선택 기반 자동 매핑 기능 구현"
        ]
    },
    {
        version: "V6.0",
        date: "2026-03-04",
        changes: [
            "<b>[로직 개선]</b> POC(T 멤버십, PC Web, Admin) 선택에 따른 동적 UI 변경(URL 필드 토글) 로직 개발",
            "<b>[템플릿]</b> POC 유형에 따라 리포트의 [Environment] 양식이 자동으로 변경되도록 엔진 고도화"
        ]
    },
    {
        version: "V5.0",
        date: "2026-03-03",
        changes: [
            "<b>[코어 엔진]</b> 스마트 Prefix 조립 로직(Critical, 계정, 단말, 페이지) 최초 탑재",
            "<b>[기능 추가]</b> 현상 요약 필드와 Prefix를 결합하여 최종 Title을 실시간으로 조립하는 엔진 구현"
        ]
    },
    {
        version: "V4.0",
        date: "2026-02-28",
        changes: [
            "<b>[기능 추가]</b> 입력 즉시 결과가 만들어지는 실시간 프리뷰(Real-time Preview) 템플릿 엔진 적용 (oninput 이벤트)",
            "<b>[기능 추가]</b> 참고사항(상용 재현 여부, 기타 내용) 입력 필드 추가"
        ]
    },
    {
        version: "V3.0",
        date: "2026-02-26",
        changes: [
            "<b>[기능 추가]</b> 결함 리포트 필수 4대 요소(Pre-Condition, 재현스텝, 문제현상, 기대결과) 텍스트 에어리어 구축",
            "<b>[UI/UX]</b> 폼(Form) 요소의 레이블 및 입력 영역 디자인 개선 (가독성 향상)"
        ]
    },
    {
        version: "V2.0",
        date: "2026-02-25",
        changes: [
            "<b>[설계]</b> 외부 CSS 파일(style.css) 분리 및 글로벌 기본 타이포그래피/색상 테마 적용",
            "<b>[기능 추가]</b> 초기화(새로 작성) 버튼 로직 추가"
        ]
    },
    {
        version: "V1.0",
        date: "2026-02-24",
        changes: [
            "<b>[프로토타입]</b> 이슈틀 생성기 최초 HTML 뼈대 구축",
            "<b>[설계]</b> 자바스크립트 기반의 원시적인 문자열 합치기(String Concatenation) 로직 테스트"
        ]
    }
];
