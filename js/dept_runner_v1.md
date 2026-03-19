# js/dept_runner_v1.js 상세 정리 문서

## 1. 파일 개요

| 항목 | 내용 |
|------|------|
| 파일명 | `js/dept_runner_v1.js` |
| 역할 | 부서 관리 UI 연결 파일 (렌더링 + 이벤트 처리) |
| 사용 API | `departmentApi.js` **버전 1 (함수형)** |
| index.html 연결 | `<script type="module" src="js/dept_runner_v1.js">` |
| 대체 파일 | 기존 `department.js` (v1.0)를 역할 분리하여 대체 |

### 이 파일이 하는 일 (3가지)

1. **import** — `departmentApi.js`(버전 1)와 `utils.js`에서 필요한 함수를 가져옵니다.
2. **렌더링** — 서버에서 받은 데이터를 HTML 테이블/폼/드롭다운에 표시합니다.
3. **이벤트 연결** — 버튼과 폼에 클릭/제출 이벤트를 등록합니다.

> API 통신 코드(fetch)는 이 파일에 없습니다. `departmentApi.js`가 전담합니다.

---

## 2. 모듈 의존 관계

```
index.html
  └─ <script type="module" src="js/dept_runner_v1.js">
        │
        ├─ import { getAllDepartments,      ┐
        │           getDepartmentById,      │  js/api/departmentApi.js
        │           createDepartment,       │  (버전 1 - 함수형)
        │           updateDepartment,       │
        │           deleteDepartment }      ┘
        │
        └─ import { escapeHTML,             ┐
                    showMessage }           ┘  js/utils.js
```

### v1.0(department.js)과의 구조 비교

```
[v1.0 department.js] — 하나의 파일에 모든 것이 섞여 있음
┌──────────────────────────────────────┐
│  fetch 코드 (API 통신)               │
│  renderDepartmentList() (렌더링)     │
│  handleFormSubmit() (이벤트)         │
│  showMessage(), escapeHTML() (공통)  │
└──────────────────────────────────────┘

[v2.0] — 역할별로 파일을 분리
┌─────────────────┐   import   ┌──────────────────────┐
│ dept_runner_v1  │ ─────────> │ departmentApi.js (v1) │  fetch 코드
│ (렌더링+이벤트) │            └──────────────────────┘
│                 │   import   ┌──────────────────────┐
│                 │ ─────────> │ utils.js              │  공통 함수
└─────────────────┘            └──────────────────────┘
```

---

## 3. 파일 구조 (섹션별 역할)

```
dept_runner_v1.js
│
├── [1] import 선언부
│     ├── departmentApi.js (버전 1) 에서 API 함수 5개 가져오기
│     └── utils.js 에서 escapeHTML, showMessage 가져오기
│
├── [2] DOM 요소 캐싱
│     └── getElementById / querySelector 로 HTML 요소를 변수에 저장
│
├── [3] 렌더링 함수
│     ├── renderDepartmentList(departments)   - 테이블 목록 렌더링
│     ├── renderDepartmentDetail(department)  - 단건 조회 결과 표시
│     ├── populateSearchDropdown(departments) - 조회용 드롭다운 채우기
│     └── showLoading(isLoading)              - 로딩 인디케이터 제어
│
├── [4] 폼 관련 함수
│     ├── resetDeptForm()         - 폼을 생성 모드로 초기화
│     └── setupEditForm(dept)     - 폼을 수정 모드로 설정
│
├── [5] 데이터 로드 통합 함수
│     └── loadAndRenderDepartments() - 서버 조회 → 테이블 + 드롭다운 갱신
│
├── [6] 이벤트 핸들러
│     ├── handleFormSubmit(e)  - 폼 제출 (생성/수정 분기)
│     ├── handleSearchById()   - 드롭다운 조회 버튼 처리
│     └── handleListClick(e)   - 테이블 수정/삭제 버튼 처리 (이벤트 위임)
│
└── [7] 초기화 (DOMContentLoaded)
      └── 이벤트 리스너 등록 + 첫 데이터 로드
```

