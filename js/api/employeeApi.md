# js/api/employeeApi.js 정리 문서

## 1. 파일 개요

| 항목 | 내용 |
|------|------|
| 파일명 | `js/api/employeeApi.js` |
| 역할 | 직원(Employee) 관련 모든 HTTP 통신 담당 |
| 의존 모듈 | `js/utils.js` (handleApiError, checkResponse) |
| 사용하는 곳 | `js/ui/employeeUI.js` (P2 구현 예정) |
| 대체 파일 | 기존 `employee.js`의 API 통신 부분 |

### v1.0(employee.js)과의 핵심 차이

| 항목 | v1.0 (employee.js) | v2.0 (employeeApi.js) |
|------|-------------------|-----------------------|
| 파일 위치 | 루트 (UI 코드와 혼합) | `js/api/` (API만 분리) |
| handleApiError | department.js 전역 함수에 암묵적 의존 | `import { handleApiError }` from utils.js |
| API_BASE_URL | department.js의 전역 변수 공유 | 이 파일에서 독립적으로 관리 |
| 함수 공개 방식 | 전역 함수 (window 객체) | `export`로 명시적 공개 |
| Spread Operator | 미사용 | `create()`, `update()` 에서 객체 복사에 사용 |

---

## 2. API 엔드포인트 목록

| 기능 | HTTP | URL | 버전 1 함수명 | 버전 2 메서드명 |
|------|------|-----|--------------|----------------|
| 전체 직원 조회 | GET | `/api/employees` | `getAllEmployees()` | `getAll()` |
| 직원+부서 통합 조회 | GET | `/api/employees/departments` | `getAllEmployeesWithDepartments()` | `getAllWithDepartments()` |
| ID로 단건 조회 | GET | `/api/employees/{id}` | `getEmployeeById(id)` | `getById(id)` |
| 이메일로 단건 조회 | GET | `/api/employees/email/{email}` | `getEmployeeByEmail(email)` | `getByEmail(email)` |
| 직원 생성 | POST | `/api/employees` | `createEmployee(data)` | `create(data)` |
| 직원 수정 | PUT | `/api/employees/{id}` | `updateEmployee(id, data)` | `update(id, data)` |
| 직원 삭제 | DELETE | `/api/employees/{id}` | `deleteEmployee(id)` | `delete(id)` |

---

## 3. 모듈 의존 관계

```
employeeApi.js
    └── import { handleApiError, checkResponse } from '../utils.js'

employeeUI.js  (P2 구현 예정)
    ├── import { EmployeeApi }     from '../api/employeeApi.js'
    └── import { DepartmentApi }  from '../api/departmentApi.js'  (부서 드롭다운용)
```

---

## 4. 두 버전 한눈에 비교

| 항목 | 버전 1 — 함수형 | 버전 2 — 클래스형 |
|------|----------------|------------------|
| URL 관리 | `const BASE_URL` (모듈 상단) | `#baseUrl` (클래스 Private 필드) |
| 함수/메서드 정의 | `export const getAll = async () => {}` | `async getAll() {}` |
| 호출 방법 | `getAllEmployees()` | `employeeApi.getAll()` |
| import 방법 | `import { getAllEmployees, ... }` | `import { EmployeeApi }` |
| 인스턴스 필요 | 불필요 | `new EmployeeApi()` 필요 |
| Spread Operator | 미사용 | `create()`, `update()` 에서 사용 |
| 초보자 접근성 | ★★★★★ 쉬움 | ★★★☆☆ 중간 |
| 확장성/유지보수 | ★★★☆☆ 보통 | ★★★★★ 좋음 |

---

## 5. 버전 1 — 함수형 방식 상세

### 구조

```javascript
import { handleApiError, checkResponse } from '../utils.js';

const BASE_URL = 'http://localhost:8080/api/employees';

export const getAllEmployees                = async () => { ... };
export const getAllEmployeesWithDepartments = async () => { ... };
export const getEmployeeById               = async (id) => { ... };
export const getEmployeeByEmail            = async (email) => { ... };
export const createEmployee                = async (employeeData) => { ... };
export const updateEmployee                = async (id, employeeData) => { ... };
export const deleteEmployee                = async (id) => { ... };
```

