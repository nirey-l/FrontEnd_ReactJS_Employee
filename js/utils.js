/**
 * @file utils.js
 * @description 여러 모듈에서 공통으로 사용하는 유틸리티 함수 모음입니다.
 *
 * [ES Module] 이 파일은 ES Module 방식으로 작성되었습니다.
 * - export 키워드가 붙은 함수/변수만 다른 파일에서 import해서 사용할 수 있습니다.
 * - 이 파일을 import하는 쪽에서는 필요한 것만 골라서 가져올 수 있습니다.
 *   예) import { escapeHTML, showMessage } from './utils.js';
 *
 * [v1.0 → v2.0 변경점]
 * - department.js 하단에 전역 함수로 흩어져 있던 escapeHTML, showMessage, handleApiError를
 *   이 파일로 이동하여 한 곳에서 관리합니다.
 * - employee.js에서 department.js의 전역 함수를 암묵적으로 의존하던 구조를
 *   import로 명확하게 표현합니다.
 */

// ============================================================
// 1. XSS 방지 - HTML 이스케이프
// ============================================================

/**
 * XSS(Cross-Site Scripting) 공격 방지를 위해 문자열 내의 HTML 특수문자를 안전한 엔티티로 변환합니다.
 * 사용자 입력값이나 서버에서 받은 데이터를 innerHTML에 삽입하기 전에 반드시 이 함수를 거쳐야 합니다.
 *
 * [const] 재할당이 없는 값은 const로 선언합니다. (var 사용 금지)
 * [Arrow Function] function 키워드 대신 화살표 함수를 사용해 간결하게 표현합니다.
 *
 * @param {string} str - 이스케이프 처리할 원본 문자열
 * @returns {string} HTML 특수문자가 엔티티로 변환된 안전한 문자열
 *
 * @example
 * escapeHTML('<script>alert("XSS")</script>')
 * // → '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
// [export] 이 함수를 다른 파일에서 import해서 사용할 수 있도록 공개합니다.
// [const + Arrow Function] function escapeHTML(str) { ... } 대신 화살표 함수로 간결하게 작성합니다.
export const escapeHTML = (str) => {
    // [Nullish Coalescing ??] str이 null 또는 undefined이면 빈 문자열('')을 기본값으로 사용합니다.
    // v1.0의 || 연산자 대신 ?? 를 사용합니다.
    // (||는 0, false, '' 같은 falsy 값도 기본값으로 대체하지만, ??는 오직 null/undefined만 대체합니다.)
    const safeStr = str ?? '';

    // 변환할 특수문자와 그에 대응하는 HTML 엔티티를 객체로 정의합니다.
    // [const] 변하지 않는 매핑 객체이므로 const로 선언합니다.
    const escapeMap = {
        '&': '&amp;',   // & → &amp; (가장 먼저 변환해야 중복 치환 방지)
        '<': '&lt;',    // < → &lt;
        '>': '&gt;',    // > → &gt;
        '"': '&quot;',  // " → &quot;
        "'": '&#39;',   // ' → &#39;
    };

    // [Arrow Function] 정규식 replace의 콜백을 화살표 함수로 작성합니다.
    // 매칭된 특수문자(match)를 escapeMap에서 찾아 엔티티로 교체합니다.
    return String(safeStr).replace(/[&<>"']/g, (match) => escapeMap[match]);
};


// ============================================================
// 2. 사용자 메시지 표시
// ============================================================

/**
 * 화면 상단에 성공 또는 오류 메시지를 3초간 표시합니다.
 * index.html에 id="alert-success"와 id="alert-error" 요소가 있어야 동작합니다.
 *
 * [Arrow Function + 기본 파라미터(Default Parameter)]
 * isError = false 처럼 파라미터에 기본값을 지정할 수 있습니다.
 * 호출 시 isError를 생략하면 자동으로 false가 적용됩니다.
 *
 * @param {string} message - 표시할 메시지 내용
 * @param {boolean} [isError=false] - true이면 오류 메시지(빨간색), false이면 성공 메시지(초록색)
 *
 * @example
 * showMessage('저장되었습니다.');           // 성공 메시지 (초록)
 * showMessage('서버 오류입니다.', true);    // 오류 메시지 (빨강)
 */
// [export] 다른 파일에서 import할 수 있도록 공개합니다.
export const showMessage = (message, isError = false) => {
    // [const] DOM 요소는 변하지 않으므로 const로 선언합니다.
    const alertSuccess = document.getElementById('alert-success');
    const alertError   = document.getElementById('alert-error');

    // [Optional Chaining ?.] alertSuccess 또는 alertError가 null이면 오류 없이 건너뜁니다.
    // (HTML에 해당 id가 없는 경우 방어적으로 처리)
    if (!alertSuccess?.textContent !== undefined && !alertError?.textContent !== undefined) {
        // 두 알림 박스 모두 없으면 콘솔에라도 출력합니다.
        console.warn('[showMessage] alert-success 또는 alert-error 요소를 찾을 수 없습니다.');
    }

    // isError 여부에 따라 사용할 알림 박스를 선택합니다.
    // [Nullish Coalescing ??] 요소가 없을 때 null 대신 동작하지 않도록 처리합니다.
    const alertBox = isError ? alertError : alertSuccess;
    const otherBox = isError ? alertSuccess : alertError; // 반대쪽 박스는 숨깁니다.

    // 두 박스 모두 존재하지 않으면 함수를 종료합니다.
    if (!alertBox) {
        console.warn(`[showMessage] '${isError ? 'alert-error' : 'alert-success'}' 요소를 찾을 수 없습니다.`);
        return;
    }

    // [Template Literal] 백틱(``)과 ${} 를 사용해 문자열 내에 변수를 삽입합니다.
    // v1.0의 문자열 연결('+') 방식 대신 사용합니다.
    alertBox.textContent = message;         // 메시지 텍스트 설정
    alertBox.classList.add('show');         // 'show' 클래스 추가 → CSS로 보이게 처리

    // 반대쪽 박스가 열려있으면 닫습니다. (성공/오류 동시 노출 방지)
    otherBox?.classList.remove('show');

    // 3초 후 자동으로 메시지를 숨깁니다.
    // [Arrow Function] setTimeout 콜백을 화살표 함수로 작성합니다.
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 3000);
};


