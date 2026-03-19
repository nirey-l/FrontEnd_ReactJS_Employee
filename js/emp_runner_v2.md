# js/emp_runner_v2.js 정리 문서

## 1. 핵심 요약 — v1과 달라진 것은 딱 2곳

```
emp_runner_v1.js                   emp_runner_v2.js
──────────────────────────────     ──────────────────────────────────────
import {                           import { EmployeeApi }
  getAllEmployees,                    from './api/employeeApi.js';
  getAllEmployeesWithDepartments,   import { DepartmentApi }
  getEmployeeById,                   from './api/departmentApi.js';
  getEmployeeByEmail,
  createEmployee,                  const employeeApi   = new EmployeeApi();
  updateEmployee,                  const departmentApi = new DepartmentApi();
  deleteEmployee,
} from './api/employeeApi.js';
import { getAllDepartments }
  from './api/departmentApi.js';

await getAllEmployees()            await employeeApi.getAll()
await getAllEmployeesWithDepartments() await employeeApi.getAllWithDepartments()
await getEmployeeById(id)          await employeeApi.getById(id)
await getEmployeeByEmail(email)    await employeeApi.getByEmail(email)
await createEmployee(data)         await employeeApi.create(data)
await updateEmployee(id, data)     await employeeApi.update(id, data)
await deleteEmployee(id)           await employeeApi.delete(id)
await getAllDepartments()          await departmentApi.getAll()
```

**나머지 렌더링·이벤트 코드는 v1과 완전히 동일합니다.**

---

## 2. 파일 개요

| 항목 | 내용 |
|------|------|
| 파일명 | `js/emp_runner_v2.js` |
| 역할 | 직원 관리 UI 연결 파일 (렌더링 + 이벤트 처리) |
| 사용 API | `employeeApi.js` **버전 2 (클래스형)** + `departmentApi.js` **버전 2 (클래스형)** |
| index.html 연결 | `<script type="module" src="js/emp_runner_v2.js">` |
| 비교 파일 | `emp_runner_v1.js` (함수형 — 구조 동일, 호출 방식만 다름) |

---

## 3. 모듈 의존 관계

```
index.html
  └─ <script type="module" src="js/emp_runner_v2.js">
        │
        ├─ import { EmployeeApi }      ←  js/api/employeeApi.js (클래스)
        │       └─ new EmployeeApi()  ←  인스턴스 생성
        │
        ├─ import { DepartmentApi }    ←  js/api/departmentApi.js (클래스)
        │       └─ new DepartmentApi() ← 인스턴스 생성 (부서 드롭다운용)
        │
        └─ import { escapeHTML, showMessage }  ←  js/utils.js
```

---

## 4. v1 vs v2 변경점 상세

### 4-1. import 방식

```javascript
// ── v1: 함수 8개를 각각 named import ──────────────────────────
import {
    getAllEmployees,
    getAllEmployeesWithDepartments,
    getEmployeeById,
    getEmployeeByEmail,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from './api/employeeApi.js';
import { getAllDepartments } from './api/departmentApi.js';

// ── v2: 클래스 2개만 import ───────────────────────────────────
import { EmployeeApi }   from './api/employeeApi.js';
import { DepartmentApi } from './api/departmentApi.js';
// 각 클래스 안에 메서드가 모두 포함되어 있으므로 두 줄로 충분합니다.
```

### 4-2. 인스턴스 생성 (v2에만 있음)

```javascript
// 직원 관련 모든 API 통신 객체
const employeeApi   = new EmployeeApi();

// 부서 드롭다운을 채우기 위한 API 통신 객체
const departmentApi = new DepartmentApi();

// 이 두 줄이 v1의 import { ... } 8개를 대체합니다.
```

### 4-3. API 호출 방식