### import 및 사용 방법

```javascript
import {
    getAllEmployees,
    getAllEmployeesWithDepartments,
    getEmployeeById,
    getEmployeeByEmail,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from '../api/employeeApi.js';

// 함수 이름으로 바로 호출합니다.
const employees  = await getAllEmployees();
const withDepts  = await getAllEmployeesWithDepartments();
const emp        = await getEmployeeById(1);
const empByEmail = await getEmployeeByEmail('john@company.com');

const newEmp = await createEmployee({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    departmentId: 1
});

const updated = await updateEmployee(1, {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@company.com',
    departmentId: 2
});

const ok = await deleteEmployee(1);  // true or false
```

### 함수별 반환값 정리

| 함수 | 성공 시 반환 | 실패 시 반환 |
|------|------------|------------|
| `getAllEmployees()` | `EmployeeDto[]` (배열) | `[]` (빈 배열) |
| `getAllEmployeesWithDepartments()` | `EmployeeDto[]` (departmentDto 포함) | `[]` (빈 배열) |
| `getEmployeeById(id)` | `EmployeeDto` (객체) | `null` |
| `getEmployeeByEmail(email)` | `EmployeeDto` (객체) | `null` |
| `createEmployee(data)` | 생성된 `EmployeeDto` (객체) | `null` |
| `updateEmployee(id, data)` | 수정된 `EmployeeDto` (객체) | `null` |
| `deleteEmployee(id)` | `true` | `false` |

---

## 6. 버전 2 — 클래스형 방식 상세

### 클래스 구조

```javascript
export class EmployeeApi {

    // Private Field: 클래스 외부에서 접근 불가
    #baseUrl = 'http://localhost:8080/api/employees';

    async getAll()                       { ... }  // GET  /api/employees
    async getAllWithDepartments()         { ... }  // GET  /api/employees/departments
    async getById(id)                    { ... }  // GET  /api/employees/{id}
    async getByEmail(email)              { ... }  // GET  /api/employees/email/{email}
    async create(employeeData)           { ... }  // POST /api/employees
    async update(id, employeeData)       { ... }  // PUT  /api/employees/{id}
    async delete(id)                     { ... }  // DELETE /api/employees/{id}
}
```

### import 및 사용 방법

```javascript
import { EmployeeApi } from '../api/employeeApi.js';

// 인스턴스 생성: 클래스(설계도) → 인스턴스(실제 사용 객체)
const employeeApi = new EmployeeApi();

// 메서드 호출
const employees  = await employeeApi.getAll();
const withDepts  = await employeeApi.getAllWithDepartments();
const emp        = await employeeApi.getById(1);
const empByEmail = await employeeApi.getByEmail('john@company.com');

const newEmp = await employeeApi.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    departmentId: 1
});

const updated = await employeeApi.update(1, {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@company.com',
    departmentId: 2
});

const ok = await employeeApi.delete(1);  // true or false
```

---

## 7. 사용된 ES 문법 상세

### 7-1. `import` — 명시적 의존성 선언

```javascript
// v1.0: employee.js가 department.js의 전역 handleApiError에 암묵적으로 의존
//   → department.js가 먼저 로드되지 않으면 오류 발생
//   → 어디에 의존하는지 코드만 봐서는 알 수 없음

// v2.0: import로 명시적으로 선언
import { handleApiError, checkResponse } from '../utils.js';
//  → 이 파일이 utils.js의 두 함수에 의존함을 코드에서 바로 파악 가능
```

---

### 7-2. `const` / `let` — var 완전 제거

```javascript
// v1.0 방식 (사용 금지)
var BASE_URL = 'http://...';   // 전역 스코프, 재선언 가능, 호이스팅 문제

// v2.0 방식
const BASE_URL = 'http://...'; // 블록 스코프, 재할당 불가, 안전
```

---

