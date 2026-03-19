# js/emp_runner_v1.js 상세 정리 문서

## 1. 파일 개요

| 항목 | 내용 |
|------|------|
| 파일명 | `js/emp_runner_v1.js` |
| 역할 | 직원 관리 UI 연결 파일 (렌더링 + 이벤트 처리) |
| 사용 API | `employeeApi.js` **버전 1 (함수형)** + `departmentApi.js` **버전 1 (함수형)** |
| index.html 연결 | `<script type="module" src="js/emp_runner_v1.js">` |
| 대체 파일 | 기존 `employee.js` (v1.0)를 역할 분리하여 대체 |

### 이 파일이 하는 일 (4가지)

1. **import** — `employeeApi.js`(버전 1), `departmentApi.js`(버전 1), `utils.js`에서 필요한 함수를 가져옵니다.
2. **렌더링** — 서버에서 받은 데이터를 HTML 테이블/폼/드롭다운에 표시합니다.
3. **이벤트 연결** — 버튼과 폼에 클릭/제출 이벤트를 등록합니다.
4. **전역 등록** — `window.initEmployeeTab`으로 index.html의 `showTab()`과 연결합니다.

> API 통신 코드(fetch)는 이 파일에 없습니다. `employeeApi.js`가 전담합니다.

### dept_runner_v1.js와의 핵심 차이점

| 항목 | dept_runner_v1.js | emp_runner_v1.js |
|------|-----------------|-----------------|
| import 모듈 수 | 2개 (departmentApi, utils) | 3개 (employeeApi, **departmentApi**, utils) |
| 부서 API 사용 목적 | 직접 CRUD | 직원 폼의 **부서 드롭다운** 채우기 |
| 조회 방식 | 드롭다운 선택 (1가지) | **ID 입력** + **이메일 입력** (2가지) |
| 목록 표시 모드 | 1가지 | **기본 조회** + **부서 포함 조회** (2가지) |
| 초기화 방식 | `DOMContentLoaded` | `initEmployeeTab()` + `window` 전역 등록 |
| 초기화 중복 방지 | 불필요 (DOMContentLoaded는 1회) | `let isInitialized` 플래그 |

---

## 2. 모듈 의존 관계

```
index.html
  └─ <script type="module" src="js/emp_runner_v1.js">
        │
        ├─ import { getAllEmployees,                ┐
        │           getAllEmployeesWithDepartments, │  js/api/employeeApi.js
        │           getEmployeeById,               │  (버전 1 - 함수형)
        │           getEmployeeByEmail,            │
        │           createEmployee,                │
        │           updateEmployee,                │
        │           deleteEmployee }               ┘
        │
        ├─ import { getAllDepartments }             ←  js/api/departmentApi.js
        │                                             (부서 드롭다운 채우기 전용)
        │
        └─ import { escapeHTML, showMessage }      ←  js/utils.js
```

### v1.0(employee.js)과의 구조 비교

```
[v1.0 employee.js] — 하나의 파일에 모든 것이 섞여 있음
┌───────────────────────────────────────────────────┐
│  fetch 코드 (API 통신)                             │
│  renderEmployeeList() (렌더링)                     │
│  handleEmpFormSubmit() (이벤트)                    │
│  department.js의 전역 handleApiError 암묵적 의존   │ ← 위험!
│  fetch('/api/departments') 직접 호출 (중복)        │ ← 중복!
└───────────────────────────────────────────────────┘

[v2.0] — 역할별로 파일을 분리하고 명시적 import 사용
┌─────────────────┐   import   ┌──────────────────────┐
│ emp_runner_v1   │ ─────────> │ employeeApi.js (v1)  │  직원 fetch 코드
│ (렌더링+이벤트) │            └──────────────────────┘
│                 │   import   ┌──────────────────────┐
│                 │ ─────────> │ departmentApi.js (v1)│  부서 드롭다운용
│                 │            └──────────────────────┘
│                 │   import   ┌──────────────────────┐
│                 │ ─────────> │ utils.js             │  공통 함수
└─────────────────┘            └──────────────────────┘
```

