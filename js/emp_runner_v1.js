/**
 * @file emp_runner_v1.js
 * @description
 * employeeApi.js [버전 1 - 함수형]을 사용하는 직원 관리 UI 연결 파일입니다.
 *
 * 이 파일의 역할:
 *   1. employeeApi.js (버전 1) 의 함수를 import하여 서버와 통신합니다.
 *   2. departmentApi.js (버전 1) 의 getAllDepartments로 부서 드롭다운을 채웁니다.
 *   3. 서버에서 받은 데이터를 HTML 테이블/폼에 렌더링합니다.
 *   4. 버튼/폼 이벤트를 연결합니다.
 *
 * [중요] ES Module과 전역 함수 문제
 *   type="module" 스크립트는 모듈 스코프를 가집니다.
 *   즉, 이 파일 안의 함수는 전역(window)에서 접근할 수 없습니다.
 *   그런데 index.html의 showTab()이 initEmployeeTab()을 전역 함수로 호출합니다.
 *
 *   해결 방법:
 *     window.initEmployeeTab = initEmployeeTab;
 *   → 전역에 등록하여 showTab()에서 호출 가능하게 합니다.
 *
 * index.html 연결 방법:
 *   <script type="module" src="js/emp_runner_v1.js"></script>
 */

// ============================================================
// [import] 다른 모듈에서 필요한 함수를 가져옵니다.
// ============================================================

// [named import] employeeApi.js 버전 1의 직원 API 함수 7개를 가져옵니다.
// v1.0: employee.js 파일 안에 fetch 코드가 직접 있었음
// v2.0: 별도 모듈로 분리된 함수를 import해서 사용
import {
    getAllEmployees,                 // GET  /api/employees
    getAllEmployeesWithDepartments,  // GET  /api/employees/departments
    getEmployeeById,                // GET  /api/employees/{id}
    getEmployeeByEmail,             // GET  /api/employees/email/{email}
    createEmployee,                 // POST /api/employees
    updateEmployee,                 // PUT  /api/employees/{id}
    deleteEmployee,                 // DELETE /api/employees/{id}
} from './api/employeeApi.js';

// [named import] departmentApi.js 버전 1에서 부서 목록 조회 함수를 가져옵니다.
// 직원 등록 폼의 "부서 선택" 드롭다운을 채우기 위해 필요합니다.
// v1.0: employee.js에서 fetch('/api/departments')를 직접 호출했음
// v2.0: departmentApi.js의 함수를 import해서 재사용
import { getAllDepartments } from './api/departmentApi.js';

// [named import] utils.js에서 공통 함수를 가져옵니다.
import { escapeHTML, showMessage } from './utils.js';


// ============================================================
// DOM 요소 캐싱 (HTML 요소를 변수에 저장)
// ============================================================
// [const] 재할당이 없는 DOM 참조는 const로 선언합니다.

// 직원 등록/수정 폼 영역
const empForm          = document.getElementById('emp-form');
const empIdInput       = document.getElementById('emp-id');          // hidden: 수정 시 ID 보관
const empFirstNameInput = document.getElementById('emp-firstname');
const empLastNameInput  = document.getElementById('emp-lastname');
const empEmailInput     = document.getElementById('emp-email');
const empDeptIdSelect   = document.getElementById('emp-dept-id');    // 부서 선택 드롭다운
const empFormTitle      = document.getElementById('emp-form-title');
const empSubmitBtn      = document.getElementById('emp-submit-btn');
const empCancelBtn      = document.getElementById('emp-cancel-btn');

// 직원 단건 조회 영역
const searchEmpIdInput    = document.getElementById('search-emp-id');
const searchEmpEmailInput = document.getElementById('search-emp-email');
const empDetailResult     = document.getElementById('emp-detail-result');

// 버튼: querySelector로 index.html 구조에 맞게 선택합니다.
const searchEmpIdBtn    = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(2) .btn-success');
const searchEmpEmailBtn = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(3) .btn-success');

