/**
 * @file dept_runner_v2.js
 * @description
 * departmentApi.js [버전 2 - 클래스형]을 사용하는 부서 관리 UI 연결 파일입니다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  dept_runner_v1.js 와 비교해서 달라진 부분은 딱 2곳입니다.      │
 * │                                                                  │
 * │  1. import 방식                                                  │
 * │     v1: import { getAllDepartments, ... }  ← 함수를 직접 import  │
 * │     v2: import { DepartmentApi }           ← 클래스를 import     │
 * │                                                                  │
 * │  2. API 호출 방식                                                │
 * │     v1: getAllDepartments()                ← 함수 직접 호출      │
 * │     v2: departmentApi.getAll()            ← 인스턴스.메서드()    │
 * │                                                                  │
 * │  나머지 렌더링/이벤트 코드는 v1과 완전히 동일합니다.            │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * index.html 연결 방법:
 *   <script type="module" src="js/dept_runner_v2.js"></script>
 */

// ============================================================
// [import] ★ v1과 달라진 첫 번째 부분
// ============================================================

// [v1 방식] 함수 5개를 각각 import
// import {
//     getAllDepartments,
//     getDepartmentById,
//     createDepartment,
//     updateDepartment,
//     deleteDepartment,
// } from './api/departmentApi.js';

// [v2 방식] DepartmentApi 클래스 하나만 import
// 클래스 안에 5개 메서드가 모두 들어있으므로 한 줄로 가져올 수 있습니다.
import { DepartmentApi } from './api/departmentApi.js';

// utils.js는 v1과 동일하게 가져옵니다.
import { escapeHTML, showMessage } from './utils.js';


// ============================================================
// [인스턴스 생성] ★ v1과 달라진 두 번째 부분
// ============================================================

// [class 인스턴스] new 키워드로 DepartmentApi 클래스의 실제 사용 객체를 만듭니다.
//
// 클래스(Class) = 설계도
// 인스턴스(Instance) = 설계도로 만든 실제 물건
//
// v1: 함수를 바로 호출 → getAllDepartments()
// v2: 인스턴스를 만들고 → 메서드를 호출 → departmentApi.getAll()
//
// departmentApi 는 이 파일 전체에서 공유되는 하나의 API 통신 객체입니다.
const departmentApi = new DepartmentApi();


// ============================================================
// DOM 요소 캐싱 — v1과 동일
// ============================================================

const deptForm       = document.getElementById('dept-form');
const deptIdInput    = document.getElementById('dept-id');
const deptNameInput  = document.getElementById('dept-name');
const deptDescInput  = document.getElementById('dept-desc');
const deptFormTitle  = document.getElementById('dept-form-title');
const deptSubmitBtn  = document.getElementById('dept-submit-btn');
const deptCancelBtn  = document.getElementById('dept-cancel-btn');

const searchDeptSelect = document.getElementById('search-dept-id');
const deptDetailResult = document.getElementById('dept-detail-result');

const deptListBody = document.getElementById('dept-list');
const deptLoading  = document.getElementById('dept-loading');

const searchDeptBtn = document.querySelector('#dept-section .card:nth-child(2) .btn-success');
const refreshBtn    = document.querySelector('#dept-section .list-header .btn-info');


// ============================================================
// 렌더링 함수 — v1과 동일
// ============================================================

/**
 * 부서 목록을 테이블에 렌더링합니다.
 * @param {Array} departments - 서버에서 받은 부서 배열
 */
const renderDepartmentList = (departments) => {
    if (!departments || departments.length === 0) {
        deptListBody.innerHTML =
            '<tr><td colspan="4" style="text-align:center;">표시할 부서가 없습니다.</td></tr>';
        return;
    }

    // [Array.map() + Template Literal] 부서 배열 → HTML 행으로 변환
    const rows = departments.map((dept) => `
        <tr>
            <td>${dept.id}</td>
            <td>${escapeHTML(dept.departmentName)}</td>
            <td>${escapeHTML(dept.departmentDescription)}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm"
                        data-id="${dept.id}"
                        data-action="edit"
                        data-department='${JSON.stringify(dept)}'>수정</button>
                <button class="btn btn-danger btn-sm"
                        data-id="${dept.id}"
                        data-action="delete">삭제</button>
            </td>
        </tr>
    `);

    deptListBody.innerHTML = rows.join('');
};

/**
 * 단건 조회 결과를 화면에 표시합니다.
 * @param {object|null} department - 조회된 부서 객체
 */
const renderDepartmentDetail = (department) => {
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
};

/**
 * 조회용 드롭다운을 부서 목록으로 채웁니다.
 * @param {Array} departments - 부서 배열
 */
const populateSearchDropdown = (departments) => {
    searchDeptSelect.innerHTML = '<option value="">조회할 부서를 선택하세요...</option>';
    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        searchDeptSelect.appendChild(option);
    });
};

/**
 * 로딩 인디케이터를 표시하거나 숨깁니다.
 * @param {boolean} isLoading
 */
const showLoading = (isLoading) => {
    deptLoading.style.display = isLoading ? 'block' : 'none';
};


// ============================================================
// 폼 관련 함수 — v1과 동일
// ============================================================

