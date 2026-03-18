// =================
// 직원 관리 전역 변수 및 상수
// =================
// API_BASE_URL은 department.js에 이미 선언되어 있다고 가정합니다.
// 만약 파일을 분리하여 단독으로 사용할 경우 아래 주석을 해제하세요.
// const API_BASE_URL = 'http://localhost:8080/api';


// =================
// 직원 관리 DOM 요소 캐싱
// =================
const empForm = document.getElementById('emp-form');
const empIdInput = document.getElementById('emp-id');
const empFirstNameInput = document.getElementById('emp-firstname');
const empLastNameInput = document.getElementById('emp-lastname');
const empEmailInput = document.getElementById('emp-email');
const empDeptIdInput = document.getElementById('emp-dept-id');
const empFormTitle = document.getElementById('emp-form-title');
const empSubmitBtn = document.getElementById('emp-submit-btn');
const empCancelBtn = document.getElementById('emp-cancel-btn');

const searchEmpIdInput = document.getElementById('search-emp-id');
const searchEmpIdBtn = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(2) .btn-success');
const searchEmpEmailInput = document.getElementById('search-emp-email');
const searchEmpEmailBtn = document.querySelector('#emp-section .card:nth-child(2) .form-inline:nth-child(3) .btn-success');
const empDetailResult = document.getElementById('emp-detail-result');

const empListBody = document.getElementById('emp-list');
const empLoading = document.getElementById('emp-loading');
const empRefreshBtn = document.querySelector('#emp-section .list-header .btn-info');
const empWithDeptBtn = document.querySelector('#emp-section .list-header .btn-secondary');

// =============================
// 직원 API 통신 함수 (Data Layer)
// =============================

/**
 * 모든 직원 목록을 서버에서 가져옵니다. (기본)
 */
async function fetchAllEmployees() {
    showEmpLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching employees:', error);
        handleApiError(error); // department.js의 공통 에러 핸들러 사용
        return [];
    } finally {
        showEmpLoading(false);
    }
}

/**
 * 모든 직원 목록을 부서 정보와 함께 서버에서 가져옵니다.
 */