---

## 3. 파일 구조 (섹션별 역할)

```
emp_runner_v1.js
│
├── [1] import 선언부
│     ├── employeeApi.js (버전 1) 에서 직원 API 함수 7개 가져오기
│     ├── departmentApi.js (버전 1) 에서 getAllDepartments 가져오기
│     └── utils.js 에서 escapeHTML, showMessage 가져오기
│
├── [2] DOM 요소 캐싱
│     └── getElementById / querySelector 로 HTML 요소를 변수에 저장
│
├── [3] 렌더링 함수
│     ├── renderEmployeeList(employees, withDept)  - 테이블 목록 렌더링 (2가지 모드)
│     ├── renderEmployeeDetail(employee)           - 단건 조회 결과 표시
│     ├── populateDeptDropdown(departments)        - 직원 폼 부서 드롭다운 채우기
│     └── showEmpLoading(isLoading)               - 로딩 인디케이터 제어
│
├── [4] 폼 관련 함수
│     ├── resetEmpForm()             - 폼을 생성 모드로 초기화
│     └── setupEmpEditForm(employee) - 폼을 수정 모드로 설정
│
├── [5] 데이터 로드 통합 함수
│     ├── loadAndRenderEmployees()         - 기본 조회 → 테이블 갱신
│     └── loadAndRenderEmployeesWithDept() - 부서 포함 조회 → 테이블 갱신
│
├── [6] 이벤트 핸들러
│     ├── handleEmpFormSubmit(e)      - 폼 제출 (생성/수정 분기)
│     ├── handleSearchEmpById()       - ID 입력 조회 버튼 처리
│     ├── handleSearchEmpByEmail()    - 이메일 입력 조회 버튼 처리
│     └── handleEmpListClick(e)       - 테이블 수정/삭제 버튼 처리 (이벤트 위임)
│
├── [7] 직원 탭 초기화 함수
│     └── initEmployeeTab()
│           ├── isInitialized 플래그로 중복 실행 방지
│           ├── 부서 드롭다운 채우기
│           ├── 첫 데이터 로드
│           └── 이벤트 리스너 7개 등록
│
└── [8] 전역 등록
      └── window.initEmployeeTab = initEmployeeTab
            └── index.html showTab()에서 호출 가능하게 만들기
```

---

## 4. import 선언부 상세

```javascript
// 직원 API 함수 7개 — named import
import {
    getAllEmployees,                 // GET    /api/employees
    getAllEmployeesWithDepartments,  // GET    /api/employees/departments
    getEmployeeById,                // GET    /api/employees/{id}
    getEmployeeByEmail,             // GET    /api/employees/email/{email}
    createEmployee,                 // POST   /api/employees
    updateEmployee,                 // PUT    /api/employees/{id}
    deleteEmployee,                 // DELETE /api/employees/{id}
} from './api/employeeApi.js';      // ← .js 확장자 필수!

// 부서 드롭다운 전용 — 직원 폼의 부서 선택 <select> 채우기에만 사용
import { getAllDepartments } from './api/departmentApi.js';

// 공통 유틸리티
import { escapeHTML, showMessage } from './utils.js';
```

**왜 `departmentApi.js`도 import하나요?**

직원 등록/수정 폼에 부서 선택 드롭다운(`<select id="emp-dept-id">`)이 있습니다.
이 드롭다운을 채우려면 부서 목록을 서버에서 가져와야 합니다.

```
v1.0 employee.js 방식:
  populateDepartmentDropdown() 함수 안에서
  fetch(`${API_BASE_URL}/departments`) 직접 호출 ← 이미 departmentApi에 있는데 중복!

v2.0 emp_runner_v1.js 방식:
  import { getAllDepartments } from './api/departmentApi.js'
  const departments = await getAllDepartments() ← 이미 만들어진 함수 재사용
```

---

## 5. DOM 캐싱 상세

