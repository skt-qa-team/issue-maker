document.addEventListener('DOMContentLoaded', () => {
    // 1. 미니 모드 전용 레이아웃 및 트랜지션 CSS 주입
    const style = document.createElement('style');
    style.innerHTML = `
        /* 부드러운 전환 애니메이션 */
        body, .wrapper, .top-action-bar, .header-horizontal-divider {
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        /* 📱 미니 모드 활성화 시 바탕화면 다크 아웃 */
        body.compact-mode {
            background-color: #0f172a !important; 
        }
        
        /* 메인 래퍼(입력폼 + 결과창) 우측 스냅 및 수직 압축 */
        body.compact-mode .wrapper {
            position: fixed !important;
            right: 20px !important;
            top: 85px !important;
            bottom: 20px !important;
            width: 420px !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 1000 !important;
            background: var(--bg-color);
            padding: 15px !important;
            border-radius: 16px !important;
            box-shadow: -10px 0 40px rgba(0,0,0,0.6) !important;
            border: 1px solid var(--border-color) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
        }

        /* 불필요한 좌측 가이드 패널 완벽 숨김 */
        body.compact-mode #comp-guide {
            display: none !important; 
        }

        /* 상단 헤더 우측 상단으로 압축 및 독립 */
        body.compact-mode .top-action-bar {
            position: fixed !important;
            right: 20px !important;
            top: 15px !important;
            width: 420px !important;
            z-index: 1000 !important;
            grid-template-columns: 1fr auto !important; 
            background: var(--panel-bg);
            padding: 10px 20px !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            border: 1px solid var(--border-color) !important;
            box-sizing: border-box;
            margin: 0 !important;
        }
        
        /* 미니 모드에서는 타이틀과 중앙 시계/버전 숨김 */
        body.compact-mode .top-bar-center-group,
        body.compact-mode .header-horizontal-divider {
            display: none !important; 
        }

        /* 미니 모드 토글 버튼 스타일링 */
        .btn-minimode {
            background: #64748b; color: white; border: none; 
            padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; 
            font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;
            transition: 0.2s; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        }
        .btn-minimode:hover { background: #475569; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        
        /* 켜졌을 때의 버튼 색상 반전 */
        body.compact-mode .btn-minimode { background: #ef4444; }
        body.compact-mode .btn-minimode:hover { background: #dc2828; }
    `;
    document.head.appendChild(style);

    // 2. 우측 상단 톱니바퀴 옆에 '미니모드' 스위치 동적 주입
    // UI가 렌더링되는 비동기 타이밍을 고려하여 interval로 추적
    const injectButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns) {
            clearInterval(injectButton);
            
            const miniBtn = document.createElement('button');
            miniBtn.className = 'btn-minimode';
            miniBtn.innerHTML = '📱 미니모드';
            miniBtn.onclick = toggleMiniMode;
            
            topBarBtns.prepend(miniBtn);
        }
    }, 100);
});

// 3. 토글 로직: body에 클래스를 붙였다 뗐다 하며 애니메이션 트리거
function toggleMiniMode() {
    const body = document.body;
    const btn = document.querySelector('.btn-minimode');
    
    body.classList.toggle('compact-mode');
    
    if (body.classList.contains('compact-mode')) {
        btn.innerHTML = '🖥️ 와이드 복귀';
        if (typeof window.showToast === 'function') {
            window.showToast('📱 미니 모드가 활성화되었습니다.');
        }
    } else {
        btn.innerHTML = '📱 미니모드';
        if (typeof window.showToast === 'function') {
            window.showToast('🖥️ 와이드 모드로 복귀했습니다.');
        }
    }
}