### 7-3. Arrow Function `() => {}` — 콜백 간결화

```javascript
// v1.0 방식
async function fetchAllEmployees() { ... }

// v2.0 함수형 방식 (버전 1)
export const getAllEmployees = async () => { ... };

// v2.0 클래스 방식 (버전 2) - 클래스 메서드는 일반 함수 문법 사용
async getAll() { ... }
```

---

### 7-4. Template Literal `` `${}` `` — URL 조합

```javascript
// v1.0 방식: 문자열 연결(+)
fetch(API_BASE_URL + '/employees/' + id)
fetch(API_BASE_URL + '/employees/email/' + email)

// v2.0 방식: Template Literal
fetch(`${BASE_URL}/${id}`)             // 버전 1
fetch(`${this.#baseUrl}/${id}`)        // 버전 2
fetch(`${this.#baseUrl}/email/${email}`)
```

---

### 7-5. Private Field `#` — 캡슐화

```javascript
export class EmployeeApi {
    // # 접두사 → 클래스 외부에서 접근 불가능
    #baseUrl = 'http://localhost:8080/api/employees';

    async getAll() {
        // 클래스 내부에서는 this.#baseUrl 로 접근 가능
        const response = await fetch(this.#baseUrl);
        // ...
    }
}

// 외부에서 접근 시도 → SyntaxError 발생!
const api = new EmployeeApi();
console.log(api.#baseUrl);  // ❌ SyntaxError
console.log(api.baseUrl);   // ❌ undefined (없는 프로퍼티)
```

---

### 7-6. Spread Operator `...` — 객체 안전 복사

버전 2의 `create()`와 `update()`에서 사용합니다.

```javascript
// Spread 없이 직접 전달하는 경우 (버전 1)
body: JSON.stringify(employeeData)
// → employeeData 원본 객체를 그대로 직렬화
// → 나중에 필드를 추가하려면 employeeData.newField = '...' 로 원본을 변경해야 함

// Spread로 복사하는 경우 (버전 2)
const requestBody = { ...employeeData };
body: JSON.stringify(requestBody)
// → 원본 employeeData는 그대로 유지 (불변성)
// → 필드 추가가 쉬움: const requestBody = { ...employeeData, role: 'EMPLOYEE' };

// 실제 활용 예시: 특정 필드를 덮어쓰는 경우
const requestBody = {
    ...employeeData,             // 기존 필드 복사
    departmentId: Number(employeeData.departmentId),  // departmentId를 숫자로 변환
};
```

---

### 7-7. `async/await` + `try/catch` — 비동기 오류 처리

```javascript
async getById(id) {
    try {
        // await: fetch Promise가 완료될 때까지 기다립니다.
        const response = await fetch(`${this.#baseUrl}/${id}`);

        // 404는 오류가 아닌 "없음" 상황 → null 반환
        if (response.status === 404) return null;

        // checkResponse: 4xx/5xx면 Error를 throw
        await checkResponse(response);

        // 정상 응답이면 JSON 파싱
        return await response.json();

    } catch (error) {
        // fetch 오류, checkResponse의 throw, JSON 파싱 오류 모두 여기서 처리
        console.error(`[EmployeeApi.getById] ID ${id} 조회 오류:`, error);
        handleApiError(error);  // utils.js의 공통 에러 처리
        return null;
    }
}
```

---

## 8. API 응답 데이터 형식 (EmployeeDto)

### 기본 조회 응답 (GET /api/employees, GET /api/employees/{id})

```json
{
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "John@company.com",
    "departmentId": 1,
    "departmentDto": null
}
```

### 부서 포함 조회 응답 (GET /api/employees/departments)

```json
{
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "John@company.com",
    "departmentId": null,
    "departmentDto": {
        "id": 1,
        "departmentName": "HR",
        "departmentDescription": "performs human resource management functions"
    }
}
```

> **주의:** 기본 조회와 부서 포함 조회는 `departmentId`와 `departmentDto`가 서로 반대로 채워집니다.
> - 기본 조회: `departmentId` 있음, `departmentDto` = null
> - 부서 포함 조회: `departmentId` = null, `departmentDto` 있음

### UI에서 부서 정보를 표시하는 방법

```javascript
// [Optional Chaining ?.] departmentDto가 null이어도 오류 없이 처리
// [Nullish Coalescing ??] null/undefined면 'N/A' 기본값 사용
const deptInfo = withDept
    ? (emp.departmentDto?.departmentName ?? 'N/A')   // 부서 포함 조회
    : emp.departmentId;                               // 기본 조회