```javascript
// 직원 등록/수정 폼 영역
const empForm           = document.getElementById('emp-form');
const empIdInput        = document.getElementById('emp-id');         // hidden: 수정 시 ID 보관
const empFirstNameInput = document.getElementById('emp-firstname');
const empLastNameInput  = document.getElementById('emp-lastname');
const empEmailInput     = document.getElementById('emp-email');
const empDeptIdSelect   = document.getElementById('emp-dept-id');    // 부서 선택 드롭다운
const empFormTitle      = document.getElementById('emp-form-title');
const empSubmitBtn      = document.getElementById('emp-submit-btn');
const empCancelBtn      = document.getElementById('emp-cancel-btn');

// 단건 조회 영역 (ID 조회 + 이메일 조회 2가지)
const searchEmpIdInput    = document.getElementById('search-emp-id');
const searchEmpEmailInput = document.getElementById('search-emp-email');
const empDetailResult     = document.getElementById('emp-detail-result');

// 조회 버튼 (querySelector: index.html 구조 기반 선택)
const searchEmpIdBtn    = document.querySelector(
    '#emp-section .card:nth-child(2) .form-inline:nth-child(2) .btn-success'
);
const searchEmpEmailBtn = document.querySelector(
    '#emp-section .card:nth-child(2) .form-inline:nth-child(3) .btn-success'
);

// 직원 목록 영역
const empListBody    = document.getElementById('emp-list');          // <tbody>
const empLoading     = document.getElementById('emp-loading');       // 로딩 인디케이터
const empRefreshBtn  = document.querySelector('#emp-section .list-header .btn-info');
const empWithDeptBtn = document.querySelector('#emp-section .list-header .btn-secondary');

// 테이블 헤더 (withDept 모드 전환 시 5번째 컬럼 변경용)
const empTableHeader = document.querySelector('#emp-section table thead');
```

---

## 6. 렌더링 함수 상세

### 6-1. renderEmployeeList(employees, withDept) — 핵심 함수

직원 목록을 테이블에 렌더링합니다. `withDept` 파라미터로 **두 가지 표시 모드**를 지원합니다.

```
withDept = false (기본)          withDept = true (직원+부서 조회)
─────────────────────────        ────────────────────────────────
ID | 이름 | 성 | 이메일 | 부서ID  ID | 이름 | 성 | 이메일 | 부서명
─────────────────────────        ────────────────────────────────
1  | John | Smith | ... | 1      1  | John | Smith | ... | HR
```

```javascript
const renderEmployeeList = (employees, withDept = false) => {
    if (!employees || employees.length === 0) {
        empListBody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;">표시할 직원이 없습니다.</td></tr>';
        return;
    }

    // withDept 여부에 따라 5번째 헤더 컬럼을 동적으로 변경합니다.
    // [Template Literal + Ternary] 조건에 맞는 헤더를 한 번에 생성합니다.
    empTableHeader.innerHTML = `
        <tr>
            <th>ID</th><th>이름</th><th>성</th><th>이메일</th>
            <th>${withDept ? '부서명' : '부서 ID'}</th>
            <th>작업</th>
        </tr>
    `;

    const rows = employees.map((emp) => {
        // [Optional Chaining ?.] emp.departmentDto가 null이면 .departmentName 접근을 건너뜁니다.
        // [Nullish Coalescing ??] 결과가 null/undefined이면 'N/A'를 기본값으로 사용합니다.
        //
        // v1.0 방식: emp.departmentDto?.departmentName || 'N/A'
        //   → || 는 '' (빈 문자열), 0, false 도 'N/A'로 대체하는 문제가 있음
        //
        // v2.0 방식: emp.departmentDto?.departmentName ?? 'N/A'
        //   → ?? 는 오직 null과 undefined만 'N/A'로 대체 (더 정확한 처리)
        const deptDisplay = withDept
            ? escapeHTML(emp.departmentDto?.departmentName ?? 'N/A')
            : (emp.departmentId ?? 'N/A');

        return `
            <tr>
                <td>${emp.id}</td>
                <td>${escapeHTML(emp.firstName)}</td>
                <td>${escapeHTML(emp.lastName)}</td>
                <td>${escapeHTML(emp.email)}</td>
                <td>${deptDisplay}</td>
                <td class="actions">
                    <button class="btn btn-warning btn-sm"
                            data-id="${emp.id}"
                            data-action="edit"
                            data-employee='${JSON.stringify(emp)}'>수정</button>
                    <button class="btn btn-danger btn-sm"
                            data-id="${emp.id}"
                            data-action="delete">삭제</button>
                </td>
            </tr>
        `;
    });

    empListBody.innerHTML = rows.join('');
};
```