// ============================================================
// 3. API 에러 처리
// ============================================================

/**
 * fetch API 호출 중 발생한 에러를 분석하여 사용자에게 적절한 메시지를 표시합니다.
 * 네트워크 오류(서버 미실행)와 HTTP 상태 오류(4xx, 5xx)를 구분하여 처리합니다.
 *
 * @param {Error} error - try/catch에서 잡힌 에러 객체
 *
 * @example
 * try {
 *     const res = await fetch('http://localhost:8080/api/departments');
 *     // ...
 * } catch (error) {
 *     handleApiError(error);  // 에러 종류에 맞는 메시지를 자동으로 표시
 * }
 */
// [export] 다른 파일에서 import할 수 있도록 공개합니다.
export const handleApiError = (error) => {
    // 콘솔에도 상세 에러를 기록합니다. (개발 시 디버깅 용도)
    console.error('[API Error]', error);

    // [Optional Chaining ?.] error.message가 없을 수도 있으므로 안전하게 접근합니다.
    // [Nullish Coalescing ??] error.message가 null/undefined이면 빈 문자열을 사용합니다.
    const message = error?.message ?? '';

    // 에러 메시지 종류에 따라 사용자에게 다른 안내를 표시합니다.
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        // 'Failed to fetch': fetch API가 서버에 아예 연결하지 못했을 때 발생 (서버 미실행 등)
        // [Template Literal] 백틱으로 여러 줄의 안내 메시지를 작성합니다.
        showMessage(
            `서버에 연결할 수 없습니다. ` +
            `API 서버(localhost:8080)가 실행 중인지 확인하세요.`,
            true  // isError = true → 오류 메시지 스타일
        );
    } else if (message.includes('404')) {
        // HTTP 404: 요청한 리소스가 서버에 존재하지 않을 때
        showMessage('해당 항목이 존재하지 않습니다. (404 Not Found)', true);
    } else if (message.includes('400')) {
        // HTTP 400: 잘못된 요청 (유효성 검사 실패 등)
        showMessage(`요청이 올바르지 않습니다: ${message}`, true);
    } else if (message.includes('500')) {
        // HTTP 500: 서버 내부 오류
        showMessage('서버 내부 오류가 발생했습니다. (500 Internal Server Error)', true);
    } else {
        // 그 외 모든 에러: 에러 메시지를 그대로 표시합니다.
        showMessage(message || '알 수 없는 오류가 발생했습니다.', true);
    }
};


// ============================================================
// 4. HTTP 응답 공통 처리 (선택적으로 사용)
// ============================================================

/**
 * fetch 응답(Response 객체)의 HTTP 상태 코드를 검사하고,
 * 오류 상태(4xx, 5xx)이면 서버의 에러 메시지를 담아 Error를 throw합니다.
 * 정상 응답(2xx)이면 Response를 그대로 반환하므로 체인 방식으로 사용할 수 있습니다.
 *
 * [async/await] 비동기 처리를 동기 코드처럼 읽기 쉽게 작성합니다.
 *
 * @param {Response} response - fetch()의 반환값인 Response 객체
 * @returns {Promise<Response>} 정상 응답이면 Response를 그대로 반환
 * @throws {Error} HTTP 오류 상태 시 서버 메시지를 담은 Error를 던집니다.
 *
 * @example
 * const response = await fetch(url, options);
 * await checkResponse(response);       // 오류면 throw, 정상이면 진행
 * const data = await response.json();
 */
export const checkResponse = async (response) => {
    // response.ok는 HTTP 상태 코드가 200~299일 때 true입니다.
    if (!response.ok) {
        // 서버가 JSON 형식으로 에러 메시지를 보낼 수도 있으므로 파싱을 시도합니다.
        // [Arrow Function] .catch() 콜백을 화살표 함수로 작성합니다.
        // 파싱 실패 시 기본 오류 객체를 반환합니다.
        const errorData = await response.json().catch(() => ({
            message: `HTTP error! status: ${response.status}`,
        }));

        // [Template Literal] 상태 코드와 메시지를 합쳐 Error를 생성합니다.
        // [Optional Chaining + Nullish Coalescing] errorData.message가 없을 경우 기본 메시지를 사용합니다.
        throw new Error(
            errorData?.message ?? `HTTP error! status: ${response.status}`
        );
    }
    return response;
};