| 기능 | v1 (함수 직접 호출) | v2 (인스턴스 메서드 호출) |
|------|-------------------|--------------------------|
| 전체 조회 | `await getAllEmployees()` | `await employeeApi.getAll()` |
| 직원+부서 조회 | `await getAllEmployeesWithDepartments()` | `await employeeApi.getAllWithDepartments()` |
| ID 조회 | `await getEmployeeById(id)` | `await employeeApi.getById(id)` |
| 이메일 조회 | `await getEmployeeByEmail(email)` | `await employeeApi.getByEmail(email)` |
| 생성 | `await createEmployee(data)` | `await employeeApi.create(data)` |
| 수정 | `await updateEmployee(id, data)` | `await employeeApi.update(id, data)` |
| 삭제 | `await deleteEmployee(id)` | `await employeeApi.delete(id)` |
| 부서 드롭다운 | `await getAllDepartments()` | `await departmentApi.getAll()` |

### 4-4. 코드에서 변경된 위치 (★ 표시)

```javascript
// loadAndRenderEmployees()
// ★ v1: const employees = await getAllEmployees();
// ★ v2:
const employees = await employeeApi.getAll();

// loadAndRenderEmployeesWithDept()
// ★ v1: const employees = await getAllEmployeesWithDepartments();
// ★ v2:
const employees = await employeeApi.getAllWithDepartments();

// initEmployeeTab() — 부서 드롭다운
// ★ v1: const departments = await getAllDepartments();
// ★ v2:
const departments = await departmentApi.getAll();

// handleEmpFormSubmit() — 수정 분기
// ★ v1: const result = await updateEmployee(id, employeeData);
// ★ v2:
const result = await employeeApi.update(id, employeeData);

// handleEmpFormSubmit() — 생성 분기
// ★ v1: const result = await createEmployee(employeeData);
// ★ v2:
const result = await employeeApi.create(employeeData);

// handleSearchEmpById()
// ★ v1: const employee = await getEmployeeById(id);
// ★ v2:
const employee = await employeeApi.getById(id);

// handleSearchEmpByEmail()
// ★ v1: const employee = await getEmployeeByEmail(email);
// ★ v2:
const employee = await employeeApi.getByEmail(email);

// handleEmpListClick() — 삭제 분기
// ★ v1: const ok = await deleteEmployee(id);
// ★ v2:
const ok = await employeeApi.delete(id);
```

---

## 5. 클래스 인스턴스란?

```
클래스(Class) = 설계도
인스턴스(Instance) = 설계도로 만든 실제 물건

EmployeeApi (클래스)
├── #baseUrl = 'http://localhost:8080/api/employees'  ← 설계도에 정의
├── getAll()                ← 메서드 정의
├── getAllWithDepartments()
├── getById(id)
├── getByEmail(email)
├── create(employeeData)
├── update(id, employeeData)
└── delete(id)

const employeeApi = new EmployeeApi()  ← 인스턴스 생성
employeeApi.getAll()                   ← 실제 메서드 호출
employeeApi.getByEmail('a@b.com')

DepartmentApi (클래스)
└── ...

const departmentApi = new DepartmentApi()  ← 부서 드롭다운 전용
departmentApi.getAll()                     ← 부서 목록 가져오기
```

**왜 클래스/인스턴스를 사용하나요?**

```
v1 (함수형) 단점:
  - getAllEmployees() 라는 이름만 봐서는 "어디 소속 함수인지" 바로 알기 어려움
  - 함수 8개가 각각 독립적으로 존재

v2 (클래스형) 장점:
  - employeeApi.getAll() → "employeeApi 객체의 getAll" 이므로 소속이 명확
  - #baseUrl이 클래스 내부에 캡슐화되어 외부 접근/변경 불가
  - 관련 기능이 하나의 객체로 묶여 관리가 쉬움
  - React, Vue 등 다음 단계 프레임워크에서도 동일한 패턴 사용
```

---

## 6. 변경되지 않은 부분

아래 코드는 v1과 v2가 **완전히 동일**합니다.