**`||` vs `??` 비교:**

| 상황 | `value \|\| 'N/A'` | `value ?? 'N/A'` |
|------|-------------------|-----------------|
| `value = null` | `'N/A'` ✅ | `'N/A'` ✅ |
| `value = undefined` | `'N/A'` ✅ | `'N/A'` ✅ |
| `value = ''` (빈 문자열) | `'N/A'` ❌ (의도치 않은 대체) | `''` ✅ |
| `value = 0` | `'N/A'` ❌ (의도치 않은 대체) | `0` ✅ |
| `value = 'HR'` | `'HR'` ✅ | `'HR'` ✅ |

→ 부서명이 없는 경우만 `'N/A'`로 대체하려면 `??`이 더 정확합니다.

**v1.0 대비 변경점:**

| 항목 | v1.0 (employee.js) | v2.0 (emp_runner_v1.js) |
|------|-------------------|------------------------|
| 렌더링 방식 | `forEach` + `createElement` + `appendChild` | `map().join('')` + `innerHTML` 1회 |
| 헤더 동적 변경 | if/else로 두 번 작성 | Template Literal `? :` 로 1줄 처리 |
| null 안전 처리 | `emp.departmentDto?.departmentName \|\| 'N/A'` | `?.` + `??` 조합으로 더 정확하게 처리 |

---

### 6-2. renderEmployeeDetail(employee) — 단건 조회 결과 표시

```javascript
const renderEmployeeDetail = (employee) => {
    if (!employee) {
        empDetailResult.style.display = 'none';
        return;
    }

    // departmentDto 유무에 따라 부서 정보를 다르게 표시합니다.
    // [Optional Chaining + Nullish Coalescing]
    const deptDisplay = employee.departmentDto
        ? escapeHTML(employee.departmentDto.departmentName)  // 부서명 표시
        : (employee.departmentId ?? '정보 없음');            // 부서 ID 표시

    empDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${employee.id}</p>
        <p><strong>이름:</strong> ${escapeHTML(employee.firstName)} ${escapeHTML(employee.lastName)}</p>
        <p><strong>이메일:</strong> ${escapeHTML(employee.email)}</p>
        <p><strong>부서:</strong> ${deptDisplay}</p>
    `;
    empDetailResult.style.display = 'block';
};
```

---

### 6-3. populateDeptDropdown(departments) — 부서 드롭다운 채우기

직원 등록/수정 폼의 `<select id="emp-dept-id">`를 부서 목록으로 채웁니다.

```javascript
const populateDeptDropdown = (departments) => {
    empDeptIdSelect.innerHTML = '<option value="">부서를 선택하세요...</option>';

    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        empDeptIdSelect.appendChild(option);
    });
};
```

**호출 흐름:**

```
initEmployeeTab() 실행
    │
    ├── const departments = await getAllDepartments()   ← departmentApi.js 재사용
    └── populateDeptDropdown(departments)               ← 드롭다운에 부서 목록 삽입
