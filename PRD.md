# PRD: Employee & Department Management System (Frontend)
## 1. 개요 (Overview)
본 프로젝트는 백엔드 Spring Boot API와 통신하여 부서(Department)와 직원(Employee) 정보를 관리하는 웹 인터페이스를 구축하는 것을 목표로 한다. HTML, CSS, 그리고 **Vanilla JavaScript(Ajax/Fetch API)**를 사용하여 현대적이고 직관적인 관리 화면을 구현한다.

## 2. 주요 기능 (Key Features)
### A. 부서 관리 (Department Management)
* 부서 목록 조회: 저장된 모든 부서 정보를 테이블 형식으로 출력한다.

* 부서 등록: 부서명(departmentName)과 부서 설명(departmentDescription)을 입력하여 새로운 부서를 생성한다.

* 부서 수정/삭제: 특정 부서의 정보를 업데이트하거나 삭제한다.

### B. 직원 관리 (Employee Management)
* 직원 목록 조회: 모든 직원의 정보와 소속 부서를 함께 출력한다.

* 직원 등록: 이름(firstName), 성(lastName), 이메일(email), 그리고 **부서 ID(departmentId)**를 입력받아 등록한다.

* 이메일 검색: 특정 이메일 주소를 통해 해당 직원의 상세 정보를 조회한다.

* 직원 삭제: 특정 직원을 시스템에서 제거한다.

### 3. 기술 스택 (Technical Stack)
* Structure: HTML5
* Styling: CSS3 ("Modern & Clean": 현대적이고 깔끔한 화이트톤 디자인)
* Scripting: JavaScript (ES6+)
* Communication: Fetch API (또는 Ajax)를 통한 비동기 HTTP 통신

### 4. API 명세 및 데이터 구조 (API Specifications)
#### 공통 엔드포인트
Base URL: http://localhost:8080/api

#### 부서(Department) API

|Method	|Endpoint	 | Description|
|-------|------------|------------|
| GET   |/departments|	모든 부서 조회|
| GET |	/departments/{id} |	특정 부서 상세 조회|
| POST |	/departments |	신규 부서 등록|
| PUT |	/departments/{id} | 	부서 정보 수정|
| DELETE |	/departments/{id} |	부서 삭제|

#### 직원(Employee) API
|Method	|Endpoint	 | Description|
|-------|------------|------------|
| GET |	/employees |	모든 직원 조회
| GET |	/employees/departments |	직원 및 소속 부서 정보 통합 조회
| GET |	/employees/email/{email} |	이메일로 직원 검색
| POST |	/employees |	신규 직원 등록
| DELETE |	/employees/{id} |	직원 삭제

### 5. UI/UX 요구사항 (User Interface Requirements)
* Single Page Interface: 가급적 한 페이지 내에서 탭(Tab) 또는 섹션을 나누어 부서 관리와 직원 관리가 가능하게 한다.

* 부서 선택 Dropdown: 직원을 등록할 때, 사용자가 직접 departmentId를 숫자로 입력하는 대신, 현재 등록된 부서 목록을 불러와 <select> 박스에서 선택할 수 있도록 구현한다.

* 결과 메시지: API 통신 성공 시 "등록되었습니다", 실패 시 "오류가 발생했습니다"와 같은 알림(Alert)을 사용자에게 제공한다.

* 데이터 동기화: 등록/수정/삭제 작업 후에는 페이지를 새로고침하지 않고 테이블의 목록이 즉시 업데이트되도록 구현한다.

### 6. Gemini-CLI에게 보내는 프롬프트 (Prompt Example)
위의 PRD 내용을 바탕으로 index.html, style.css, script.js 파일을 작성해 줘. 특히 자바스크립트는 Fetch API를 사용하여 백엔드 API와 통신해야 하며, 초보자가 이해할 수 있도록 코드에 주석을 자세히 달아줘. 부서 목록을 먼저 불러와서 직원 등록 폼의 드롭다운 메뉴에 넣어주는 로직을 포함해 줘.