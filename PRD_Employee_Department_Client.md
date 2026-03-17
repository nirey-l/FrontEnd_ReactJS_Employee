# PRD: Employee & Department Management Web Client

**문서 버전:** 1.0  
**작성 대상:** Gemini-CLI (AI 코드 생성 요청용)  
**기술 스택:** HTML / CSS / JavaScript (Vanilla, Ajax)

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 배경
Spring Boot 기반의 Employee & Department REST API가 `http://localhost:8080`에서 실행 중입니다.  
이 API와 Ajax 통신하는 **단일 페이지(SPA) 웹 클라이언트**를 HTML/CSS/JavaScript로 구현합니다.  
개발자는 HTML/CSS/JavaScript 초보자이므로, **코드는 명확한 주석과 함께 쉽게 이해할 수 있도록 작성**해야 합니다.

### 1.2 목표
- Backend API의 모든 엔드포인트를 UI에서 호출할 수 있어야 함
- 별도의 빌드 도구(webpack, npm 등) 없이 브라우저에서 직접 실행 가능한 단일 HTML 파일
- CRUD 기능(생성, 조회, 수정, 삭제)을 직관적인 UI로 제공
- Ajax(fetch API 또는 XMLHttpRequest)를 사용하여 백엔드와 비동기 통신

---

## 2. 기술 스펙 (Technical Specification)

### 2.1 Backend API 베이스 URL
```
http://localhost:8080
```

### 2.2 Department API 엔드포인트

| 기능 | Method | URL | Request Body | Response |
|------|--------|-----|--------------|----------|
| 부서 생성 | POST | `/api/departments` | `{ departmentName, departmentDescription }` | 201 Created, DepartmentDto |
| 부서 전체 조회 | GET | `/api/departments` | 없음 | 200 OK, DepartmentDto[] |
| 부서 단건 조회 | GET | `/api/departments/{id}` | 없음 | 200 OK, DepartmentDto |
| 부서 수정 | PUT | `/api/departments/{id}` | `{ departmentName, departmentDescription }` | 200 OK, DepartmentDto |
| 부서 삭제 | DELETE | `/api/departments/{id}` | 없음 | 200 OK, "Department deleted successfully!." |

#### DepartmentDto 구조
```json
{
  "id": 1,
  "departmentName": "HR",
  "departmentDescription": "performs human resource management functions"
}
```

#### 유효성 검사 규칙 (Validation)
- `departmentName`: 필수 입력 (빈 값 불가)
- `departmentDescription`: 필수 입력 (빈 값 불가)

---

### 2.3 Employee API 엔드포인트

| 기능 | Method | URL | Request Body | Response |
|------|--------|-----|--------------|----------|
| 직원 생성 | POST | `/api/employees` | `{ firstName, lastName, email, departmentId }` | 201 Created, EmployeeDto |
| 직원 전체 조회 | GET | `/api/employees` | 없음 | 200 OK, EmployeeDto[] |
| 직원 단건 조회 (ID) | GET | `/api/employees/{id}` | 없음 | 200 OK, EmployeeDto |
| 직원 단건 조회 (이메일) | GET | `/api/employees/email/{email}` | 없음 | 200 OK, EmployeeDto |
| 직원 + 부서 전체 조회 | GET | `/api/employees/departments` | 없음 | 200 OK, EmployeeDto[] (departmentDto 포함) |
| 직원 수정 | PUT | `/api/employees/{id}` | `{ firstName, lastName, email, departmentId }` | 200 OK, EmployeeDto |
| 직원 삭제 | DELETE | `/api/employees/{id}` | 없음 | 200 OK, "Employee deleted successfully!." |

#### EmployeeDto 구조 (기본 조회)
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

#### EmployeeDto 구조 (부서 포함 조회 - `/api/employees/departments`)
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

#### 유효성 검사 규칙 (Validation)
- `firstName`: 필수 입력 (빈 값 불가)
- `lastName`: 필수 입력 (빈 값 불가)
- `email`: 필수 입력 (빈 값 불가)
- `departmentId`: 필수 입력, 양수(1 이상)여야 함

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 탭(Tab) 기반 내비게이션
- 상단에 **"부서 관리(Department)"** 탭과 **"직원 관리(Employee)"** 탭 두 개를 배치
- 탭 클릭 시 해당 섹션으로 전환

---

### 3.2 부서 관리 탭 (Department Tab)

#### 3.2.1 부서 생성 폼
- 입력 필드:
  - 부서명 (`departmentName`): text input
  - 부서 설명 (`departmentDescription`): text input 또는 textarea