const resetDeptForm = () => {
    deptForm.reset();
    deptIdInput.value           = '';
    deptFormTitle.textContent   = '부서 등록';
    deptSubmitBtn.textContent   = '부서 생성';
    deptCancelBtn.style.display = 'none';
};

/**
 * 수정 모드로 폼을 설정합니다.
 * [Destructuring] 부서 객체에서 필요한 값만 꺼냅니다.
 * @param {object} department
 */
const setupEditForm = (department) => {
    const { id, departmentName, departmentDescription } = department;

    deptIdInput.value    = id;
    deptNameInput.value  = departmentName;
    deptDescInput.value  = departmentDescription;

    deptFormTitle.textContent   = '부서 수정';
    deptSubmitBtn.textContent   = '수정 저장';
    deptCancelBtn.style.display = 'inline-block';

    window.scrollTo(0, 0);
};


// ============================================================
// 데이터 로드 + 렌더링 통합 함수 — API 호출만 v2 방식으로 변경
// ============================================================

/**
 * 서버에서 부서 목록을 가져와 테이블과 드롭다운을 갱신합니다.
 *
 * ★ v1 vs v2 API 호출 비교:
 *   v1: const departments = await getAllDepartments();
 *   v2: const departments = await departmentApi.getAll();
 *       └── departmentApi = new DepartmentApi() 로 만든 인스턴스
 *       └── getAll() = DepartmentApi 클래스의 메서드
 */
const loadAndRenderDepartments = async () => {
    showLoading(true);

    // [클래스 메서드 호출] 인스턴스.메서드() 형태로 호출합니다.
    // v1: await getAllDepartments()
    // v2: await departmentApi.getAll()
    const departments = await departmentApi.getAll();

    showLoading(false);
    renderDepartmentList(departments);
    populateSearchDropdown(departments);
};


// ============================================================
// 이벤트 핸들러 — API 호출만 v2 방식으로 변경
// ============================================================

/**
 * 폼 제출 처리 (생성/수정 분기)
 * [Shorthand Property] { departmentName, departmentDescription }
 * @param {Event} e
 */
const handleFormSubmit = async (e) => {
    e.preventDefault();

    const id                    = deptIdInput.value;
    const departmentName        = deptNameInput.value.trim();
    const departmentDescription = deptDescInput.value.trim();

    if (!departmentName || !departmentDescription) {
        showMessage('부서명과 부서 설명을 모두 입력해주세요.', true);
        return;
    }

    const departmentData = { departmentName, departmentDescription };

    if (id) {
        // ★ v1: await updateDepartment(id, departmentData)
        // ★ v2: await departmentApi.update(id, departmentData)
        const result = await departmentApi.update(id, departmentData);
        if (result) {
            showMessage('부서 정보가 성공적으로 수정되었습니다.');
            resetDeptForm();
            await loadAndRenderDepartments();
        }
    } else {
        // ★ v1: await createDepartment(departmentData)
        // ★ v2: await departmentApi.create(departmentData)
        const result = await departmentApi.create(departmentData);
        if (result) {
            showMessage('부서가 성공적으로 생성되었습니다.');
            resetDeptForm();
            await loadAndRenderDepartments();
        }
    }
};

/**
 * 드롭다운 조회 버튼 클릭 처리
 */
const handleSearchById = async () => {
    const id = searchDeptSelect.value;

    if (!id) {
        showMessage('조회할 부서를 선택해주세요.', true);
        return;
    }

    // ★ v1: await getDepartmentById(id)
    // ★ v2: await departmentApi.getById(id)
    const department = await departmentApi.getById(id);

    if (!department) {
        showMessage('해당 ID의 부서가 존재하지 않습니다.', true);
        deptDetailResult.style.display = 'none';
        return;
    }

    renderDepartmentDetail(department);
};

/**
 * 테이블 수정/삭제 버튼 클릭 처리 (이벤트 위임)
 * [Destructuring] e.target.dataset 에서 action, id 추출
 * @param {Event} e
 */
const handleListClick = async (e) => {
    const { action, id } = e.target.dataset;
    if (!action || !id) return;

    if (action === 'edit') {
        const department = JSON.parse(e.target.dataset.department);
        setupEditForm(department);

    } else if (action === 'delete') {
        if (confirm(`정말로 ID ${id} 부서를 삭제하시겠습니까?`)) {
            // ★ v1: await deleteDepartment(id)
            // ★ v2: await departmentApi.delete(id)
            const ok = await departmentApi.delete(id);
            if (ok) {
                showMessage('부서가 삭제되었습니다.');
                await loadAndRenderDepartments();
            }
        }
    }
};


// ============================================================
// 초기화 (이벤트 리스너 등록 + 첫 데이터 로드) — v1과 동일
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    deptForm.addEventListener('submit', handleFormSubmit);
    searchDeptBtn.addEventListener('click', handleSearchById);
    deptListBody.addEventListener('click', handleListClick);
    deptCancelBtn.addEventListener('click', resetDeptForm);
    refreshBtn.addEventListener('click', loadAndRenderDepartments);

    loadAndRenderDepartments(); // 페이지 로드 시 첫 데이터 로드
});