// 직원 목록 영역
const empListBody   = document.getElementById('emp-list');           // <tbody>
const empLoading    = document.getElementById('emp-loading');        // 로딩 인디케이터
const empRefreshBtn = document.querySelector('#emp-section .list-header .btn-info');
const empWithDeptBtn = document.querySelector('#emp-section .list-header .btn-secondary');

// 테이블 헤더 (withDept 모드일 때 "부서 ID" → "부서명"으로 변경)
const empTableHeader = document.querySelector('#emp-section table thead');


// ============================================================
// 렌더링 함수 (서버 데이터 → HTML 화면에 표시)
// ============================================================

/**
 * 직원 목록을 테이블에 렌더링합니다.
 *
 * [Array.map()] 배열의 각 요소를 HTML 문자열로 변환합니다.
 *   v1.0: forEach + createElement + appendChild (DOM 조작 반복)
 *   v2.0: map().join('') → innerHTML 한 번에 설정 (DOM 조작 1회)
 *
 * [Optional Chaining ?.] emp.departmentDto가 null이어도 오류 없이 처리합니다.
 * [Nullish Coalescing ??] null/undefined일 때만 기본값 'N/A'를 사용합니다.
 *   v1.0: emp.departmentDto?.departmentName || 'N/A'  ← ||는 빈 문자열('')도 대체함
 *   v2.0: emp.departmentDto?.departmentName ?? 'N/A'  ← null/undefined만 대체함 (더 정확)
 *
 * @param {Array}   employees - 서버에서 받은 직원 배열
 * @param {boolean} withDept  - true: 부서명 표시, false: 부서 ID 표시 (기본값 false)
 */