- **[부서 생성]** 버튼 클릭 시 `POST /api/departments` 호출
- 성공 시: 성공 메시지 표시 및 부서 목록 자동 갱신
- 실패 시: 오류 메시지 표시 (예: 유효성 검사 오류)

#### 3.2.2 부서 전체 목록 조회
- 페이지 로드 시 및 CRUD 작업 후 자동으로 `GET /api/departments` 호출
- 결과를 테이블로 표시: ID, 부서명, 부서 설명, 작업 버튼(수정/삭제)

#### 3.2.3 부서 단건 조회 (ID)
- ID 입력 필드와 **[조회]** 버튼
- `GET /api/departments/{id}` 호출
- 결과를 카드 또는 테이블 형태로 표시

#### 3.2.4 부서 수정
- 목록의 **[수정]** 버튼 클릭 시 해당 부서 데이터를 수정 폼에 자동 채움
- 수정 후 **[수정 저장]** 버튼으로 `PUT /api/departments/{id}` 호출
- 성공 시 목록 자동 갱신

#### 3.2.5 부서 삭제
- 목록의 **[삭제]** 버튼 클릭 시 확인 대화상자(confirm) 표시
- 확인 시 `DELETE /api/departments/{id}` 호출
- 성공 시 목록에서 즉시 제거

---

### 3.3 직원 관리 탭 (Employee Tab)

#### 3.3.1 직원 생성 폼
- 입력 필드:
  - 이름 (`firstName`): text input
  - 성 (`lastName`): text input
  - 이메일 (`email`): email input
  - 부서 ID (`departmentId`): number input
- **[직원 생성]** 버튼 클릭 시 `POST /api/employees` 호출
- 성공 시: 성공 메시지 표시 및 직원 목록 자동 갱신
- 실패 시: 오류 메시지 표시

#### 3.3.2 직원 전체 목록 조회
- 페이지 로드 시 및 CRUD 작업 후 자동으로 `GET /api/employees` 호출
- 결과를 테이블로 표시: ID, 이름, 성, 이메일, 부서 ID, 작업 버튼(수정/삭제)

#### 3.3.3 직원 단건 조회 (ID)
- ID 입력 필드와 **[ID로 조회]** 버튼
- `GET /api/employees/{id}` 호출
- 결과 표시

#### 3.3.4 직원 단건 조회 (이메일)
- 이메일 입력 필드와 **[이메일로 조회]** 버튼
- `GET /api/employees/email/{email}` 호출
- 결과 표시

#### 3.3.5 직원 + 부서 정보 전체 조회
- **[직원 + 부서 조회]** 버튼 클릭 시 `GET /api/employees/departments` 호출
- `departmentDto` 필드를 파싱하여 부서명을 포함한 테이블로 표시
- 표시 컬럼: ID, 이름, 성, 이메일, 부서명, 부서 설명

#### 3.3.6 직원 수정
- 목록의 **[수정]** 버튼 클릭 시 해당 직원 데이터를 수정 폼에 자동 채움
- `PUT /api/employees/{id}` 호출
- 성공 시 목록 자동 갱신

#### 3.3.7 직원 삭제
- 목록의 **[삭제]** 버튼 클릭 시 확인 대화상자(confirm) 표시
- `DELETE /api/employees/{id}` 호출
- 성공 시 목록에서 즉시 제거

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

### 4.1 파일 구조
```
project/
└── index.html       ← 모든 HTML, CSS, JavaScript를 포함하는 단일 파일
```
> 별도의 빌드 도구 없이 브라우저에서 직접 열 수 있어야 합니다.

### 4.2 Ajax 통신 방식
- **fetch API** 사용 권장 (XMLHttpRequest 대신)
- 모든 요청/응답은 `Content-Type: application/json` 헤더 사용
- `async/await` 패턴으로 비동기 처리
- 오류 처리: try/catch 블록으로 네트워크 오류 및 4xx/5xx 응답 처리

#### Ajax 요청 기본 패턴 예시
```javascript
// GET 요청 예시
async function getAllDepartments() {
  try {
    const response = await fetch('http://localhost:8080/api/departments');
    if (!response.ok) throw new Error('서버 오류: ' + response.status);
    const data = await response.json();
    // 화면에 데이터 표시
    renderDepartments(data);
  } catch (error) {
    showError('부서 목록 조회 실패: ' + error.message);
  }
}

// POST 요청 예시
async function createDepartment(departmentData) {
  try {
    const response = await fetch('http://localhost:8080/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(departmentData)
    });
    if (!response.ok) throw new Error('서버 오류: ' + response.status);
    const data = await response.json();
    showSuccess('부서가 생성되었습니다.');
    getAllDepartments(); // 목록 갱신
  } catch (error) {
    showError('부서 생성 실패: ' + error.message);
  }
}
```

