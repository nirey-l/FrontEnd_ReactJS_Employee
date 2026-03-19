# js/utils.js 공통 유틸리티 모듈 정리

## 역할

여러 모듈에서 공통으로 사용하는 함수를 한 곳에 모아 관리합니다.
`export` 키워드로 공개된 함수만 다른 파일에서 `import`하여 사용할 수 있습니다.

**v1.0 대비 변경점:**
`department.js` 하단에 전역 함수로 흩어져 있던 `escapeHTML`, `showMessage`, `handleApiError`를
이 파일로 이동하여 단일 책임 원칙(SRP)을 적용했습니다.

---

## 포함된 함수

| 함수 | 파라미터 | 반환값 | 역할 |
|------|----------|--------|------|
| `escapeHTML(str)` | `str: string` | `string` | XSS 방지용 HTML 특수문자 → 엔티티 변환 |
| `showMessage(message, isError)` | `message: string`, `isError: boolean = false` | `void` | 성공/오류 알림 박스를 3초간 표시 |
| `handleApiError(error)` | `error: Error` | `void` | fetch 에러 종류 분석 → 적절한 메시지 표시 |
| `checkResponse(response)` | `response: Response` | `Promise<Response>` | HTTP 응답 상태 검사 → 오류면 throw |

---

## 함수별 상세 설명

### 1. `escapeHTML(str)`

사용자 입력값이나 서버에서 받은 데이터를 `innerHTML`에 삽입하기 전에 반드시 사용합니다.

**변환 규칙:**

| 특수문자 | 변환 결과 |
|----------|-----------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

```javascript
// 사용 예시
escapeHTML('<script>alert("XSS")</script>')
// → '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'

escapeHTML(dept.departmentName)   // 부서명 출력 시
escapeHTML(emp.firstName)         // 직원명 출력 시
```

---

### 2. `showMessage(message, isError)`

화면에 성공 또는 오류 메시지를 3초간 표시합니다.

**동작 조건:** `index.html`에 아래 두 요소가 반드시 있어야 합니다.
```html
<div id="alert-success"></div>
<div id="alert-error"></div>
```

```javascript
// 사용 예시
showMessage('부서가 저장되었습니다.');          // 성공 메시지 (초록색)
showMessage('서버 오류입니다.', true);          // 오류 메시지 (빨간색)
showMessage('ID를 입력해주세요.', true);        // 유효성 검사 실패
```

---

### 3. `handleApiError(error)`

`try/catch`에서 잡힌 에러를 분석하여 사용자에게 적절한 안내 메시지를 표시합니다.
내부적으로 `showMessage()`를 호출합니다.

**에러 종류별 처리:**

| 에러 종류 | 표시 메시지 |
|-----------|-------------|
| `Failed to fetch` / `NetworkError` | 서버에 연결할 수 없습니다. localhost:8080 확인 요청 |
| `404` 포함 | 해당 항목이 존재하지 않습니다. (404 Not Found) |
| `400` 포함 | 요청이 올바르지 않습니다. (서버 메시지 포함) |
| `500` 포함 | 서버 내부 오류가 발생했습니다. (500 Internal Server Error) |
| 그 외 | 에러 메시지 그대로 표시 |

```javascript
// 사용 예시
try {
    const res = await fetch('http://localhost:8080/api/departments');
    // ...
} catch (error) {
    handleApiError(error);  // 에러 종류에 맞는 메시지 자동 표시
}
```

---

### 4. `checkResponse(response)` *(선택적 사용)*

`fetch()` 응답의 HTTP 상태 코드를 검사합니다.
정상(2xx)이면 Response를 그대로 반환하고, 오류(4xx/5xx)이면 서버 메시지를 담아 `Error`를 throw합니다.

```javascript
// 사용 예시 - API 클래스 메서드 내부에서 체인 방식으로 사용
const response = await fetch(url, options);
await checkResponse(response);          // 오류면 throw → catch로 이동
const data = await response.json();     // 정상이면 계속 진행
```

---

## 사용된 ES 문법

| ES 문법 | 사용 위치 | 설명 |
|---------|-----------|------|
| `const` | 모든 함수/변수 선언 | `var` 완전 제거, 블록 스코프 안전성 |
| Arrow Function `() => {}` | 모든 함수, 콜백 함수 | `function` 키워드 대체 |
| `export` | 함수 선언부 앞 | 다른 파일에서 `import` 가능하도록 공개 |
| `??` Nullish Coalescing | `str ?? ''`, `error?.message ?? ''` | `null`/`undefined`일 때만 기본값 적용 |
| `?.` Optional Chaining | `alertSuccess?.classList`, `error?.message` | `null`/`undefined`이어도 오류 없이 접근 |
| Template Literal `` `${}` `` | 에러 메시지 조합 | 문자열 `+` 연결 대체 |
| Default Parameter | `isError = false` | 파라미터 생략 시 자동 기본값 적용 |

---

## 다른 모듈에서 사용하는 방법

```javascript
// js/api/departmentApi.js, js/api/employeeApi.js 에서
import { handleApiError, checkResponse } from '../utils.js';

// js/ui/departmentUI.js, js/ui/employeeUI.js 에서
import { escapeHTML, showMessage } from '../utils.js';

// 필요한 함수만 골라서 가져올 수도 있습니다.
import { escapeHTML } from '../utils.js';
```

> **주의:** ES Module은 import 경로에 `.js` 확장자를 반드시 포함해야 합니다.
> `'../utils'` (X) → `'../utils.js'` (O)

---

## 파일 위치

```
project/
└── js/
    ├── utils.js       ← 이 파일
    ├── api/
    │   ├── departmentApi.js   (import { handleApiError, checkResponse })
    │   └── employeeApi.js     (import { handleApiError, checkResponse })
    └── ui/
        ├── departmentUI.js    (import { escapeHTML, showMessage })
        └── employeeUI.js      (import { escapeHTML, showMessage })
```
