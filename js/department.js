// ===============
// 전역 변수 및 상수
// ===============
const API_BASE_URL = 'http://localhost:8080/api';

// ===============
// DOM 요소 캐싱
// ===============
const deptForm = document.getElementById('dept-form');
const deptIdInput = document.getElementById('dept-id');
const deptNameInput = document.getElementById('dept-name');
const deptDescInput = document.getElementById('dept-desc');
const deptFormTitle = document.getElementById('dept-form-title');
const deptSubmitBtn = document.getElementById('dept-submit-btn');
const deptCancelBtn = document.getElementById('dept-cancel-btn');

const searchDeptIdInput = document.getElementById('search-dept-id');
const searchDeptBtn = document.querySelector('#dept-section .card:nth-child(2) .btn-success');
const deptDetailResult = document.getElementById('dept-detail-result');

const deptListBody = document.getElementById('dept-list');
const deptLoading = document.getElementById('dept-loading');
const refreshBtn = document.querySelector('#dept-section .list-header .btn-info');

const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');

// =================
// API 통신 함수 (Data Layer)
// =================

/**
 * 모든 부서 목록을 서버에서 가져옵니다.
 */
async function fetchAllDepartments() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/departments`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching departments:', error);
        handleApiError(error);
        return []; // 오류 발생 시 빈 배열 반환
    } finally {
        showLoading(false);
    }
}

/**
 * ID로 특정 부서 정보를 가져옵니다.
 * @param {number} id - 조회할 부서 ID
 */
async function fetchDepartmentById(id) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/departments/${id}`);
        if (response.status === 404) {
            showMessage('해당 ID의 부서가 존재하지 않습니다.', true);
            return null;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching department ${id}:`, error);
        handleApiError(error);
        return null;
    } finally {
        showLoading(false);
    }
}

/**
 * 새 부서를 생성합니다.
 * @param {object} departmentData - { departmentName, departmentDescription }
 */
async function createDepartment(departmentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(departmentData),
        });
        if (!response.ok) {
            // 400 Bad Request와 같은 오류 메시지를 서버로부터 받기 위함
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        showMessage('부서가 성공적으로 생성되었습니다.');
        resetForm();
        loadAndRenderDepartments(); // 목록 자동 갱신
    } catch (error) {
        console.error('Error creating department:', error);
        handleApiError(error);
    }
}

/**
 * 기존 부서 정보를 수정합니다.
 * @param {number} id - 수정할 부서 ID
 * @param {object} departmentData - { departmentName, departmentDescription }
 */
async function updateDepartment(id, departmentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(departmentData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        showMessage('부서 정보가 성공적으로 수정되었습니다.');
        resetForm();
        loadAndRenderDepartments(); // 목록 자동 갱신
    } catch (error) {
        console.error(`Error updating department ${id}:`, error);
        handleApiError(error);
    }
}

/**
 * 부서를 삭제합니다.
 * @param {number} id - 삭제할 부서 ID
 */
async function deleteDepartment(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        showMessage('부서가 삭제되었습니다.');
        loadAndRenderDepartments(); // 목록 자동 갱신
    } catch (error) {
        console.error(`Error deleting department ${id}:`, error);
        handleApiError(error);
    }
}

// ======================
// 렌더링 및 UI 조작 함수 (Presentation Layer)
// ======================

/**
 * 부서 목록을 테이블에 렌더링합니다.
 * @param {Array<object>} departments - 부서 데이터 배열
 */
function renderDepartmentList(departments) {
    deptListBody.innerHTML = ''; // 기존 목록 초기화
    if (!departments || departments.length === 0) {
        deptListBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">표시할 부서가 없습니다.</td></tr>';
        return;
    }
    departments.forEach(dept => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dept.id}</td>
            <td>${escapeHTML(dept.departmentName)}</td>
            <td>${escapeHTML(dept.departmentDescription)}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm" data-id="${dept.id}" data-action="edit">수정</button>
                <button class="btn btn-danger btn-sm" data-id="${dept.id}" data-action="delete">삭제</button>
            </td>
        `;
        // '수정'과 '삭제' 버튼에 대한 원본 데이터를 저장
        row.querySelector('[data-action="edit"]').dataset.department = JSON.stringify(dept);
        deptListBody.appendChild(row);
    });
}

/**
 * 단건 조회 결과를 화면에 표시합니다.
 * @param {object} department - 부서 데이터
 */