```

---

## 7. 폼 관련 함수 상세

### 7-1. resetEmpForm() — 생성 모드로 초기화

```javascript
const resetEmpForm = () => {
    empForm.reset();                        // 모든 입력값 초기화
    empIdInput.value           = '';        // hidden ID 초기화
    empFormTitle.textContent   = '직원 등록';
    empSubmitBtn.textContent   = '직원 생성';
    empCancelBtn.style.display = 'none';    // 취소 버튼 숨김
};
```

**호출 시점:** 취소 버튼 클릭, 생성/수정 성공 후

---

### 7-2. setupEmpEditForm(employee) — 수정 모드로 전환

```javascript
const setupEmpEditForm = (employee) => {
    // [Destructuring] 객체에서 필요한 값만 골라 변수에 할당합니다.
    // v1.0: employee.firstName, employee.lastName ... 처럼 각각 접근
    // v2.0: 한 줄로 필요한 값을 모두 꺼냅니다.
    const { id, firstName, lastName, email, departmentId } = employee;

    empIdInput.value        = id;
    empFirstNameInput.value = firstName;
    empLastNameInput.value  = lastName;
    empEmailInput.value     = email;
    empDeptIdSelect.value   = departmentId;  // 드롭다운의 해당 부서를 선택 상태로 만듭니다.

    empFormTitle.textContent   = '직원 수정';
    empSubmitBtn.textContent   = '수정 저장';
    empCancelBtn.style.display = 'inline-block';

    // 폼이 보이도록 부드럽게 스크롤합니다.
    empForm.scrollIntoView({ behavior: 'smooth' });
};
```

**Destructuring 비교:**

```javascript
// v1.0 방식: 객체 프로퍼티를 하나씩 접근
empIdInput.value        = employee.id;
empFirstNameInput.value = employee.firstName;
empLastNameInput.value  = employee.lastName;
empEmailInput.value     = employee.email;
empDeptIdSelect.value   = employee.departmentId;

// v2.0 방식: Destructuring으로 한 번에 꺼낸 뒤 변수로 사용
const { id, firstName, lastName, email, departmentId } = employee;
empIdInput.value        = id;
empFirstNameInput.value = firstName;
// ... (더 깔끔하고 employee. 반복이 없음)
```

---

## 8. 이벤트 핸들러 상세

### 8-1. handleEmpFormSubmit(e) — 생성/수정 분기 처리

폼의 hidden `emp-id`에 값이 있으면 **수정**, 없으면 **생성**으로 동작합니다.

```
[사용자 동작]
  폼 입력 → 제출 버튼 클릭
      │
      ▼
  handleEmpFormSubmit()
      │
      ├── 유효성 검사 (빈 값 체크)
      │       └── 실패 → showMessage('모든 필드를 입력해주세요.', true)
      │
      ├── empIdInput.value 가 있으면? → updateEmployee(id, data)  [PUT]
      │                                  └── 성공: 메시지 + 폼 초기화 + 목록 갱신
      │
      └── empIdInput.value 가 없으면? → createEmployee(data)      [POST]
                                         └── 성공: 메시지 + 폼 초기화 + 목록 갱신
```

```javascript
const handleEmpFormSubmit = async (e) => {
    e.preventDefault();

    const id           = empIdInput.value;
    const firstName    = empFirstNameInput.value.trim();
    const lastName     = empLastNameInput.value.trim();
    const email        = empEmailInput.value.trim();
    const departmentId = empDeptIdSelect.value;

    if (!firstName || !lastName || !email || !departmentId) {
        showMessage('모든 필드를 입력해주세요.', true);
        return;
    }

    // [Shorthand Property] { firstName: firstName, ... } 의 축약형
    const employeeData = { firstName, lastName, email, departmentId };

    if (id) {
        const result = await updateEmployee(id, employeeData);   // PUT
        if (result) {
            showMessage('직원 정보가 성공적으로 수정되었습니다.');
            resetEmpForm();
            await loadAndRenderEmployees();
        }
    } else {
        const result = await createEmployee(employeeData);       // POST
        if (result) {
            showMessage('직원이 성공적으로 생성되었습니다.');
            resetEmpForm();
            await loadAndRenderEmployees();
        }
    }
};
```

---

### 8-2. handleSearchEmpById() / handleSearchEmpByEmail() — 단건 조회

직원은 **ID 조회**와 **이메일 조회** 두 가지 방법을 지원합니다.

```
[ID 조회 흐름]                         [이메일 조회 흐름]
  ID 입력 → "ID로 조회" 클릭               이메일 입력 → "이메일로 조회" 클릭
      │                                        │
      ▼                                        ▼
  handleSearchEmpById()               handleSearchEmpByEmail()
      ├── 빈 값 → 오류 메시지                 ├── 빈 값 → 오류 메시지
      └── getEmployeeById(id)               └── getEmployeeByEmail(email)
              ├── null → 없음 메시지                  ├── null → 없음 메시지
              └── 데이터 → renderEmployeeDetail()     └── 데이터 → renderEmployeeDetail()