| 항목 | 동일 여부 |
|------|----------|
| DOM 요소 캐싱 | ✅ 동일 |
| `renderEmployeeList()` | ✅ 동일 |
| `renderEmployeeDetail()` | ✅ 동일 |
| `populateDeptDropdown()` | ✅ 동일 |
| `showEmpLoading()` | ✅ 동일 |
| `resetEmpForm()` | ✅ 동일 |
| `setupEmpEditForm()` — Destructuring | ✅ 동일 |
| `let isInitialized = false` 플래그 | ✅ 동일 |
| `window.initEmployeeTab` 전역 등록 | ✅ 동일 |

---

## 7. window.initEmployeeTab 전역 등록

```javascript
// ES Module의 함수는 모듈 스코프에 갇혀 있습니다.
// index.html의 showTab() (일반 스크립트)에서 호출하려면
// window 객체에 명시적으로 등록해야 합니다.
window.initEmployeeTab = initEmployeeTab;

// index.html showTab() 함수:
// if (typeof initEmployeeTab === 'function') initEmployeeTab();
//   ↑ 이 호출이 window.initEmployeeTab() 을 실행합니다.
```

---

## 8. isInitialized 중복 실행 방지

```javascript
let isInitialized = false;

const initEmployeeTab = async () => {
    if (isInitialized) return;  // ← 이미 실행됐으면 즉시 종료

    // 부서 드롭다운 채우기
    const departments = await departmentApi.getAll();  // ★ v2
    populateDeptDropdown(departments);

    // 직원 목록 첫 로드
    await loadAndRenderEmployees();

    // 이벤트 리스너 7개 등록 (중복 등록 방지)
    empForm.addEventListener('submit', handleEmpFormSubmit);
    // ... 나머지 6개

    isInitialized = true;  // ← 한 번 실행 후 true로 설정
};
```

**왜 필요한가요?**

```
직원 탭을 여러 번 클릭해도 initEmployeeTab()은 처음 한 번만 실행됩니다.
이벤트 리스너가 중복 등록되어 이벤트가 여러 번 발생하는 문제를 방지합니다.
```

---

## 9. 사용된 ES 문법 (v1과 동일)

| ES 문법 | 사용 위치 |
|---------|-----------|
| `import` / `export` | 파일 상단 |
| `class` + `new` | EmployeeApi, DepartmentApi 인스턴스 생성 |
| `const` / `let` | 모든 변수/함수/인스턴스 선언, isInitialized |
| Arrow Function | 모든 함수 |
| `async/await` | API 호출 함수 |
| Template Literal | HTML 생성, 메시지 |
| `Array.map().join('')` | 렌더링 함수 |
| Destructuring | `setupEmpEditForm`, `handleEmpListClick` |
| Shorthand Property | `handleEmpFormSubmit` |
| Optional Chaining `?.` | `emp.departmentDto?.departmentName` |
| Nullish Coalescing `??` | `?? 'N/A'`, `?? '정보 없음'` |
| Default Parameter | `renderEmployeeList(employees, withDept = false)` |
| Ternary Operator | `showEmpLoading`, `withDept ? '부서명' : '부서 ID'` |

---

## 10. index.html 연결

```html
<!-- v1 주석 처리 -->
<!-- <script type="module" src="js/emp_runner_v1.js"></script> -->

<!-- v2 활성화 -->
<script type="module" src="js/emp_runner_v2.js"></script>
```

---

## 11. 파일 위치

```
project/
└── js/
    ├── emp_runner_v1.js    ← 버전 1 (함수형) — 학습 참고용
    ├── emp_runner_v1.md
    ├── emp_runner_v2.js    ← 이 파일 (클래스형) — 실제 사용
    ├── emp_runner_v2.md    ← 이 문서
    └── api/
        ├── employeeApi.js   ← EmployeeApi 클래스 (버전 2) 제공
        └── departmentApi.js ← DepartmentApi 클래스 (버전 2) 제공
```
