/**
 * @file emp_runner_v2.js
 * @description
 * employeeApi.js [버전 2 - 클래스형]을 사용하는 직원 관리 UI 연결 파일입니다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  emp_runner_v1.js 와 비교해서 달라진 부분은 딱 2곳입니다.       │
 * │                                                                  │
 * │  1. import 방식                                                  │
 * │     v1: import { getAllEmployees, ... }  ← 함수 7개를 import     │
 * │     v2: import { EmployeeApi }           ← 클래스 1개를 import   │
 * │         import { DepartmentApi }         ← 클래스 1개를 import   │
 * │                                                                  │
 * │  2. API 호출 방식                                                │
 * │     v1: getAllEmployees()               ← 함수 직접 호출         │
 * │     v2: employeeApi.getAll()           ← 인스턴스.메서드()       │
 * │                                                                  │
 * │  나머지 렌더링/이벤트 코드는 v1과 완전히 동일합니다.            │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * index.html 연결 방법:
 *   <script type="module" src="js/emp_runner_v2.js"></script>
 */

// ============================================================
// [import] ★ v1과 달라진 첫 번째 부분
// ============================================================

// [v1 방식] 함수 7개를 각각 named import
// import {
//     getAllEmployees,
//     getAllEmployeesWithDepartments,
//     getEmployeeById,
//     getEmployeeByEmail,
//     createEmployee,
//     updateEmployee,
//     deleteEmployee,
// } from './api/employeeApi.js';
// import { getAllDepartments } from './api/departmentApi.js';

// [v2 방식] 클래스 2개만 import — 각 클래스 안에 메서드가 모두 들어있습니다.
import { EmployeeApi }  from './api/employeeApi.js';
import { DepartmentApi } from './api/departmentApi.js';

// utils.js는 v1과 동일합니다.
import { escapeHTML, showMessage } from './utils.js';


// ============================================================
// [인스턴스 생성] ★ v1과 달라진 두 번째 부분
// ============================================================

// [EmployeeApi 인스턴스]
// 직원 관련 모든 API 통신(getAll, getById, create, update, delete ...)은
// 이 하나의 객체를 통해 호출합니다.
//
// v1: 개별 함수 7개를 import해서 각각 호출
// v2: 인스턴스 1개를 만들고 메서드로 호출
//
// 장점:
//   - 코드가 명확해집니다 (employeeApi.getAll() → "직원 API의 getAll")
//   - #baseUrl이 클래스 안에 캡슐화되어 있어 외부에서 수정 불가
//   - 관련 기능이 하나의 객체로 묶여 유지보수가 쉽습니다.
const employeeApi   = new EmployeeApi();

// [DepartmentApi 인스턴스]
// 직원 폼의 부서 드롭다운을 채우는 데만 사용합니다.
const departmentApi = new DepartmentApi();


// ============================================================
// DOM 요소 캐싱 — v1과 동일
// ============================================================

const empForm           = document.getElementById('emp-form');
const empIdInput        = document.getElementById('emp-id');
const empFirstNameInput = document.getElementById('emp-firstname');
const empLastNameInput  = document.getElementById('emp-lastname');
const empEmailInput     = document.getElementById('emp-email');
const empDeptIdSelect   = document.getElementById('emp-dept-id');
const empFormTitle      = document.getElementById('emp-form-title');
const empSubmitBtn      = document.getElementById('emp-submit-btn');
const empCancelBtn      = document.getElementById('emp-cancel-btn');

const searchEmpIdInput    = document.getElementById('search-emp-id');
const searchEmpEmailInput = document.getElementById('search-emp-email');
const empDetailResult     = document.getElementById('emp-detail-result');

const searchEmpIdBtn    = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(2) .btn-success');
const searchEmpEmailBtn = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(3) .btn-success');

const empListBody    = document.getElementById('emp-list');
const empLoading     = document.getElementById('emp-loading');
const empRefreshBtn  = document.querySelector('#emp-section .list-header .btn-info');
const empWithDeptBtn = document.querySelector('#emp-section .list-header .btn-secondary');
const empTableHeader = document.querySelector('#emp-section table thead');


// ============================================================
// 렌더링 함수 — v1과 동일
// ============================================================