function renderDepartmentDetail(department) {
    if (!department) {
        deptDetailResult.style.display = 'none';
        return;
    }
    deptDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${department.id}</p>
        <p><strong>부서명:</strong> ${escapeHTML(department.departmentName)}</p>
        <p><strong>부서 설명:</strong> ${escapeHTML(department.departmentDescription)}</p>
    `;
    deptDetailResult.style.display = 'block';
}

/**
 * 로딩 인디케이터를 표시하거나 숨깁니다.
 * @param {boolean} isLoading - 로딩 상태
 */
function showLoading(isLoading) {
    deptLoading.style.display = isLoading ? 'block' : 'none';
}

/**
 * 성공 또는 오류 메시지를 잠시 보여줍니다.
 * @param {string} message - 표시할 메시지
 * @param {boolean} isError - 오류 메시지 여부
 */
function showMessage(message, isError = false) {
    const alertBox = isError ? alertError : alertSuccess;
    alertBox.textContent = message;
    alertBox.classList.add('show');
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 3000);
}

/**
 * XSS 공격 방지를 위해 HTML 태그를 이스케이프 처리합니다.
 * @param {string} str - 원본 문자열
 */
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

/**
 * 부서 생성/수정 폼을 초기 상태로 리셋합니다.
 */
function resetForm() {
    deptForm.reset();
    deptIdInput.value = '';
    deptFormTitle.textContent = '부서 등록';
    deptSubmitBtn.textContent = '부서 생성';
    deptCancelBtn.style.display = 'none';
}

/**
 * 수정 모드로 폼을 설정합니다.
 * @param {object} department - 수정할 부서 데이터
 */
function setupEditForm(department) {
    deptIdInput.value = department.id;
    deptNameInput.value = department.departmentName;
    deptDescInput.value = department.departmentDescription;
    deptFormTitle.textContent = '부서 수정';
    deptSubmitBtn.textContent = '수정 저장';
    deptCancelBtn.style.display = 'inline-block';
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
}

/**
 * API 에러를 적절한 사용자 메시지로 변환하여 표시합니다.
 * @param {Error} error - 발생한 에러 객체
 */
function handleApiError(error) {
    if (error.message.includes('Failed to fetch')) {
        showMessage('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인하세요.', true);
    } else {
        showMessage(error.message, true);
    }
}


// ==================
// 이벤트 핸들러 (Control Layer)
// ==================

/**
 * 페이지 로드 시 부서 목록을 가져와 렌더링합니다.
 */
async function loadAndRenderDepartments() {
    const departments = await fetchAllDepartments();
    renderDepartmentList(departments);
}

/**
 * 부서 생성/수정 폼 제출 이벤트를 처리합니다.
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const id = deptIdInput.value;
    const departmentData = {
        departmentName: deptNameInput.value.trim(),
        departmentDescription: deptDescInput.value.trim(),
    };

    // 유효성 검사
    if (!departmentData.departmentName || !departmentData.departmentDescription) {
        showMessage('부서명과 부서 설명을 모두 입력해주세요.', true);
        return;
    }

    if (id) {
        // ID가 있으면 수정 모드
        await updateDepartment(id, departmentData);
    } else {
        // ID가 없으면 생성 모드
        await createDepartment(departmentData);
    }
}

/**
 * ID로 부서 조회 버튼 클릭 이벤트를 처리합니다.
 */
async function handleSearchById() {
    const id = searchDeptIdInput.value;
    if (!id) {
        showMessage('조회할 부서 ID를 입력해주세요.', true);
        return;
    }
    const department = await fetchDepartmentById(id);
    renderDepartmentDetail(department);
}

/**
 * 부서 목록의 버튼(수정/삭제) 클릭 이벤트를 처리합니다.
 * @param {Event} e - 클릭 이벤트
 */
function handleListClick(e) {
    const target = e.target;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (!action || !id) return;

    if (action === 'edit') {
        const department = JSON.parse(target.dataset.department);
        setupEditForm(department);
    } else if (action === 'delete') {
        if (confirm(`정말로 ID ${id} 부서를 삭제하시겠습니까?`)) {
            deleteDepartment(id);
        }
    }
}

// ==================
// 이벤트 리스너 연결
// ==================
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderDepartments(); // 페이지가 로드되면 바로 목록 조회

    deptForm.addEventListener('submit', handleFormSubmit);
    searchDeptBtn.addEventListener('click', handleSearchById);
    deptListBody.addEventListener('click', handleListClick);
    deptCancelBtn.addEventListener('click', resetForm);
    refreshBtn.addEventListener('click', loadAndRenderDepartments);
});