---

## 4. import 선언부 상세

```javascript
// named import: 필요한 함수만 이름으로 골라서 가져옵니다.
import {
    getAllDepartments,   // GET  /api/departments       전체 목록
    getDepartmentById,  // GET  /api/departments/{id}  단건 조회
    createDepartment,   // POST /api/departments        생성
    updateDepartment,   // PUT  /api/departments/{id}  수정
    deleteDepartment,   // DELETE /api/departments/{id} 삭제
} from './api/departmentApi.js';  // ← .js 확장자 필수!

import { escapeHTML, showMessage } from './utils.js';
```

**왜 named import를 사용하나요?**
- 파일 전체를 가져오는 것이 아니라 **필요한 것만** 가져옵니다.
- 어떤 함수를 사용하는지 파일 상단에서 바로 파악할 수 있습니다.
- `import './api/departmentApi.js'` (전체 import)와 달리, 사용하지 않는 함수는 포함되지 않습니다.

---

## 5. DOM 캐싱 상세

```javascript
// 폼 영역
const deptForm       = document.getElementById('dept-form');
const deptIdInput    = document.getElementById('dept-id');        // hidden input
const deptNameInput  = document.getElementById('dept-name');
const deptDescInput  = document.getElementById('dept-desc');
const deptFormTitle  = document.getElementById('dept-form-title');
const deptSubmitBtn  = document.getElementById('dept-submit-btn');
const deptCancelBtn  = document.getElementById('dept-cancel-btn');

// 단건 조회 영역
const searchDeptSelect = document.getElementById('search-dept-id');
const deptDetailResult = document.getElementById('dept-detail-result');
const searchDeptBtn    = document.querySelector('#dept-section .card:nth-child(2) .btn-success');

// 목록 영역
const deptListBody = document.getElementById('dept-list');   // <tbody>
const deptLoading  = document.getElementById('dept-loading');
const refreshBtn   = document.querySelector('#dept-section .list-header .btn-info');
```

**DOM 캐싱이란?**
`getElementById`는 DOM을 탐색하는 비용이 발생합니다.
함수가 호출될 때마다 탐색하지 않고, **파일 로드 시 한 번만** 탐색해서 변수에 저장해 두는 방식입니다.

---

## 6. 렌더링 함수 상세

### 6-1. renderDepartmentList(departments)

서버에서 받은 부서 배열을 `<tbody>` 테이블에 렌더링합니다.

```javascript
const renderDepartmentList = (departments) => {
    // 데이터 없음 처리
    if (!departments || departments.length === 0) {
        deptListBody.innerHTML = '<tr><td colspan="4">표시할 부서가 없습니다.</td></tr>';
        return;
    }

    // Array.map(): 배열 요소 → HTML 문자열 배열로 변환
    const rows = departments.map((dept) => `
        <tr>
            <td>${dept.id}</td>
            <td>${escapeHTML(dept.departmentName)}</td>
            <td>${escapeHTML(dept.departmentDescription)}</td>
            <td class="actions">
                <button data-id="${dept.id}" data-action="edit"
                        data-department='${JSON.stringify(dept)}'>수정</button>
                <button data-id="${dept.id}" data-action="delete">삭제</button>
            </td>
        </tr>
    `);

    // join(''): 배열을 하나의 문자열로 합쳐 한 번에 DOM 반영
    deptListBody.innerHTML = rows.join('');
};
```

**v1.0 대비 변경점:**

| 항목 | v1.0 (department.js) | v2.0 (dept_runner_v1.js) |
|------|---------------------|--------------------------|
| 렌더링 방식 | `forEach` + `createElement` + `appendChild` | `map().join('')` + `innerHTML` 한 번에 설정 |
| DOM 조작 횟수 | 부서 수만큼 반복 | 1회 |
| 코드 길이 | 약 15줄 | 약 10줄 |