const renderEmployeeList = (employees, withDept = false) => {
    // 데이터가 없으면 안내 메시지를 표시합니다.
    if (!employees || employees.length === 0) {
        empListBody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;">표시할 직원이 없습니다.</td></tr>';
        return;
    }

    // withDept 여부에 따라 테이블 헤더의 5번째 컬럼을 변경합니다.
    // [Template Literal] 헤더 HTML을 조건에 따라 다르게 생성합니다.
    empTableHeader.innerHTML = `
        <tr>
            <th>ID</th>
            <th>이름</th>
            <th>성</th>
            <th>이메일</th>
            <th>${withDept ? '부서명' : '부서 ID'}</th>
            <th>작업</th>
        </tr>
    `;

    // [Array.map()] 직원 배열 → <tr> HTML 문자열 배열로 변환합니다.
    const rows = employees.map((emp) => {
        // [Optional Chaining ?.] departmentDto가 null이면 .departmentName 접근을 건너뜁니다.
        // [Nullish Coalescing ??] 결과가 null/undefined이면 'N/A'를 기본값으로 사용합니다.
        const deptDisplay = withDept
            ? escapeHTML(emp.departmentDto?.departmentName ?? 'N/A')  // 부서명 표시
            : (emp.departmentId ?? 'N/A');                            // 부서 ID 표시

        // [Template Literal] 각 직원 데이터를 <tr> HTML 행으로 만듭니다.
        // [escapeHTML] XSS 방지: 서버 데이터를 innerHTML에 넣기 전에 처리합니다.
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

    // [Array.join('')] 배열의 HTML 문자열들을 하나로 합쳐 한 번에 DOM에 반영합니다.
    empListBody.innerHTML = rows.join('');
};

/**
 * 단건 조회 결과를 화면에 표시합니다.
 *
 * @param {object|null} employee - 조회된 직원 객체 (없으면 null)
 */
const renderEmployeeDetail = (employee) => {
    if (!employee) {
        empDetailResult.style.display = 'none';
        return;
    }

    // [Template Literal] 조회 결과 HTML을 작성합니다.
    // [Optional Chaining + Nullish Coalescing]
    //   departmentDto가 있으면 부서명을, 없으면 departmentId를 표시합니다.
    const deptDisplay = employee.departmentDto
        ? escapeHTML(employee.departmentDto.departmentName)
        : (employee.departmentId ?? '정보 없음');

    empDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${employee.id}</p>
        <p><strong>이름:</strong> ${escapeHTML(employee.firstName)} ${escapeHTML(employee.lastName)}</p>
        <p><strong>이메일:</strong> ${escapeHTML(employee.email)}</p>
        <p><strong>부서:</strong> ${deptDisplay}</p>
    `;
    empDetailResult.style.display = 'block';
};

/**
 * 로딩 인디케이터를 표시하거나 숨깁니다.
 * @param {boolean} isLoading - true면 표시, false면 숨김
 */
const showEmpLoading = (isLoading) => {
    // [Ternary Operator] 조건에 따라 'block' 또는 'none'을 간결하게 선택합니다.
    empLoading.style.display = isLoading ? 'block' : 'none';
};

/**
 * 직원 폼의 부서 드롭다운을 부서 목록으로 채웁니다.
 *
 * [import한 함수] departmentApi.js 버전 1의 getAllDepartments를 사용합니다.
 * v1.0: employee.js 안에서 fetch('/api/departments')를 직접 호출했음
 * v2.0: 이미 만들어진 departmentApi.js의 함수를 재사용합니다. (중복 제거)
 *
 * @param {Array} departments - 부서 배열
 */
const populateDeptDropdown = (departments) => {
    empDeptIdSelect.innerHTML = '<option value="">부서를 선택하세요...</option>';

    // [Array.forEach()] 각 부서를 <option> 요소로 만들어 추가합니다.
    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        // [Template Literal] 부서명과 ID를 조합해서 표시합니다.
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        empDeptIdSelect.appendChild(option);
    });
};


// ============================================================
// 폼 관련 함수
// ============================================================

/**
 * 폼을 초기 상태(생성 모드)로 리셋합니다.
 */
const resetEmpForm = () => {
    empForm.reset();
    empIdInput.value           = '';
    empFormTitle.textContent   = '직원 등록';
    empSubmitBtn.textContent   = '직원 생성';
    empCancelBtn.style.display = 'none';
};

/**
 * 수정 모드로 폼을 설정합니다. (선택한 직원 데이터를 폼에 채웁니다)
 *
 * [Destructuring] 직원 객체에서 필요한 값만 꺼내어 사용합니다.
 *   v1.0: employee.firstName, employee.lastName ... 처럼 접근
 *   v2.0: const { id, firstName, lastName, email, departmentId } = employee
 *
 * @param {object} employee - 수정할 직원 데이터
 */
const setupEmpEditForm = (employee) => {
    // [Destructuring] 객체에서 필요한 값만 골라 변수에 할당합니다.
    const { id, firstName, lastName, email, departmentId } = employee;

    empIdInput.value        = id;
    empFirstNameInput.value = firstName;
    empLastNameInput.value  = lastName;
    empEmailInput.value     = email;
    empDeptIdSelect.value   = departmentId;   // 드롭다운에서 해당 부서를 선택 상태로 만듭니다.

    empFormTitle.textContent   = '직원 수정';
    empSubmitBtn.textContent   = '수정 저장';
    empCancelBtn.style.display = 'inline-block';

    // 폼이 보이도록 부드럽게 스크롤합니다.
    empForm.scrollIntoView({ behavior: 'smooth' });
};


// ============================================================
// 데이터 로드 + 렌더링 통합 함수
// ============================================================

/**
 * 직원 목록을 서버에서 가져와 테이블을 갱신합니다. (기본 조회)
 * 생성/수정/삭제 후 호출하여 화면을 최신 상태로 유지합니다.
 */
const loadAndRenderEmployees = async () => {
    showEmpLoading(true);

    // [import한 함수] employeeApi.js 버전 1의 getAllEmployees를 사용합니다.
    const employees = await getAllEmployees();

    showEmpLoading(false);
    renderEmployeeList(employees, false);  // withDept = false → 부서 ID 표시
};

/**
 * 직원+부서 통합 목록을 서버에서 가져와 테이블을 갱신합니다.
 * "직원+부서 조회" 버튼 클릭 시 호출됩니다.
 */
const loadAndRenderEmployeesWithDept = async () => {
    showEmpLoading(true);

    // [import한 함수] employeeApi.js 버전 1의 getAllEmployeesWithDepartments를 사용합니다.
    const employees = await getAllEmployeesWithDepartments();

    showEmpLoading(false);
    renderEmployeeList(employees, true);   // withDept = true → 부서명 표시
};


// ============================================================
// 이벤트 핸들러 (사용자 동작 처리)
// ============================================================

/**
 * 직원 생성/수정 폼 제출 처리
 *
 * [Shorthand Property] { firstName: firstName } 대신 { firstName } 으로 축약합니다.
 *
 * @param {Event} e - form submit 이벤트
 */
const handleEmpFormSubmit = async (e) => {
    e.preventDefault();  // 폼 기본 동작(페이지 새로고침) 방지

    const id = empIdInput.value;

    // 폼 입력값을 읽어 변수에 저장합니다.
    const firstName    = empFirstNameInput.value.trim();
    const lastName     = empLastNameInput.value.trim();
    const email        = empEmailInput.value.trim();
    const departmentId = empDeptIdSelect.value;

    // 유효성 검사: 빈 값이 있으면 메시지를 표시하고 중단합니다.
    if (!firstName || !lastName || !email || !departmentId) {
        showMessage('모든 필드를 입력해주세요.', true);
        return;
    }

    // [Shorthand Property] 같은 이름의 변수를 객체 프로퍼티로 쓸 때 축약합니다.
    // { firstName: firstName, lastName: lastName, ... } 을 아래처럼 단축합니다.
    const employeeData = { firstName, lastName, email, departmentId };

    if (id) {
        // --- 수정 모드: ID가 있으면 PUT 요청 ---
        const result = await updateEmployee(id, employeeData);
        if (result) {
            showMessage('직원 정보가 성공적으로 수정되었습니다.');
            resetEmpForm();
            await loadAndRenderEmployees();
        }
    } else {
        // --- 생성 모드: ID가 없으면 POST 요청 ---
        const result = await createEmployee(employeeData);
        if (result) {
            showMessage('직원이 성공적으로 생성되었습니다.');
            resetEmpForm();
            await loadAndRenderEmployees();
        }
    }
};

/**
 * ID로 직원 조회 버튼 클릭 처리
 */
const handleSearchEmpById = async () => {
    const id = searchEmpIdInput.value;

    if (!id) {
        showMessage('조회할 직원 ID를 입력해주세요.', true);
        return;
    }

    // [import한 함수] employeeApi.js 버전 1의 getEmployeeById를 사용합니다.
    const employee = await getEmployeeById(id);

    if (!employee) {
        showMessage('해당 ID의 직원이 존재하지 않습니다.', true);
        empDetailResult.style.display = 'none';
        return;
    }

    renderEmployeeDetail(employee);
};

/**
 * 이메일로 직원 조회 버튼 클릭 처리
 */
const handleSearchEmpByEmail = async () => {
    const email = searchEmpEmailInput.value.trim();

    if (!email) {
        showMessage('조회할 직원 이메일을 입력해주세요.', true);
        return;
    }

    // [import한 함수] employeeApi.js 버전 1의 getEmployeeByEmail을 사용합니다.
    // 이메일의 '@' 기호는 URL에 그대로 포함됩니다. (인코딩 불필요)
    const employee = await getEmployeeByEmail(email);

    if (!employee) {
        showMessage('해당 이메일의 직원이 존재하지 않습니다.', true);
        empDetailResult.style.display = 'none';
        return;
    }

    renderEmployeeDetail(employee);
};

/**
 * 테이블의 수정/삭제 버튼 클릭 처리
 * 이벤트 위임(Event Delegation) 방식: tbody 하나에만 이벤트를 등록합니다.
 *
 * [Destructuring] e.target.dataset에서 action과 id를 한 번에 추출합니다.
 *
 * @param {Event} e - click 이벤트
 */
const handleEmpListClick = async (e) => {
    // [Destructuring] dataset 객체에서 action과 id를 한 번에 추출합니다.
    const { action, id } = e.target.dataset;

    if (!action || !id) return;  // 버튼이 아닌 곳 클릭 시 무시

    if (action === 'edit') {
        // 수정 버튼: data-employee 속성의 JSON 문자열을 파싱해서 폼에 채웁니다.
        const employee = JSON.parse(e.target.dataset.employee);
        setupEmpEditForm(employee);

    } else if (action === 'delete') {
        // [Template Literal] 삭제 확인 메시지에 id를 삽입합니다.
        if (confirm(`정말로 ID ${id} 직원을 삭제하시겠습니까?`)) {
            // [import한 함수] employeeApi.js 버전 1의 deleteEmployee를 사용합니다.
            const ok = await deleteEmployee(id);
            if (ok) {
                showMessage('직원이 삭제되었습니다.');
                await loadAndRenderEmployees();
            }
        }
    }
};


// ============================================================
// 직원 탭 초기화 함수
// ============================================================

/**
 * 직원 관리 탭이 처음 열릴 때 한 번만 실행되는 초기화 함수입니다.
 *
 * [중요] index.html의 showTab()이 전역 함수 initEmployeeTab()을 호출합니다.
 * 그런데 이 파일은 ES Module이므로 함수가 전역(window)에 노출되지 않습니다.
 * 따라서 파일 하단에서 window.initEmployeeTab = initEmployeeTab 으로 등록합니다.
 *
 * [초기화 중복 방지]
 * v1.0: initEmployeeTab.initialized 플래그로 중복 실행 방지
 * v2.0: let isInitialized 변수로 동일하게 처리 (클로저 활용)
 */
let isInitialized = false;  // [let] 변경이 있으므로 let으로 선언합니다.

const initEmployeeTab = async () => {
    // 이미 초기화된 경우 다시 실행하지 않습니다.
    if (isInitialized) return;

    // 1) 직원 폼의 부서 드롭다운을 채웁니다.
    //    [import한 함수] departmentApi.js 버전 1의 getAllDepartments 사용
    //    v1.0: employee.js에서 fetch('/api/departments')를 직접 호출
    //    v2.0: 이미 만들어진 getAllDepartments() 함수를 재사용
    const departments = await getAllDepartments();
    populateDeptDropdown(departments);

    // 2) 직원 목록을 처음 로드합니다.
    await loadAndRenderEmployees();

    // 3) 이벤트 리스너를 등록합니다.
    empForm.addEventListener('submit', handleEmpFormSubmit);         // 폼 제출
    empCancelBtn.addEventListener('click', resetEmpForm);            // 취소 버튼
    searchEmpIdBtn.addEventListener('click', handleSearchEmpById);   // ID 조회 버튼
    searchEmpEmailBtn.addEventListener('click', handleSearchEmpByEmail); // 이메일 조회 버튼
    empListBody.addEventListener('click', handleEmpListClick);       // 수정/삭제 버튼 (위임)
    empRefreshBtn.addEventListener('click', loadAndRenderEmployees); // 새로고침 버튼
    empWithDeptBtn.addEventListener('click', loadAndRenderEmployeesWithDept); // 직원+부서 버튼

    // 4) 초기화 완료 플래그를 설정합니다.
    isInitialized = true;
    console.log('[emp_runner_v1] 직원 탭 초기화 완료');
};


// ============================================================
// [중요] 전역 등록
// ============================================================
// ES Module의 함수는 모듈 스코프를 가지므로 외부에서 직접 접근할 수 없습니다.
// index.html의 showTab()이 아래와 같이 전역 함수를 호출하므로:
//   if (typeof initEmployeeTab === 'function') initEmployeeTab();
//
// window 객체에 명시적으로 등록하여 전역에서 접근 가능하게 합니다.
//
// [주의] 이 방법은 "불가피한 경우"에만 사용합니다.
// 이상적으로는 index.html의 showTab도 모듈로 변경하는 것이 좋습니다.
// (main.js에서 addEventListener로 탭 이벤트를 처리하면 전역 노출이 불필요합니다.)
window.initEmployeeTab = initEmployeeTab;