### 4.3 UI/UX 요구사항
- **로딩 표시:** API 호출 중 버튼 비활성화 또는 로딩 텍스트 표시
- **성공/오류 메시지:** API 호출 결과를 사용자에게 명확하게 표시 (색상: 성공=녹색, 오류=빨간색)
- **확인 대화상자:** 삭제 작업 전 `confirm()` 사용
- **폼 초기화:** 생성/수정 성공 후 입력 폼 자동 초기화

### 4.4 코드 품질 요구사항
- **한글 주석:** 각 함수와 주요 로직에 한글로 주석 작성 (초보자가 이해하기 쉽도록)
- **함수 분리:** API 호출 함수, DOM 렌더링 함수, 이벤트 핸들러를 각각 분리
- **전역 변수 최소화:** 필요한 상태만 전역 변수로 관리

---

## 5. UI 레이아웃 (UI Layout)

```
+--------------------------------------------------+
|        Employee & Department Manager              |
+--------------------------------------------------+
| [부서 관리(Dept)]  [직원 관리(Emp)]              |  ← 탭 내비게이션
+--------------------------------------------------+
|                                                  |
|  ── 부서 생성 ──────────────────────────────     |
|  부서명: [________]  부서설명: [__________]      |
|  [부서 생성 버튼]                                |
|                                                  |
|  ── 부서 조회 (ID) ─────────────────────────     |
|  ID: [___]  [조회 버튼]                          |
|  결과 표시 영역                                  |
|                                                  |
|  ── 전체 부서 목록 ──────────────────────────    |
|  [새로고침 버튼]                                 |
|  +----+----------+------------------+-------+   |
|  | ID | 부서명   | 부서 설명        | 작업  |   |
|  +----+----------+------------------+-------+   |
|  |  1 | HR       | performs human.. |[수정][삭제]|
|  |  2 | Marketing| creates strate.. |[수정][삭제]|
|  +----+----------+------------------+-------+   |
|                                                  |
+--------------------------------------------------+
```

---

## 6. API 응답 오류 처리 규칙

| HTTP 상태 코드 | 상황 | 처리 방법 |
|---------------|------|-----------|
| 200 OK | 성공 (조회, 수정, 삭제) | 결과 표시 |
| 201 Created | 성공 (생성) | 성공 메시지 + 목록 갱신 |
| 400 Bad Request | 유효성 검사 실패 | 서버 오류 메시지 표시 |
| 404 Not Found | 리소스 없음 | "해당 ID가 존재하지 않습니다" 표시 |
| 500 Internal Server Error | 서버 오류 | "서버 오류가 발생했습니다" 표시 |
| Network Error | 서버 연결 불가 | "서버에 연결할 수 없습니다. localhost:8080이 실행 중인지 확인하세요" 표시 |

---

## 7. 구현 시 주의사항

1. **CORS:** 백엔드에 `@CrossOrigin("*")`이 설정되어 있어 별도 CORS 처리 불필요
2. **이메일 경로 변수:** `GET /api/employees/email/{email}` 호출 시 이메일의 `@` 기호가 URL에 그대로 들어가도 동작함 (백엔드 확인됨, 예: `http://localhost:8080/api/employees/email/John@company.com`)
3. **departmentDto null 처리:** `/api/employees` 조회 시 `departmentDto`는 항상 `null`임. `/api/employees/departments` 호출 시에만 `departmentDto`가 채워짐
4. **수정 폼 공유:** 생성 폼과 수정 폼을 동일 폼으로 구현하고, 수정 모드일 때는 숨겨진 `id` 필드를 사용하여 PUT 요청에 ID 포함

---

## 8. 구현 우선순위

| 우선순위 | 기능 |
|---------|------|
| P1-1 (필수) | 부서 CRUD 전체 |
| P1-2 (필수) | 직원 CRUD 전체 |
| P1-3 (필수) | 직원 이메일 조회 |
| P2-1 (중요) | 직원 + 부서 통합 조회 (`/api/employees/departments`) |
| P2-2 (중요) | 성공/오류 메시지 표시 |
| P3-1 (선택) | 로딩 상태 표시 |
| P3-2 (선택) | 반응형 스타일 개선 |

---

## 9. 최종 산출물 요구사항

- **파일명:** `index.html`, `style.css`, `department.js`, `employee.js`
- **파일 수:** 3개 (HTML, CSS, JS 모두 포함)
- **실행 방법:** 브라우저에서 `index.html` 파일을 직접 열거나 `Live Server`로 실행
- **브라우저 지원:** Chrome, Edge 최신 버전

---

*이 PRD를 Gemini-CLI에 전달하여 `index.html` 단일 파일로 구현을 요청하세요.*