**data-* 속성의 역할:**
- `data-id` : 수정/삭제 시 API에 전달할 부서 ID
- `data-action` : 버튼이 수정(`edit`)인지 삭제(`delete`)인지 구분
- `data-department` : 수정 폼을 채울 때 필요한 전체 부서 데이터(JSON)

---

### 6-2. renderDepartmentDetail(department)

단건 조회 결과를 화면에 표시합니다.

```javascript
const renderDepartmentDetail = (department) => {
    if (!department) {
        deptDetailResult.style.display = 'none';
        return;
    }
    deptDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${department.id}</p>
        <p><strong>부서명:</strong> ${escapeHTML(department.departmentName)}</p>
        <p><strong>부서 설명:</strong> ${escapeHTML(department.departmentDescription)}</p>
    `;
    deptDetailResult.style.display = 'block';
};
```

---

### 6-3. populateSearchDropdown(departments)

조회 드롭다운(`<select>`)을 부서 목록으로 채웁니다.
`loadAndRenderDepartments()`가 호출될 때마다 함께 갱신됩니다.

```javascript
const populateSearchDropdown = (departments) => {
    searchDeptSelect.innerHTML = '<option value="">조회할 부서를 선택하세요...</option>';
    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        searchDeptSelect.appendChild(option);
    });
};
```

---

## 7. 폼 관련 함수 상세

### 7-1. resetDeptForm() — 생성 모드로 초기화

```javascript
const resetDeptForm = () => {
    deptForm.reset();                       // 모든 입력값 초기화
    deptIdInput.value         = '';         // hidden ID 초기화
    deptFormTitle.textContent = '부서 등록';
    deptSubmitBtn.textContent = '부서 생성';
    deptCancelBtn.style.display = 'none';   // 취소 버튼 숨김
};
```

**호출 시점:**
- 취소 버튼 클릭
- 생성/수정 성공 후

---

### 7-2. setupEditForm(department) — 수정 모드로 전환

```javascript
const setupEditForm = (department) => {
    // Destructuring: 객체에서 필요한 값만 변수로 꺼냅니다.
    const { id, departmentName, departmentDescription } = department;

    deptIdInput.value   = id;              // hidden input에 ID 저장 (수정 시 PUT URL에 사용)
    deptNameInput.value = departmentName;
    deptDescInput.value = departmentDescription;

    deptFormTitle.textContent   = '부서 수정';
    deptSubmitBtn.textContent   = '수정 저장';
    deptCancelBtn.style.display = 'inline-block';  // 취소 버튼 표시

    window.scrollTo(0, 0);  // 폼이 보이도록 상단으로 스크롤
};
```

**Destructuring 비교:**

```javascript
// v1.0 방식: 객체를 통해 프로퍼티에 접근
deptIdInput.value   = department.id;
deptNameInput.value = department.departmentName;
deptDescInput.value = department.departmentDescription;

// v2.0 방식: Destructuring으로 먼저 꺼낸 뒤 사용
const { id, departmentName, departmentDescription } = department;
deptIdInput.value   = id;
deptNameInput.value = departmentName;
deptDescInput.value = departmentDescription;
```

---

## 8. 이벤트 핸들러 상세

### 8-1. handleFormSubmit(e) — 생성/수정 분기 처리

폼의 hidden `dept-id`에 값이 있으면 **수정**, 없으면 **생성**으로 동작합니다.

```
[사용자 동작]
  폼 입력 → 제출 버튼 클릭
      │
      ▼
  handleFormSubmit()
      │
      ├── deptIdInput.value 가 있으면? → updateDepartment(id, data)  [PUT]
      │                                    └── 성공: 메시지 + 폼 초기화 + 목록 갱신
      │
      └── deptIdInput.value 가 없으면? → createDepartment(data)      [POST]
                                           └── 성공: 메시지 + 폼 초기화 + 목록 갱신
