/**
 * @file dept_runner_v1.js
 * @description
 * departmentApi.js [버전 1 - 함수형]을 사용하는 부서 관리 UI 연결 파일입니다.
 *
 * 이 파일의 역할:
 *   1. departmentApi.js (버전 1) 의 함수를 import하여 서버와 통신합니다.
 *   2. 서버에서 받은 데이터를 HTML 테이블/폼에 렌더링합니다.
 *   3. 버튼/폼 이벤트를 연결합니다.
 *
 * 기존 department.js와의 차이:
 *   - API 통신 코드가 없습니다. (departmentApi.js 가 담당)
 *   - import/export 로 모듈 간 의존성을 명확히 표현합니다.
 *   - var 대신 const/let, Arrow Function, Template Literal 등 ES 문법을 사용합니다.
 *
 * index.html 연결 방법:
 *   <script type="module" src="js/dept_runner_v1.js"></script>
 */

// ============================================================
// [import] 다른 모듈에서 필요한 함수를 가져옵니다.
// ============================================================

// [named import] departmentApi.js 버전 1의 함수들을 이름으로 골라서 가져옵니다.
// 이전(department.js): 같은 파일 안에 fetch 코드가 있었음
// 변경(v2.0): 별도 파일의 함수를 import해서 사용
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from './api/departmentApi.js';

// [named import] utils.js에서 공통 함수를 가져옵니다.
import { escapeHTML, showMessage } from './utils.js';


// ============================================================
// DOM 요소 캐싱 (HTML 요소를 변수에 저장)
// ============================================================
// [const] 재할당이 없는 DOM 참조는 const로 선언합니다.

const deptForm       = document.getElementById('dept-form');
const deptIdInput    = document.getElementById('dept-id');       // hidden: 수정 시 ID 보관
const deptNameInput  = document.getElementById('dept-name');
const deptDescInput  = document.getElementById('dept-desc');
const deptFormTitle  = document.getElementById('dept-form-title');
const deptSubmitBtn  = document.getElementById('dept-submit-btn');
const deptCancelBtn  = document.getElementById('dept-cancel-btn');

const searchDeptSelect  = document.getElementById('search-dept-id');      // 조회용 드롭다운
const deptDetailResult  = document.getElementById('dept-detail-result');  // 단건 조회 결과 표시 영역

const deptListBody  = document.getElementById('dept-list');               // tbody
const deptLoading   = document.getElementById('dept-loading');            // 로딩 인디케이터

// 버튼: querySelector로 index.html 구조에 맞게 선택합니다.
const searchDeptBtn = document.querySelector('#dept-section .card:nth-child(2) .btn-success');
const refreshBtn    = document.querySelector('#dept-section .list-header .btn-info');


// ============================================================
// 렌더링 함수 (서버 데이터 → HTML 화면에 표시)
// ============================================================

/**
 * 부서 목록을 테이블에 렌더링합니다.
 *
 * [Array.map()] 배열의 각 요소를 HTML 문자열로 변환합니다.
 *   v1.0: forEach로 createElement + appendChild
 *   v2.0: map().join('') 으로 HTML을 한 번에 생성
 *
 * [Template Literal] 백틱(``)으로 여러 줄 HTML을 간결하게 작성합니다.
 *
 * @param {Array} departments - 서버에서 받은 부서 배열
 */
const renderDepartmentList = (departments) => {
    // 데이터가 없으면 안내 메시지를 표시합니다.
    if (!departments || departments.length === 0) {
        deptListBody.innerHTML =
            '<tr><td colspan="4" style="text-align:center;">표시할 부서가 없습니다.</td></tr>';
        return;
    }

    // [Array.map()] 부서 배열 → <tr> HTML 문자열 배열로 변환
    // [Template Literal] 각 부서 데이터를 HTML 행으로 만듭니다.
    // [escapeHTML] XSS 방지: 사용자/서버 데이터를 innerHTML에 넣기 전에 반드시 처리합니다.
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

    // [Array.join('')] 배열의 HTML 문자열들을 하나로 합쳐 한 번에 DOM에 반영합니다.
    // (forEach + appendChild 보다 DOM 조작 횟수가 적어 성능이 좋습니다)
    deptListBody.innerHTML = rows.join('');
};

/**
 * 단건 조회 결과를 화면에 표시합니다.
 *
 * [Optional Chaining] department 객체가 null이어도 오류 없이 처리하기 위해
 * if(department) 체크를 먼저 합니다.
 *
 * @param {object|null} department - 조회된 부서 객체 (없으면 null)
 */