```

```javascript
// ID 조회
const handleSearchEmpById = async () => {
    const id = searchEmpIdInput.value;
    if (!id) { showMessage('조회할 직원 ID를 입력해주세요.', true); return; }

    const employee = await getEmployeeById(id);
    if (!employee) { showMessage('해당 ID의 직원이 존재하지 않습니다.', true); return; }
    renderEmployeeDetail(employee);
};

// 이메일 조회 — '@' 기호를 그대로 URL에 포함 (인코딩 불필요)
const handleSearchEmpByEmail = async () => {
    const email = searchEmpEmailInput.value.trim();
    if (!email) { showMessage('조회할 직원 이메일을 입력해주세요.', true); return; }

    const employee = await getEmployeeByEmail(email);
    if (!employee) { showMessage('해당 이메일의 직원이 존재하지 않습니다.', true); return; }
    renderEmployeeDetail(employee);
};
```

---

### 8-3. handleEmpListClick(e) — 이벤트 위임 방식

테이블의 수정/삭제 버튼을 처리합니다.
**이벤트 위임(Event Delegation)** 방식으로 `<tbody>` 하나에만 이벤트를 등록합니다.

```javascript
const handleEmpListClick = async (e) => {
    // [Destructuring] dataset에서 action, id를 한 번에 추출합니다.
    const { action, id } = e.target.dataset;

    if (!action || !id) return;

    if (action === 'edit') {
        // data-employee에 저장된 JSON 문자열을 파싱해서 수정 폼에 채웁니다.
        const employee = JSON.parse(e.target.dataset.employee);
        setupEmpEditForm(employee);

    } else if (action === 'delete') {
        // [Template Literal] 삭제 확인 메시지에 id를 삽입합니다.
        if (confirm(`정말로 ID ${id} 직원을 삭제하시겠습니까?`)) {
            const ok = await deleteEmployee(id);
            if (ok) {
                showMessage('직원이 삭제되었습니다.');
                await loadAndRenderEmployees();
            }
        }
    }
};
```

**이벤트 위임이란?**

```
[v1.0 방식] 렌더링할 때마다 각 버튼에 이벤트 등록
  직원 10명이면 수정버튼 10개 + 삭제버튼 10개 = 이벤트 20개 등록

[v2.0 방식] 이벤트 위임 — <tbody> 하나에만 등록
  <tbody> → addEventListener('click', handleEmpListClick)
      └── 클릭 이벤트가 버블링으로 tbody까지 올라옴
          └── e.target.dataset.action 으로 어떤 버튼인지 구분
  직원 100명이 되어도 이벤트는 항상 1개
```

---

## 9. 직원 탭 초기화 (initEmployeeTab)

### 9-1. 초기화가 필요한 이유

부서 탭(`dept_runner_v1.js`)은 페이지 로드 시 바로 초기화됩니다.
하지만 직원 탭은 **탭 버튼을 처음 클릭할 때** 초기화됩니다. 이유:

- 직원 폼의 부서 드롭다운을 채우려면 서버에서 부서 목록을 가져와야 합니다.
- 페이지 로드 시 직원 탭은 숨겨져 있으므로, 클릭 시점에 필요한 데이터만 로드합니다.

### 9-2. 중복 초기화 방지

사용자가 탭을 여러 번 클릭해도 이벤트 리스너가 중복 등록되지 않도록 플래그를 사용합니다.

```javascript
// [let] 변경이 있으므로 let으로 선언합니다. (const로 하면 재할당 불가)
let isInitialized = false;

