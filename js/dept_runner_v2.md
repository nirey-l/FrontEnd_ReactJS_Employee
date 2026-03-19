# js/dept_runner_v2.js 정리 문서

## 1. 핵심 요약 — v1과 달라진 것은 딱 2곳

```
dept_runner_v1.js              dept_runner_v2.js
──────────────────────         ──────────────────────────────────
import {                       import { DepartmentApi }
  getAllDepartments,              from './api/departmentApi.js';
  getDepartmentById,
  createDepartment,            const departmentApi = new DepartmentApi();
  updateDepartment,
  deleteDepartment,
} from './api/departmentApi.js';

await getAllDepartments()      await departmentApi.getAll()
await getDepartmentById(id)    await departmentApi.getById(id)
await createDepartment(data)   await departmentApi.create(data)
await updateDepartment(id,data)await departmentApi.update(id, data)
await deleteDepartment(id)     await departmentApi.delete(id)
```

**나머지 렌더링·이벤트 코드는 v1과 완전히 동일합니다.**

---

## 2. 파일 개요

| 항목 | 내용 |
|------|------|
| 파일명 | `js/dept_runner_v2.js` |
| 역할 | 부서 관리 UI 연결 파일 (렌더링 + 이벤트 처리) |
| 사용 API | `departmentApi.js` **버전 2 (클래스형)** |
| index.html 연결 | `<script type="module" src="js/dept_runner_v2.js">` |
| 비교 파일 | `dept_runner_v1.js` (함수형 — 구조 동일, 호출 방식만 다름) |

---

## 3. 모듈 의존 관계

```
index.html
  └─ <script type="module" src="js/dept_runner_v2.js">
        │
        ├─ import { DepartmentApi }      ←  js/api/departmentApi.js (클래스)
        │       └─ new DepartmentApi()  ←  인스턴스 생성
        │
        └─ import { escapeHTML, showMessage }  ←  js/utils.js
```

---

## 4. v1 vs v2 변경점 상세

### 4-1. import 방식

```javascript
// ── v1: 함수 5개를 각각 named import ──────────────────────────
import {
    getAllDepartments,    // GET    /api/departments
    getDepartmentById,   // GET    /api/departments/{id}
    createDepartment,    // POST   /api/departments
    updateDepartment,    // PUT    /api/departments/{id}
    deleteDepartment,    // DELETE /api/departments/{id}
} from './api/departmentApi.js';

// ── v2: 클래스 1개만 import ───────────────────────────────────
import { DepartmentApi } from './api/departmentApi.js';
// 5개 메서드가 클래스 안에 모두 포함되어 있으므로 한 줄로 충분합니다.
```

### 4-2. 인스턴스 생성 (v2에만 있음)

```javascript
// 클래스(설계도)로부터 실제 사용할 객체(인스턴스)를 만듭니다.
const departmentApi = new DepartmentApi();

// departmentApi 는 이 파일 전체에서 공유되는 하나의 API 통신 객체입니다.
// 이 한 줄이 v1의 import { ... } 5개를 대체합니다.
```

### 4-3. API 호출 방식

| 기능 | v1 (함수 직접 호출) | v2 (인스턴스 메서드 호출) |
|------|-------------------|------------------------|
| 전체 조회 | `await getAllDepartments()` | `await departmentApi.getAll()` |
| 단건 조회 | `await getDepartmentById(id)` | `await departmentApi.getById(id)` |
| 생성 | `await createDepartment(data)` | `await departmentApi.create(data)` |
| 수정 | `await updateDepartment(id, data)` | `await departmentApi.update(id, data)` |
| 삭제 | `await deleteDepartment(id)` | `await departmentApi.delete(id)` |

### 4-4. 코드에서 변경된 위치 (★ 표시)

