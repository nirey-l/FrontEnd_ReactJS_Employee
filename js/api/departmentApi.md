# js/api/departmentApi.js 정리 문서

## 역할

부서(Department) 관련 **모든 HTTP 통신**을 담당하는 API 모듈입니다.
UI 코드(departmentUI.js)에서 직접 fetch를 호출하지 않고 이 모듈을 통해 서버와 통신합니다.

**이 파일의 핵심 변경점 (v1.0 → v2.0):**
- `department.js`에 UI 코드와 섞여있던 API 함수들을 이 파일로 분리했습니다.
- `export`를 붙여 다른 파일에서 `import`할 수 있도록 모듈화했습니다.
- **버전 1(함수형)** 과 **버전 2(클래스형)** 두 가지 방식으로 작성되어 있습니다.

---

## 두 버전 한눈에 비교

| 항목 | 버전 1 — 함수형 | 버전 2 — 클래스형 |
|------|----------------|-----------------|
| URL 관리 | `const BASE_URL` (모듈 상단) | `#baseUrl` (클래스 내부 private 필드) |
| 함수 정의 | `export const getAll = async () => {}` | 클래스 메서드 `async getAll() {}` |
| 호출 방법 | `getAllDepartments()` | `departmentApi.getAll()` |
| import 방법 | `import { getAllDepartments }` | `import { DepartmentApi }` |
| 인스턴스 필요 | 불필요 | `new DepartmentApi()` 필요 |
| 초보자 접근성 | ★★★★★ 쉬움 | ★★★☆☆ 중간 |
| 확장성/유지보수 | ★★★☆☆ 보통 | ★★★★★ 좋음 |
| 실제 사용 여부 | 학습 참고용 | **실제 export되어 사용** |

---

## 버전 1 — 함수형 방식 (초보자 추천)

v1.0의 전역 함수와 거의 동일한 구조입니다. 달라진 점은 두 가지뿐입니다.
1. `export`를 붙여 다른 파일에서 `import`할 수 있게 했습니다.
2. `const` + Arrow Function으로 작성했습니다.

### 함수 목록

| 함수명 | HTTP | URL | 설명 |
|--------|------|-----|------|
| `getAllDepartments()` | GET | `/api/departments` | 전체 부서 목록 조회 |
| `getDepartmentById(id)` | GET | `/api/departments/{id}` | ID로 단건 조회 |
| `createDepartment(data)` | POST | `/api/departments` | 새 부서 생성 |
| `updateDepartment(id, data)` | PUT | `/api/departments/{id}` | 부서 정보 수정 |
| `deleteDepartment(id)` | DELETE | `/api/departments/{id}` | 부서 삭제 |

### 코드 구조

```javascript
// const BASE_URL = 'http://localhost:8080/api/departments';

export const getAllDepartments = async () => {
    try {
        const response = await fetch(BASE_URL);
        await checkResponse(response);
        return await response.json();
    } catch (error) {
        handleApiError(error);
        return [];   // 오류 시 빈 배열 반환 → UI가 깨지지 않음
    }
};
```

### import 및 사용 방법

```javascript
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from '../api/departmentApi.js';

// 함수 이름으로 바로 호출합니다.
const departments = await getAllDepartments();
const dept        = await getDepartmentById(1);
const newDept     = await createDepartment({ departmentName: 'HR', departmentDescription: '인사팀' });
const updated     = await updateDepartment(1, { departmentName: 'HR', departmentDescription: '인사관리팀' });
const ok          = await deleteDepartment(1);
```

---

## 버전 2 — 클래스형 방식 (실제 사용 버전)

버전 1의 5개 함수를 하나의 **클래스(Class)** 라는 틀에 묶은 것입니다.
내부 로직은 버전 1과 완전히 동일합니다.

### 사용된 ES 문법

| 문법 | 사용 위치 | 설명 |
|------|-----------|------|
| `class` | `export class DepartmentApi` | 관련 메서드를 하나의 설계도로 묶음 |
| `#baseUrl` (Private Field) | 클래스 필드 선언 | 외부에서 접근/수정 불가능한 URL |
| `export` | `export class DepartmentApi` | 다른 파일에서 import 가능하도록 공개 |
| `import` | 파일 상단 | utils.js에서 공통 함수 가져오기 |
| `async/await` | 모든 메서드 | 비동기 HTTP 통신 처리 |
| `const`/`let` | 지역 변수 | `var` 완전 제거 |
| Arrow Function | 없음(클래스 메서드는 일반 함수 문법) | 콜백 내부에서만 사용 |
| Template Literal | URL 조합 | `` `${this.#baseUrl}/${id}` `` |
| Destructuring | `create({ departmentName, departmentDescription })` | 파라미터에서 값을 바로 추출 |