const initEmployeeTab = async () => {
    if (isInitialized) return;  // 이미 초기화된 경우 즉시 종료

    // 1) 부서 드롭다운 채우기
    const departments = await getAllDepartments();   // departmentApi.js 재사용
    populateDeptDropdown(departments);

    // 2) 직원 목록 첫 로드
    await loadAndRenderEmployees();

    // 3) 이벤트 리스너 7개 등록
    empForm.addEventListener('submit', handleEmpFormSubmit);
    empCancelBtn.addEventListener('click', resetEmpForm);
    searchEmpIdBtn.addEventListener('click', handleSearchEmpById);
    searchEmpEmailBtn.addEventListener('click', handleSearchEmpByEmail);
    empListBody.addEventListener('click', handleEmpListClick);
    empRefreshBtn.addEventListener('click', loadAndRenderEmployees);
    empWithDeptBtn.addEventListener('click', loadAndRenderEmployeesWithDept);

    // 4) 초기화 완료 플래그
    isInitialized = true;
};
```

**v1.0 대비 변경점:**

| 항목 | v1.0 (employee.js) | v2.0 (emp_runner_v1.js) |
|------|-------------------|------------------------|
| 중복 방지 방법 | `initEmployeeTab.initialized` (함수 프로퍼티) | `let isInitialized` (클로저 변수) |
| 스타일 | 함수 객체에 프로퍼티 추가 (비직관적) | 일반 변수 사용 (더 명확) |

---

## 10. 전역 등록 — window.initEmployeeTab

### 문제 상황

```
index.html의 showTab() 함수 (일반 스크립트, 전역)
    └── initEmployeeTab()  ← 전역 함수를 호출!

emp_runner_v1.js (ES Module, 모듈 스코프)
    └── const initEmployeeTab = async () => {}  ← 전역에서 보이지 않음!
```

ES Module 내부의 변수/함수는 **모듈 스코프**를 가지므로 전역(`window`)에서 접근할 수 없습니다.

### 해결 방법

```javascript
// emp_runner_v1.js 하단에 한 줄 추가
window.initEmployeeTab = initEmployeeTab;
```

```
showTab('emp-section') 호출
    └── if (typeof initEmployeeTab === 'function') initEmployeeTab()
                                                          ↑
                                                 window.initEmployeeTab 으로
                                                 모듈 함수에 접근 가능!
```

### 이 방법의 한계와 개선 방향

```
현재 방법 (window 전역 등록)
  장점: index.html을 최소한으로 수정
  단점: 전역 네임스페이스 오염, 모듈의 장점 일부 훼손

이상적인 방법 (main.js 패턴 - P2 이후 구현 예정)
  main.js에서 addEventListener로 탭 버튼 이벤트를 직접 등록
  → window 전역 등록 불필요
  → index.html의 onclick="showTab(...)" 인라인 이벤트도 제거 가능