```

---

## 9. HTTP 상태 코드별 처리

| 상태 코드 | 상황 | 처리 방법 |
|-----------|------|-----------|
| 200 OK | 조회/수정/삭제 성공 | 응답 데이터 반환 |
| 201 Created | 생성 성공 | 생성된 직원 객체 반환 |
| 400 Bad Request | 유효성 검사 실패 (빈 이름, 잘못된 이메일 등) | `checkResponse` → throw → `handleApiError` 메시지 표시 |
| 404 Not Found | 해당 ID/이메일 직원 없음 | 별도 분기 처리 → `null` 반환 |
| 500 Internal Server Error | 서버 오류 | `handleApiError` 메시지 표시 |
| Network Error | 서버 미실행 (localhost:8080) | `handleApiError` 연결 오류 메시지 표시 |

---

## 10. 이메일 조회 주의사항

`GET /api/employees/email/{email}` 엔드포인트에서 이메일의 `@` 기호 처리:

```javascript
// 이메일 그대로 URL에 포함 (별도 인코딩 불필요)
const response = await fetch(`${this.#baseUrl}/email/${email}`);
// 예: GET http://localhost:8080/api/employees/email/john@company.com

// URL 인코딩이 필요한 경우 (선택적)
// const encodedEmail = encodeURIComponent(email);
// const response = await fetch(`${this.#baseUrl}/email/${encodedEmail}`);
```

백엔드 Spring Boot에 `@CrossOrigin("*")`이 설정되어 있고, `@` 기호가 URL 경로에서 허용되므로 그대로 사용합니다.

---

## 11. departmentApi.js와의 구조 비교

| 항목 | departmentApi.js | employeeApi.js |
|------|-----------------|----------------|
| 메서드 수 | 5개 | 7개 (+2: getAllWithDepartments, getByEmail) |
| 추가 엔드포인트 | 없음 | `/departments` (통합 조회), `/email/{email}` (이메일 조회) |
| create 파라미터 | Destructuring `{ departmentName, departmentDescription }` | 객체 전체 `employeeData` + Spread |
| Private Field | `#baseUrl` | `#baseUrl` (동일 패턴) |
| 패턴 통일성 | ✅ | ✅ (동일 패턴 적용) |

---

## 12. 파일 위치

```
project/
├── employee.js                     ← v1.0 (참고용)
└── js/
    ├── utils.js                    ← handleApiError, checkResponse 제공
    └── api/
        ├── departmentApi.js        ← 부서 API (동일 패턴)
        ├── departmentApi.md
        ├── employeeApi.js          ← 이 파일
        └── employeeApi.md          ← 이 문서
```

---

## 13. 다음 단계 (P2 구현 예정)

`js/ui/employeeUI.js` 에서 이 파일을 다음과 같이 사용합니다:

```javascript
// employeeUI.js (P2 구현 예정)
import { EmployeeApi }    from '../api/employeeApi.js';
import { DepartmentApi }  from '../api/departmentApi.js';  // 부서 드롭다운용
import { escapeHTML, showMessage } from '../utils.js';

const employeeApi  = new EmployeeApi();
const departmentApi = new DepartmentApi();

// [Optional Chaining + Nullish Coalescing] 부서 정보 표시
const deptDisplay = emp.departmentDto?.departmentName ?? 'N/A';

// [Promise.all()] 직원 목록 + 부서 목록을 병렬로 동시에 조회 (P3 최적화)
const [employees, departments] = await Promise.all([
    employeeApi.getAll(),
    departmentApi.getAll(),
]);
```