```javascript
// loadAndRenderDepartments()
// ★ v1: const departments = await getAllDepartments();
// ★ v2:
const departments = await departmentApi.getAll();

// handleFormSubmit() — 수정 분기
// ★ v1: const result = await updateDepartment(id, departmentData);
// ★ v2:
const result = await departmentApi.update(id, departmentData);

// handleFormSubmit() — 생성 분기
// ★ v1: const result = await createDepartment(departmentData);
// ★ v2:
const result = await departmentApi.create(departmentData);

// handleSearchById()
// ★ v1: const department = await getDepartmentById(id);
// ★ v2:
const department = await departmentApi.getById(id);

// handleListClick() — 삭제 분기
// ★ v1: const ok = await deleteDepartment(id);
// ★ v2:
const ok = await departmentApi.delete(id);
```

---

## 5. 클래스 인스턴스란?

```
클래스(Class) = 설계도
인스턴스(Instance) = 설계도로 만든 실제 물건

DepartmentApi (클래스)
├── #baseUrl = 'http://localhost:8080/api/departments'  ← 설계도에 정의
├── getAll()    ← 메서드 정의
├── getById()
├── create()
├── update()
└── delete()

const departmentApi = new DepartmentApi()  ← 인스턴스 생성
departmentApi.getAll()     ← 실제 메서드 호출
departmentApi.getById(1)
```

**왜 클래스/인스턴스를 사용하나요?**

```
v1 (함수형) 단점:
  - getAllDepartments() 라는 이름만 봐서는 "어디 소속 함수인지" 바로 알기 어려움
  - 함수 5개가 각각 독립적으로 존재

v2 (클래스형) 장점:
  - departmentApi.getAll() → "departmentApi 객체의 getAll" 이므로 소속이 명확
  - #baseUrl이 클래스 내부에 캡슐화되어 외부 접근/변경 불가
  - 관련 기능 5개가 하나의 객체로 묶여 관리가 쉬움
  - React, Vue 등 다음 단계 프레임워크에서도 동일한 패턴 사용
```

---

## 6. 변경되지 않은 부분

아래 코드는 v1과 v2가 **완전히 동일**합니다.

| 항목 | 동일 여부 |
|------|----------|
| DOM 요소 캐싱 | ✅ 동일 |
| `renderDepartmentList()` | ✅ 동일 |
| `renderDepartmentDetail()` | ✅ 동일 |
| `populateSearchDropdown()` | ✅ 동일 |
| `showLoading()` | ✅ 동일 |
| `resetDeptForm()` | ✅ 동일 |
| `setupEditForm()` — Destructuring | ✅ 동일 |
| `DOMContentLoaded` 이벤트 등록 | ✅ 동일 |

---

## 7. 사용된 ES 문법 (v1과 동일)

| ES 문법 | 사용 위치 |
|---------|-----------|
| `import` / `export` | 파일 상단 |
| `class` + `new` | DepartmentApi 인스턴스 생성 |
| `const` | 모든 변수/함수/인스턴스 선언 |
| Arrow Function | 모든 함수 |
| `async/await` | API 호출 함수 |
| Template Literal | HTML 생성, 메시지 |
| `Array.map().join('')` | 렌더링 함수 |
| Destructuring | `setupEditForm`, `handleListClick` |
| Shorthand Property | `handleFormSubmit` |
| Ternary Operator | `showLoading` |

---

## 8. index.html 연결

```html
<!-- v1 주석 처리 -->
<!-- <script type="module" src="js/dept_runner_v1.js"></script> -->

<!-- v2 활성화 -->
<script type="module" src="js/dept_runner_v2.js"></script>
```

---

## 9. 파일 위치

```
project/
└── js/
    ├── dept_runner_v1.js    ← 버전 1 (함수형) — 학습 참고용
    ├── dept_runner_v1.md
    ├── dept_runner_v2.js    ← 이 파일 (클래스형) — 실제 사용
    ├── dept_runner_v2.md    ← 이 문서
    └── api/
        └── departmentApi.js ← DepartmentApi 클래스 (버전 2) 제공
```