/**
 * 직원 목록을 테이블에 렌더링합니다.
 *
 * [Optional Chaining ?.] emp.departmentDto?.departmentName
 * [Nullish Coalescing ??] ?? 'N/A'
 * [Default Parameter] withDept = false
 *
 * @param {Array}   employees
 * @param {boolean} withDept - true: 부서명 표시, false: 부서 ID 표시
 */
const renderEmployeeList = (employees, withDept = false) => {
    if (!employees || employees.length === 0) {
        empListBody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;">표시할 직원이 없습니다.</td></tr>';
        return;
    }

    // withDept 여부에 따라 5번째 헤더 컬럼을 동적으로 변경합니다.
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

    const rows = employees.map((emp) => {
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

/**
 * 단건 조회 결과를 화면에 표시합니다.
 * @param {object|null} employee
 */
const renderEmployeeDetail = (employee) => {
    if (!employee) {
        empDetailResult.style.display = 'none';
        return;
    }

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
 * 로딩 인디케이터 표시/숨김
 * @param {boolean} isLoading
 */
const showEmpLoading = (isLoading) => {
    empLoading.style.display = isLoading ? 'block' : 'none';
};

/**
 * 직원 폼의 부서 드롭다운을 채웁니다.
 * @param {Array} departments
 */
const populateDeptDropdown = (departments) => {
    empDeptIdSelect.innerHTML = '<option value="">부서를 선택하세요...</option>';
    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        empDeptIdSelect.appendChild(option);
    });
};


// ============================================================
// 폼 관련 함수 — v1과 동일
// ============================================================

const resetEmpForm = () => {
    empForm.reset();
    empIdInput.value           = '';
    empFormTitle.textContent   = '직원 등록';
    empSubmitBtn.textContent   = '직원 생성';
    empCancelBtn.style.display = 'none';
};

/**
 * 수정 모드로 폼을 설정합니다.
 * [Destructuring] { id, firstName, lastName, email, departmentId } = employee
 * @param {object} employee
 */
const setupEmpEditForm = (employee) => {
    const { id, firstName, lastName, email, departmentId } = employee;

    empIdInput.value        = id;
    empFirstNameInput.value = firstName;
    empLastNameInput.value  = lastName;
    empEmailInput.value     = email;
    empDeptIdSelect.value   = departmentId;

    empFormTitle.textContent   = '직원 수정';
    empSubmitBtn.textContent   = '수정 저장';
    empCancelBtn.style.display = 'inline-block';

    empForm.scrollIntoView({ behavior: 'smooth' });
};


// ============================================================
// 데이터 로드 + 렌더링 통합 함수 — API 호출만 v2 방식으로 변경
// ============================================================

/**
 * 직원 목록을 가져와 테이블을 갱신합니다. (기본 조회)
 *
 * ★ v1 vs v2 API 호출 비교:
 *   v1: const employees = await getAllEmployees();
 *   v2: const employees = await employeeApi.getAll();
 */
const loadAndRenderEmployees = async () => {
    showEmpLoading(true);

    // [클래스 메서드 호출] employeeApi 인스턴스의 getAll() 메서드를 호출합니다.
    // v1: await getAllEmployees()
    // v2: await employeeApi.getAll()
    const employees = await employeeApi.getAll();

    showEmpLoading(false);
    renderEmployeeList(employees, false);
};

/**
 * 직원+부서 통합 목록을 가져와 테이블을 갱신합니다.
 *
 * ★ v1: await getAllEmployeesWithDepartments()
 * ★ v2: await employeeApi.getAllWithDepartments()
 */
const loadAndRenderEmployeesWithDept = async () => {
    showEmpLoading(true);

    // v1: await getAllEmployeesWithDepartments()
    // v2: await employeeApi.getAllWithDepartments()
    const employees = await employeeApi.getAllWithDepartments();

    showEmpLoading(false);
    renderEmployeeList(employees, true);
};


// ============================================================
// 이벤트 핸들러 — API 호출만 v2 방식으로 변경
// ============================================================

/**
 * 폼 제출 처리 (생성/수정 분기)
 * [Shorthand Property] { firstName, lastName, email, departmentId }
 * @param {Event} e
 */
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

    const employeeData = { firstName, lastName, email, departmentId };

    if (id) {
        // ★ v1: await updateEmployee(id, employeeData)
        // ★ v2: await employeeApi.update(id, employeeData)
        const result = await employeeApi.update(id, employeeData);
        if (result) {
            showMessage('직원 정보가 성공적으로 수정되었습니다.');
            resetEmpForm();
            await loadAndRenderEmployees();
        }
    } else {
        // ★ v1: await createEmployee(employeeData)
        // ★ v2: await employeeApi.create(employeeData)
        const result = await employeeApi.create(employeeData);
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

    // ★ v1: await getEmployeeById(id)
    // ★ v2: await employeeApi.getById(id)
    const employee = await employeeApi.getById(id);

    if (!employee) {
        showMessage('해당 ID의 직원이 존재하지 않습니다.', true);
        empDetailResult.style.display = 'none';
        return;
    }
    renderEmployeeDetail(employee);
};

/**
 * 이메일로 직원 조회 버튼 클릭 처리
 * 이메일의 '@' 기호는 URL에 그대로 포함합니다.
 */
const handleSearchEmpByEmail = async () => {
    const email = searchEmpEmailInput.value.trim();
    if (!email) {
        showMessage('조회할 직원 이메일을 입력해주세요.', true);
        return;
    }

    // ★ v1: await getEmployeeByEmail(email)
    // ★ v2: await employeeApi.getByEmail(email)
    const employee = await employeeApi.getByEmail(email);

    if (!employee) {
        showMessage('해당 이메일의 직원이 존재하지 않습니다.', true);
        empDetailResult.style.display = 'none';
        return;
    }
    renderEmployeeDetail(employee);
};

/**
 * 테이블 수정/삭제 버튼 클릭 처리 (이벤트 위임)
 * [Destructuring] const { action, id } = e.target.dataset
 * @param {Event} e
 */
const handleEmpListClick = async (e) => {
    const { action, id } = e.target.dataset;
    if (!action || !id) return;

    if (action === 'edit') {
        const employee = JSON.parse(e.target.dataset.employee);
        setupEmpEditForm(employee);

    } else if (action === 'delete') {
        if (confirm(`정말로 ID ${id} 직원을 삭제하시겠습니까?`)) {
            // ★ v1: await deleteEmployee(id)
            // ★ v2: await employeeApi.delete(id)
            const ok = await employeeApi.delete(id);
            if (ok) {
                showMessage('직원이 삭제되었습니다.');
                await loadAndRenderEmployees();
            }
        }
    }
};


// ============================================================
// 직원 탭 초기화 — API 호출만 v2 방식으로 변경
// ============================================================

let isInitialized = false;

/**
 * 직원 관리 탭이 처음 열릴 때 한 번만 실행됩니다.
 * isInitialized 플래그로 중복 실행을 방지합니다.
 *
 * ★ v1: const departments = await getAllDepartments()
 * ★ v2: const departments = await departmentApi.getAll()
 */
const initEmployeeTab = async () => {
    if (isInitialized) return;

    // 부서 드롭다운 채우기
    // ★ v1: const departments = await getAllDepartments()
    // ★ v2: const departments = await departmentApi.getAll()
    const departments = await departmentApi.getAll();
    populateDeptDropdown(departments);

    // 직원 목록 첫 로드
    await loadAndRenderEmployees();

    // 이벤트 리스너 7개 등록
    empForm.addEventListener('submit', handleEmpFormSubmit);
    empCancelBtn.addEventListener('click', resetEmpForm);
    searchEmpIdBtn.addEventListener('click', handleSearchEmpById);
    searchEmpEmailBtn.addEventListener('click', handleSearchEmpByEmail);
    empListBody.addEventListener('click', handleEmpListClick);
    empRefreshBtn.addEventListener('click', loadAndRenderEmployees);
    empWithDeptBtn.addEventListener('click', loadAndRenderEmployeesWithDept);

    isInitialized = true;
    console.log('[emp_runner_v2] 직원 탭 초기화 완료');
};


// ============================================================
// [중요] 전역 등록 — v1과 동일
// ============================================================
// ES Module의 함수는 모듈 스코프이므로 index.html의 showTab()에서 접근하려면
// window 객체에 명시적으로 등록해야 합니다.
window.initEmployeeTab = initEmployeeTab;