### 메서드 목록

| 메서드 | HTTP | URL | 설명 | 반환값 |
|--------|------|-----|------|--------|
| `getAll()` | GET | `/api/departments` | 전체 부서 목록 조회 | `Array` / `[]` |
| `getById(id)` | GET | `/api/departments/{id}` | ID로 단건 조회 | `object` / `null` |
| `create({ departmentName, departmentDescription })` | POST | `/api/departments` | 새 부서 생성 | `object` / `null` |
| `update(id, { departmentName, departmentDescription })` | PUT | `/api/departments/{id}` | 부서 정보 수정 | `object` / `null` |
| `delete(id)` | DELETE | `/api/departments/{id}` | 부서 삭제 | `true` / `false` |

### 클래스 구조 설명

```javascript
export class DepartmentApi {

    // Private Field: 클래스 외부에서 접근 불가
    // departmentApi.#baseUrl  ← 접근하면 오류 발생
    #baseUrl = 'http://localhost:8080/api/departments';

    async getAll() { ... }

    async getById(id) { ... }

    //  Destructuring 파라미터
    //  create(departmentData) 대신 { departmentName, departmentDescription }으로
    //  필요한 값만 바로 꺼내어 사용합니다.
    async create({ departmentName, departmentDescription }) { ... }

    async update(id, { departmentName, departmentDescription }) { ... }

    async delete(id) { ... }
}
```

### import 및 사용 방법

```javascript
// 1. import: DepartmentApi 클래스를 가져옵니다.
import { DepartmentApi } from '../api/departmentApi.js';

// 2. 인스턴스 생성: new 키워드로 실제 사용할 객체를 만듭니다.
//    클래스(설계도) → 인스턴스(실제 객체)
const departmentApi = new DepartmentApi();

// 3. 메서드 호출: 인스턴스.메서드명() 형태로 사용합니다.
const departments = await departmentApi.getAll();
const dept        = await departmentApi.getById(1);
const newDept     = await departmentApi.create({
    departmentName: 'HR',
    departmentDescription: '인사관리팀'
});
const updated     = await departmentApi.update(1, {
    departmentName: 'HR',
    departmentDescription: '인사관리팀 (수정됨)'
});
const ok          = await departmentApi.delete(1);  // true or false
```

---

## API 엔드포인트 응답 형식

### DepartmentDto (서버 응답 형식)

```json
{
    "id": 1,
    "departmentName": "HR",
    "departmentDescription": "performs human resource management functions"
}
```

### HTTP 상태 코드별 처리

| 상태 코드 | 상황 | 처리 방법 |
|-----------|------|-----------|
| 200 OK | 조회/수정/삭제 성공 | 응답 데이터 반환 |
| 201 Created | 생성 성공 | 생성된 객체 반환 |
| 400 Bad Request | 유효성 검사 실패 | `checkResponse`가 Error throw → `handleApiError`로 메시지 표시 |
| 404 Not Found | 해당 ID 없음 | `null` 반환 (에러로 처리하지 않음) |
| 500 Internal Server Error | 서버 오류 | `handleApiError`로 메시지 표시 |
| Network Error | 서버 미실행 | `handleApiError`로 연결 오류 메시지 표시 |

---

## 의존 관계

```
departmentApi.js
    └── import { handleApiError, checkResponse } from '../utils.js'

departmentUI.js
    └── import { DepartmentApi } from '../api/departmentApi.js'
```

---

## 파일 위치

```
project/
└── js/
    ├── utils.js                ← handleApiError, checkResponse 제공
    └── api/
        ├── departmentApi.js    ← 이 파일
        └── departmentApi.md    ← 이 문서
```

---

## v1.0 → v2.0 변경점 대조표

| 항목 | v1.0 (department.js) | v2.0 (departmentApi.js) |
|------|---------------------|------------------------|
| 파일 위치 | `department.js` (루트, UI 코드와 혼합) | `js/api/departmentApi.js` (API만 분리) |
| URL 관리 | `const API_BASE_URL` (전역) | `#baseUrl` (클래스 private 필드) |
| 함수 구조 | `async function fetchAllDepartments()` | `async getAll()` (클래스 메서드) |
| 외부 공개 | 전역 함수 (암묵적 공유) | `export class DepartmentApi` (명시적) |
| 에러 처리 | `handleApiError` 직접 포함 | `import { handleApiError }` from utils.js |
| UI 코드 포함 | 있음 (renderDepartmentList 등) | 없음 (API 통신만 담당) |
| 파라미터 | `createDepartment(data)` — 객체 전체 | `create({ departmentName, ... })` — Destructuring |