```

```javascript
const handleFormSubmit = async (e) => {
    e.preventDefault();

    const id = deptIdInput.value;
    const departmentName        = deptNameInput.value.trim();
    const departmentDescription = deptDescInput.value.trim();

    // 유효성 검사
    if (!departmentName || !departmentDescription) {
        showMessage('부서명과 부서 설명을 모두 입력해주세요.', true);
        return;
    }

    // Shorthand Property: { departmentName: departmentName } 의 축약형
    const departmentData = { departmentName, departmentDescription };

    if (id) {
        const result = await updateDepartment(id, departmentData);  // PUT
        if (result) { showMessage('수정되었습니다.'); resetDeptForm(); await loadAndRenderDepartments(); }
    } else {
        const result = await createDepartment(departmentData);      // POST
        if (result) { showMessage('생성되었습니다.'); resetDeptForm(); await loadAndRenderDepartments(); }
    }
};
```

---

### 8-2. handleSearchById() — 드롭다운 단건 조회

```
[사용자 동작]
  드롭다운에서 부서 선택 → 조회 버튼 클릭
      │
      ▼
  handleSearchById()
      ├── 선택 없음 → 오류 메시지
      └── 선택 있음 → getDepartmentById(id)  [GET /api/departments/{id}]
                         ├── null 반환 → "존재하지 않습니다" 메시지
                         └── 데이터 반환 → renderDepartmentDetail(department)
```

---

### 8-3. handleListClick(e) — 이벤트 위임 방식

테이블의 수정/삭제 버튼을 처리합니다.
**이벤트 위임(Event Delegation)** 방식으로 `<tbody>` 하나에만 이벤트를 등록합니다.

```javascript
const handleListClick = async (e) => {
    // Destructuring: e.target.dataset 객체에서 action과 id를 한 번에 추출
    const { action, id } = e.target.dataset;

    if (!action || !id) return;  // 버튼이 아닌 곳 클릭 시 무시

    if (action === 'edit') {
        // data-department 속성의 JSON 문자열을 객체로 파싱
        const department = JSON.parse(e.target.dataset.department);
        setupEditForm(department);

    } else if (action === 'delete') {
        if (confirm(`정말로 ID ${id} 부서를 삭제하시겠습니까?`)) {
            const ok = await deleteDepartment(id);    // DELETE
            if (ok) { showMessage('삭제되었습니다.'); await loadAndRenderDepartments(); }
        }
    }
};
```

**이벤트 위임이란?**

```
[v1.0 방식] 버튼마다 이벤트 등록
  수정버튼1 → addEventListener('click', ...)
  삭제버튼1 → addEventListener('click', ...)
  수정버튼2 → addEventListener('click', ...)   ← 부서 수가 늘어날수록 이벤트도 증가
  삭제버튼2 → addEventListener('click', ...)

[v2.0 방식] 이벤트 위임 (부모 요소 하나에만 등록)
  <tbody> → addEventListener('click', handleListClick)
      └── 클릭 이벤트가 버블링으로 tbody까지 올라옴
          └── e.target.dataset.action 으로 어떤 버튼인지 구분