async function fetchAllEmployeesWithDepartments() {
    showEmpLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/employees/departments`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching employees with departments:', error);
        handleApiError(error);
        return [];
    } finally {
        showEmpLoading(false);
    }
}

/**
 * ID로 특정 직원 정보를 가져옵니다.
 * @param {number} id - 조회할 직원 ID
 */
async function fetchEmployeeById(id) {
    showEmpLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`);
        if (response.status === 404) {
            showMessage('해당 ID의 직원이 존재하지 않습니다.', true);
            return null;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching employee ${id}:`, error);
        handleApiError(error);
        return null;
    } finally {
        showEmpLoading(false);
    }
}

/**
 * 이메일로 특정 직원 정보를 가져옵니다.
 * @param {string} email - 조회할 직원 이메일
 */
async function fetchEmployeeByEmail(email) {
    showEmpLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/employees/email/${email}`);
        if (response.status === 404) {
            showMessage('해당 이메일의 직원이 존재하지 않습니다.', true);
            return null;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching employee with email ${email}:`, error);
        handleApiError(error);
        return null;
    } finally {
        showEmpLoading(false);
    }
}

/**
 * 새 직원을 생성합니다.
 * @param {object} employeeData - { firstName, lastName, email, departmentId }
 */
async function createEmployee(employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        showMessage('직원이 성공적으로 생성되었습니다.');
        resetEmpForm();
        loadAndRenderEmployees(); // 목록 자동 갱신
    } catch (error) {
        console.error('Error creating employee:', error);
        handleApiError(error);
    }
}

/**
 * 기존 직원 정보를 수정합니다.
 * @param {number} id - 수정할 직원 ID
 * @param {object} employeeData - { firstName, lastName, email, departmentId }
 */
async function updateEmployee(id, employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        showMessage('직원 정보가 성공적으로 수정되었습니다.');
        resetEmpForm();
        loadAndRenderEmployees(); // 목록 자동 갱신
    } catch (error) {
        console.error(`Error updating employee ${id}:`, error);
        handleApiError(error);
    }
}

/**
 * 직원을 삭제합니다.
 * @param {number} id - 삭제할 직원 ID
 */
async function deleteEmployee(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        showMessage('직원이 삭제되었습니다.');
        loadAndRenderEmployees(); // 목록 자동 갱신
    } catch (error) {
        console.error(`Error deleting employee ${id}:`, error);
        handleApiError(error);
    }
}


// ====================================
// 렌더링 및 UI 조작 함수 (Presentation Layer)
// ====================================

/**
 * 직원 목록을 테이블에 렌더링합니다.
 * @param {Array<object>} employees - 직원 데이터 배열
 * @param {boolean} withDept - 부서 정보 포함 여부
 */
function renderEmployeeList(employees, withDept = false) {
    empListBody.innerHTML = '';
    if (!employees || employees.length === 0) {
        empListBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">표시할 직원이 없습니다.</td></tr>`;
        return;
    }

    // 헤더 변경
    const tableHeader = empListBody.parentElement.querySelector('thead');
    if (withDept) {
        tableHeader.innerHTML = `
            <tr>
                <th>ID</th>
                <th>이름</th>
                <th>성</th>
                <th>이메일</th>
                <th>부서명</th>
                <th>작업</th>
            </tr>
        `;
    } else {
        tableHeader.innerHTML = `
            <tr>
                <th>ID</th>
                <th>이름</th>
                <th>성</th>
                <th>이메일</th>
                <th>부서 ID</th>
                <th>작업</th>
            </tr>
        `;
    }
    
    employees.forEach(emp => {
        const row = document.createElement('tr');
        const departmentInfo = withDept 
            ? escapeHTML(emp.departmentDto?.departmentName || 'N/A')
            : emp.departmentId;

        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${escapeHTML(emp.firstName)}</td>
            <td>${escapeHTML(emp.lastName)}</td>
            <td>${escapeHTML(emp.email)}</td>
            <td>${departmentInfo}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm" data-id="${emp.id}" data-action="edit">수정</button>
                <button class="btn btn-danger btn-sm" data-id="${emp.id}" data-action="delete">삭제</button>
            </td>
        `;
        row.querySelector('[data-action="edit"]').dataset.employee = JSON.stringify(emp);
        empListBody.appendChild(row);
    });
}

/**
 * 단건 조회 결과를 화면에 표시합니다.
 * @param {object} employee - 직원 데이터
 */
function renderEmployeeDetail(employee) {
    if (!employee) {
        empDetailResult.style.display = 'none';
        return;
    }
    empDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${employee.id}</p>
        <p><strong>이름:</strong> ${escapeHTML(employee.firstName)} ${escapeHTML(employee.lastName)}</p>
        <p><strong>이메일:</strong> ${escapeHTML(employee.email)}</p>
        <p><strong>부서 ID:</strong> ${employee.departmentId}</p>
    `;
    empDetailResult.style.display = 'block';
}


/**
 * 직원 목록 로딩 인디케이터를 표시하거나 숨깁니다.
 * @param {boolean} isLoading - 로딩 상태
 */
function showEmpLoading(isLoading) {
    empLoading.style.display = isLoading ? 'block' : 'none';
}


/**
 * 직원 생성/수정 폼을 초기 상태로 리셋합니다.
 */
function resetEmpForm() {
    empForm.reset();
    empIdInput.value = '';
    empFormTitle.textContent = '직원 등록';
    empSubmitBtn.textContent = '직원 생성';
    empCancelBtn.style.display = 'none';
}

/**
 * 수정 모드로 폼을 설정합니다.
 * @param {object} employee - 수정할 직원 데이터
 */
function setupEmpEditForm(employee) {
    empIdInput.value = employee.id;
    empFirstNameInput.value = employee.firstName;
    empLastNameInput.value = employee.lastName;
    empEmailInput.value = employee.email;
    empDeptIdInput.value = employee.departmentId;
    empFormTitle.textContent = '직원 수정';
    empSubmitBtn.textContent = '수정 저장';
    empCancelBtn.style.display = 'inline-block';
    empForm.scrollIntoView({ behavior: 'smooth' });
}


// ========================
// 이벤트 핸들러 (Control Layer)
// ========================

/**
 * 페이지 로드 나 새로고침 버튼 클릭 시 직원 목록을 가져와 렌더링합니다.
 */
async function loadAndRenderEmployees() {
    const employees = await fetchAllEmployees();
    renderEmployeeList(employees, false);
}

/**
 * '직원+부서 조회' 버튼 클릭 시, 부서 정보가 포함된 목록을 가져와 렌더링합니다.
 */
async function loadAndRenderEmployeesWithDept() {
    const employees = await fetchAllEmployeesWithDepartments();
    renderEmployeeList(employees, true);
}


/**
 * 직원 생성/수정 폼 제출 이벤트를 처리합니다.
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleEmpFormSubmit(e) {
    e.preventDefault();
    const id = empIdInput.value;
    const employeeData = {
        firstName: empFirstNameInput.value.trim(),
        lastName: empLastNameInput.value.trim(),
        email: empEmailInput.value.trim(),
        departmentId: empDeptIdInput.value,
    };

    if (!employeeData.firstName || !employeeData.lastName || !employeeData.email || !employeeData.departmentId) {
        showMessage('모든 필드를 입력해주세요.', true);
        return;
    }
    if (employeeData.departmentId <= 0) {
        showMessage('유효한 부서 ID를 입력해주세요.', true);
        return;
    }

    if (id) {
        await updateEmployee(id, employeeData);
    } else {
        await createEmployee(employeeData);
    }
}

/**
 * ID로 직원 조회 버튼 클릭 이벤트를 처리합니다.
 */
async function handleSearchEmpById() {
    const id = searchEmpIdInput.value;
    if (!id) {
        showMessage('조회할 직원 ID를 입력해주세요.', true);
        return;
    }
    const employee = await fetchEmployeeById(id);
    renderEmployeeDetail(employee);
}

/**
 * 이메일로 직원 조회 버튼 클릭 이벤트를 처리합니다.
 */
async function handleSearchEmpByEmail() {
    const email = searchEmpEmailInput.value;
    if (!email) {
        showMessage('조회할 직원 이메일을 입력해주세요.', true);
        return;
    }
    const employee = await fetchEmployeeByEmail(email);
    renderEmployeeDetail(employee);
}

/**
 * 직원 목록의 버튼(수정/삭제) 클릭 이벤트를 처리합니다.
 * @param {Event} e - 클릭 이벤트
 */
function handleEmpListClick(e) {
    const target = e.target;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (!action || !id) return;

    if (action === 'edit') {
        const employee = JSON.parse(target.dataset.employee);
        setupEmpEditForm(employee);
    } else if (action === 'delete') {
        if (confirm(`정말로 ID ${id} 직원을 삭제하시겠습니까?`)) {
            deleteEmployee(id);
        }
    }
}

/**
 * 직원 관리 탭 기능 초기화 함수
 */
async function initEmployeeTab() {
    // 이벤트 리스너가 중복 등록되는 것을 방지하기 위해 한번만 실행되도록 플래그 사용
    if (initEmployeeTab.initialized) return;

    await populateDepartmentDropdown(); // 부서 드롭다운 채우기
    loadAndRenderEmployees(); // 초기 데이터 로드

    empForm.addEventListener('submit', handleEmpFormSubmit);
    empCancelBtn.addEventListener('click', resetEmpForm);
    
    searchEmpIdBtn.addEventListener('click', handleSearchEmpById);
    searchEmpEmailBtn.addEventListener('click', handleSearchEmpByEmail);
    
    empListBody.addEventListener('click', handleEmpListClick);
    empRefreshBtn.addEventListener('click', loadAndRenderEmployees);
    empWithDeptBtn.addEventListener('click', loadAndRenderEmployeesWithDept);
    
    initEmployeeTab.initialized = true;
    console.log("Employee tab initialized.");
}

/**
 * 부서 목록을 가져와 직원 폼의 드롭다운을 채웁니다.
 */
async function populateDepartmentDropdown() {
    // fetchAllDepartments 함수는 department.js에 이미 존재하므로,
    // 여기서는 간단하게 fetch를 직접 사용하여 부서 목록만 가져옵니다.
    try {
        const response = await fetch(`${API_BASE_URL}/departments`);
        if (!response.ok) throw new Error('부서 목록을 불러오는 데 실패했습니다.');
        
        const departments = await response.json();
        
        empDeptIdInput.innerHTML = '<option value="">부서를 선택하세요...</option>'; // 기존 옵션 초기화
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
            empDeptIdInput.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating department dropdown:', error);
        handleApiError(error);
    }
}