const renderDepartmentDetail = (department) => {
    if (!department) {
        deptDetailResult.style.display = 'none';
        return;
    }

    // [Template Literal] 여러 줄의 HTML을 가독성 있게 작성합니다.
    deptDetailResult.innerHTML = `
        <p><strong>ID:</strong> ${department.id}</p>
        <p><strong>부서명:</strong> ${escapeHTML(department.departmentName)}</p>
        <p><strong>부서 설명:</strong> ${escapeHTML(department.departmentDescription)}</p>
    `;
    deptDetailResult.style.display = 'block';
};

/**
 * 부서 목록으로 단건 조회용 드롭다운(select)을 채웁니다.
 *
 * [Array.forEach()] 각 부서를 <option> 요소로 추가합니다.
 * [Template Literal] option의 텍스트를 동적으로 생성합니다.
 *
 * @param {Array} departments - 부서 배열
 */
const populateSearchDropdown = (departments) => {
    // 기존 옵션 초기화 후 기본 안내 옵션 추가
    searchDeptSelect.innerHTML = '<option value="">조회할 부서를 선택하세요...</option>';

    // [Array.forEach()] 각 부서를 option 요소로 만들어 추가합니다.
    departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        // [Template Literal] 부서명과 ID를 조합해서 표시합니다.
        option.textContent = `${dept.departmentName} (ID: ${dept.id})`;
        searchDeptSelect.appendChild(option);
    });
};

/**
 * 로딩 인디케이터를 표시하거나 숨깁니다.
 * @param {boolean} isLoading - true면 표시, false면 숨김
 */
const showLoading = (isLoading) => {
    // [Ternary Operator] 조건에 따라 'block' 또는 'none'을 간결하게 선택합니다.
    deptLoading.style.display = isLoading ? 'block' : 'none';
};


// ============================================================
// 폼 관련 함수
// ============================================================

/**
 * 폼을 초기 상태(생성 모드)로 리셋합니다.
 */
const resetDeptForm = () => {
    deptForm.reset();
    deptIdInput.value         = '';
    deptFormTitle.textContent = '부서 등록';
    deptSubmitBtn.textContent = '부서 생성';
    deptCancelBtn.style.display = 'none';
};

/**
 * 수정 모드로 폼을 설정합니다. (선택한 부서 데이터를 폼에 채웁니다)
 *
 * [Destructuring] 부서 객체에서 필요한 값만 꺼내어 사용합니다.
 *   v1.0: department.departmentName, department.departmentDescription 처럼 접근
 *   v2.0: const { id, departmentName, departmentDescription } = department
 *
 * @param {object} department - 수정할 부서 데이터
 */
const setupEditForm = (department) => {
    // [Destructuring] 객체에서 필요한 값만 골라 변수에 할당합니다.
    const { id, departmentName, departmentDescription } = department;

    deptIdInput.value    = id;
    deptNameInput.value  = departmentName;
    deptDescInput.value  = departmentDescription;

    deptFormTitle.textContent   = '부서 수정';
    deptSubmitBtn.textContent   = '수정 저장';
    deptCancelBtn.style.display = 'inline-block';

    window.scrollTo(0, 0); // 폼이 보이도록 페이지 상단으로 이동
};


// ============================================================
// 데이터 로드 + 렌더링 통합 함수
// ============================================================

/**
 * 서버에서 부서 목록을 가져와 테이블과 드롭다운을 모두 갱신합니다.
 * 생성/수정/삭제 후 호출하여 화면을 최신 상태로 유지합니다.
 */
const loadAndRenderDepartments = async () => {
    showLoading(true);  // 로딩 인디케이터 표시

    // [import한 함수 호출] departmentApi.js 버전 1의 getAllDepartments를 사용합니다.
    // 이전(department.js): 이 파일 안에 직접 fetch 코드가 있었음
    // 변경(v2.0): import한 함수를 호출하기만 하면 됩니다.
    const departments = await getAllDepartments();

    showLoading(false); // 로딩 인디케이터 숨김

    renderDepartmentList(departments);     // 테이블 갱신
    populateSearchDropdown(departments);   // 드롭다운 갱신
};


// ============================================================
// 이벤트 핸들러 (사용자 동작 처리)
// ============================================================

/**
 * 부서 생성/수정 폼 제출 처리
 *
 * [Destructuring] 폼 데이터를 구성할 때 변수를 직접 사용합니다.
 *
 * @param {Event} e - form submit 이벤트
 */