```

---

## 9. 초기화 (DOMContentLoaded)

```javascript
document.addEventListener('DOMContentLoaded', () => {

    deptForm.addEventListener('submit', handleFormSubmit);       // 폼 제출
    searchDeptBtn.addEventListener('click', handleSearchById);   // 단건 조회 버튼
    deptListBody.addEventListener('click', handleListClick);     // 수정/삭제 버튼 (위임)
    deptCancelBtn.addEventListener('click', resetDeptForm);      // 취소 버튼
    refreshBtn.addEventListener('click', loadAndRenderDepartments); // 새로고침 버튼

    loadAndRenderDepartments(); // 페이지 로드 시 첫 데이터 로드
});
```

**DOMContentLoaded 이벤트란?**
HTML 문서 파싱이 완료된 시점에 발생합니다.
이 이벤트 안에서 이벤트 리스너를 등록해야 DOM 요소가 확실히 존재합니다.
(`type="module"` 스크립트는 자동으로 defer 처리되므로 사실 없어도 되지만, 명시적으로 작성하는 것이 좋습니다.)

---

## 10. 사용된 ES 문법 정리

| ES 문법 | 사용 위치 | v1.0 대비 변경 |
|---------|-----------|--------------|
| `import` | 파일 상단 | 전역 함수 의존 → 명시적 import |
| `const` | 모든 변수/함수 선언 | `var` 완전 제거 |
| Arrow Function `() => {}` | 모든 함수 선언, 콜백 | `function` 키워드 대체 |
| `async/await` | API 호출 함수 | 동일 (v1.0과 같음) |
| Template Literal `` `${}` `` | HTML 생성, 메시지 문자열 | 문자열 `+` 연결 대체 |
| `Array.map()` | renderDepartmentList | `forEach + createElement` 대체 |
| `Array.forEach()` | populateSearchDropdown | 동일 패턴 유지 |
| `Array.join('')` | renderDepartmentList | map 결과 합치기 |
| Destructuring `{ }` | setupEditForm, handleListClick | 프로퍼티 개별 접근 대체 |
| Shorthand Property | handleFormSubmit | `{ a: a }` → `{ a }` 축약 |
| Ternary Operator `? :` | showLoading | `if/else` 대체 |

---

## 11. index.html 연결 방법

### 변경 전 (v1.0)
```html
<script src="department.js"></script>   <!-- 일반 스크립트 -->
```

### 변경 후 (v2.0)
```html
<!-- type="module" 필수: import/export 사용을 위해 반드시 명시 -->
<script type="module" src="js/dept_runner_v1.js"></script>
```

**`type="module"` 을 쓰면 달라지는 점:**

| 항목 | 일반 스크립트 | type="module" |
|------|-------------|---------------|
| 실행 타이밍 | HTML 파싱 중 즉시 실행 | HTML 파싱 완료 후 실행 (자동 defer) |
| 변수 스코프 | 전역(window) | 모듈 스코프 (외부 접근 불가) |
| import/export | 사용 불가 | 사용 가능 |
| 실행 환경 | `file://` 가능 | HTTP(S) 서버 필수 |
| 중복 실행 | 여러 번 가능 | 최초 1회만 실행 |

---

## 12. 실행 방법 및 주의사항

### 실행 방법
```bash
# VS Code Live Server (추천)
# 하단 상태바 "Go Live" 클릭 → http://localhost:5500

# 또는 터미널에서
npx serve .
# → http://localhost:3000
```

### 주의사항

1. **`file://` 직접 실행 불가** — ES Module은 CORS 정책으로 인해 반드시 HTTP 서버에서 실행해야 합니다.
2. **import 경로에 `.js` 확장자 필수** — `'./api/departmentApi'` (X) → `'./api/departmentApi.js'` (O)
3. **백엔드 서버 실행 필요** — `http://localhost:8080` 에 Spring Boot가 실행 중이어야 합니다.

---

## 13. 파일 위치

```
project/
├── index.html                      ← <script type="module" src="js/dept_runner_v1.js">
├── style.css
├── department.js                   ← v1.0 (참고용, 더 이상 로드되지 않음)
└── js/
    ├── dept_runner_v1.js           ← 이 파일 (UI 연결)
    ├── dept_runner_v1.md           ← 이 문서
    ├── utils.js                    ← escapeHTML, showMessage 제공
    └── api/
        ├── departmentApi.js        ← API 통신 (버전 1 함수형 + 버전 2 클래스형)
        └── departmentApi.md
```