```

---

## 11. 사용된 ES 문법 정리

| ES 문법 | 사용 위치 | v1.0 대비 변경 |
|---------|-----------|--------------|
| `import` | 파일 상단 (3개 모듈) | 전역 의존 → 명시적 import |
| `const` | 모든 변수/함수 선언 | `var` 완전 제거 |
| `let` | `isInitialized` 플래그 | 변경이 필요한 변수만 let |
| Arrow Function `() => {}` | 모든 함수 선언, 콜백 | `function` 키워드 대체 |
| `async/await` | API 호출 함수 | 동일 (v1.0과 같음) |
| Template Literal `` `${}` `` | HTML 생성, 메시지, 헤더 조건부 | 문자열 `+` 연결 대체 |
| `?.` Optional Chaining | `emp.departmentDto?.departmentName` | null 체크 조건문 대체 |
| `??` Nullish Coalescing | `?? 'N/A'`, `?? '정보 없음'` | `\|\|` 연산자보다 정확한 null 처리 |
| `Array.map()` | `renderEmployeeList` | `forEach + createElement` 대체 |
| `Array.forEach()` | `populateDeptDropdown` | 동일 패턴 유지 |
| `Array.join('')` | `renderEmployeeList` | map 결과를 하나의 문자열로 합치기 |
| Destructuring `{ }` | `setupEmpEditForm`, `handleEmpListClick` | 프로퍼티 개별 접근 대체 |
| Shorthand Property | `handleEmpFormSubmit` | `{ a: a }` → `{ a }` 축약 |
| Ternary Operator `? :` | `renderEmployeeList` 헤더, `showEmpLoading` | `if/else` 대체 |
| Default Parameter | `renderEmployeeList(employees, withDept = false)` | 파라미터 생략 시 기본값 |

---

## 12. index.html 연결 방법

### 변경 전 (v1.0)

```html
<script src="employee.js"></script>   <!-- 일반 스크립트 -->
```

### 변경 후 (v2.0)

```html
<!-- type="module" 필수: import/export 사용을 위해 반드시 명시 -->
<script type="module" src="js/emp_runner_v1.js"></script>
```

**전체 스크립트 로딩 구조:**

```html
<!-- 1. 일반 스크립트: 탭 전환 로직 (전역 함수 showTab 유지) -->
<script>
    function showTab(sectionId) {
        // ...
        if (sectionId === 'emp-section') {
            if (typeof initEmployeeTab === 'function') initEmployeeTab();
            //  ↑ window.initEmployeeTab 으로 등록된 함수를 호출
        }
    }
</script>

<!-- 2. ES Module: 부서 관리 -->
<script type="module" src="js/dept_runner_v1.js"></script>

<!-- 3. ES Module: 직원 관리 (window.initEmployeeTab 전역 등록 포함) -->
<script type="module" src="js/emp_runner_v1.js"></script>
```

---

## 13. 실행 방법 및 주의사항

### 실행 방법

```bash
# VS Code Live Server (추천)
# 하단 상태바 "Go Live" 클릭 → http://localhost:5500

# 또는 터미널에서
npx serve .
# → http://localhost:3000
```

### 주의사항

1. **`file://` 직접 실행 불가** — ES Module은 CORS 정책으로 반드시 HTTP 서버에서 실행해야 합니다.
2. **import 경로에 `.js` 확장자 필수** — `'./api/employeeApi'` (X) → `'./api/employeeApi.js'` (O)
3. **백엔드 서버 실행 필요** — `http://localhost:8080`에 Spring Boot가 실행 중이어야 합니다.
4. **직원 탭은 클릭 시 초기화** — 페이지 로드 직후에는 부서 드롭다운이 비어있으며, 탭 클릭 시 채워집니다.
5. **이메일 `@` 기호** — URL에 그대로 포함해서 전송합니다. (`encodeURIComponent` 불필요)

---

## 14. 파일 위치

```
project/
├── index.html                           ← <script type="module" src="js/emp_runner_v1.js">
├── style.css
├── employee.js                          ← v1.0 (참고용, 더 이상 로드되지 않음)
└── js/
    ├── dept_runner_v1.js                ← 부서 관리 UI 연결
    ├── dept_runner_v1.md
    ├── emp_runner_v1.js                 ← 이 파일 (직원 관리 UI 연결)
    ├── emp_runner_v1.md                 ← 이 문서
    ├── utils.js                         ← escapeHTML, showMessage 제공
    └── api/
        ├── departmentApi.js             ← 부서 API (getAllDepartments 제공)
        ├── departmentApi.md
        ├── employeeApi.js               ← 직원 API 7개 함수 제공
        └── employeeApi.md
```