const handleFormSubmit = async (e) => {
    e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 방지

    // [const] 폼 입력값을 읽어 변수에 저장합니다.
    const id = deptIdInput.value;

    // [Destructuring처럼] 필요한 값을 const로 바로 추출합니다.
    const departmentName        = deptNameInput.value.trim();
    const departmentDescription = deptDescInput.value.trim();

    // 유효성 검사: 빈 값이면 메시지를 표시하고 중단합니다.
    if (!departmentName || !departmentDescription) {
        showMessage('부서명과 부서 설명을 모두 입력해주세요.', true);
        return;
    }

    // 전송할 데이터 객체 구성
    // [Shorthand Property] { departmentName: departmentName } 대신 { departmentName } 으로 축약 가능
    const departmentData = { departmentName, departmentDescription };

    if (id) {
        // --- 수정 모드: ID가 있으면 PUT 요청 ---
        // [import한 함수] departmentApi.js 버전 1의 updateDepartment 사용
        const result = await updateDepartment(id, departmentData);
        if (result) {
            showMessage('부서 정보가 성공적으로 수정되었습니다.');
            resetDeptForm();
            await loadAndRenderDepartments(); // 목록 갱신
        }
    } else {
        // --- 생성 모드: ID가 없으면 POST 요청 ---
        // [import한 함수] departmentApi.js 버전 1의 createDepartment 사용
        const result = await createDepartment(departmentData);
        if (result) {
            showMessage('부서가 성공적으로 생성되었습니다.');
            resetDeptForm();
            await loadAndRenderDepartments(); // 목록 갱신
        }
    }
};

/**
 * 드롭다운 선택 후 조회 버튼 클릭 처리
 */
const handleSearchById = async () => {
    const id = searchDeptSelect.value;

    if (!id) {
        showMessage('조회할 부서를 선택해주세요.', true);
        return;
    }

    // [import한 함수] departmentApi.js 버전 1의 getDepartmentById 사용
    const department = await getDepartmentById(id);

    if (!department) {
        // getDepartmentById가 null을 반환 → 해당 ID 없음
        showMessage('해당 ID의 부서가 존재하지 않습니다.', true);
        deptDetailResult.style.display = 'none';
        return;
    }

    renderDepartmentDetail(department);
};

/**
 * 테이블의 수정/삭제 버튼 클릭 처리
 * 이벤트 위임(Event Delegation) 방식: tbody에 이벤트를 하나만 등록합니다.
 *
 * [Destructuring] e.target.dataset에서 필요한 값을 꺼냅니다.
 *
 * @param {Event} e - click 이벤트
 */
const handleListClick = async (e) => {
    // [Destructuring] dataset 객체에서 action과 id를 한 번에 추출합니다.
    const { action, id } = e.target.dataset;

    // data-action, data-id가 없는 요소를 클릭한 경우 무시합니다.
    if (!action || !id) return;

    if (action === 'edit') {
        // 수정 버튼: data-department 속성에 저장된 JSON 데이터를 파싱해서 폼에 채웁니다.
        const department = JSON.parse(e.target.dataset.department);
        setupEditForm(department);

    } else if (action === 'delete') {
        // 삭제 버튼: confirm으로 사용자에게 확인을 받은 후 삭제합니다.
        // [Template Literal] 메시지에 id 변수를 삽입합니다.
        if (confirm(`정말로 ID ${id} 부서를 삭제하시겠습니까?`)) {
            // [import한 함수] departmentApi.js 버전 1의 deleteDepartment 사용
            const ok = await deleteDepartment(id);
            if (ok) {
                showMessage('부서가 삭제되었습니다.');
                await loadAndRenderDepartments(); // 목록 갱신
            }
        }
    }
};


// ============================================================
// 초기화 (이벤트 리스너 등록 + 첫 데이터 로드)
// ============================================================

/**
 * HTML이 완전히 로드된 후 실행됩니다.
 * 이벤트 리스너를 연결하고 초기 데이터를 불러옵니다.
 *
 * [Arrow Function] DOMContentLoaded 콜백을 화살표 함수로 작성합니다.
 */
document.addEventListener('DOMContentLoaded', () => {

    // 폼 제출 이벤트
    deptForm.addEventListener('submit', handleFormSubmit);

    // 조회 버튼 클릭 이벤트
    searchDeptBtn.addEventListener('click', handleSearchById);

    // 테이블 버튼 클릭 이벤트 (이벤트 위임: tbody 하나에 등록)
    deptListBody.addEventListener('click', handleListClick);

    // 취소 버튼: 폼을 초기 상태로 되돌립니다.
    deptCancelBtn.addEventListener('click', resetDeptForm);

    // 새로고침 버튼: 부서 목록을 다시 불러옵니다.
    refreshBtn.addEventListener('click', loadAndRenderDepartments);

    // 페이지 최초 로드 시 부서 목록을 서버에서 가져옵니다.
    loadAndRenderDepartments();
});
