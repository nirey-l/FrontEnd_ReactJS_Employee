/**
 * @file employeeApi.js
 * @description 직원(Employee) API 통신 모듈
 *
 * 이 파일은 두 가지 버전으로 작성되어 있습니다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  [버전 1] 함수형 방식  ← 초보자에게 권장, 먼저 읽으세요!        │
 * │  [버전 2] 클래스 방식  ← ES 문법 학습 후 단계적으로 이해        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 두 버전 모두 동일한 기능을 수행합니다.
 * 현재 실제로 export되어 사용되는 버전은 [버전 2] 클래스 방식입니다.
 *
 * [v1.0 employee.js 대비 핵심 변경점]
 * 1. fetch 코드가 이 파일에만 있고, UI 코드(렌더링/이벤트)는 포함하지 않습니다.
 * 2. handleApiError를 employee.js처럼 department.js의 전역 함수에 의존하지 않고,
 *    utils.js에서 명시적으로 import합니다.
 * 3. export로 함수/클래스를 공개하여 다른 파일에서 import해서 사용합니다.
 */

// ============================================================
// 공통 설정
// ============================================================

// [import] utils.js에서 공통 에러 처리 함수를 가져옵니다.
// v1.0: employee.js에서 department.js의 전역 handleApiError를 암묵적으로 사용했음
// v2.0: import로 명시적으로 가져오기 때문에 의존 관계가 명확합니다.
import { handleApiError, checkResponse } from '../utils.js';

// [const] 직원 API의 기본 URL — 두 버전에서 공통으로 사용합니다.
// v1.0: API_BASE_URL (전역, department.js에 선언) 에 '/employees' 를 붙여서 사용
// v2.0: 직원 전용 BASE_URL을 이 파일 안에서 독립적으로 관리합니다.
const BASE_URL = 'http://localhost:8080/api/employees';


// ============================================================
// ★ [버전 1] 함수형 방식 (Function-based) - 초보자 추천
// ============================================================
//
// v1.0(employee.js)의 전역 함수와 거의 같은 구조입니다.
// 달라진 점은 세 가지입니다.
//   1) export를 붙여서 다른 파일에서 import할 수 있게 했습니다.
//   2) const + Arrow Function으로 작성했습니다.
//   3) handleApiError를 import해서 사용합니다. (전역 의존 제거)
//
// ─────────────────────────────────────────────────────────────

/**
 * [버전 1] 모든 직원 목록을 서버에서 가져옵니다. (기본 조회)
 * departmentDto 필드는 항상 null로 옵니다.
 *
 * [export]        다른 파일에서 import할 수 있도록 공개합니다.
 * [const]         재할당이 없으므로 const로 선언합니다.
 * [Arrow Function] async () => {} 형태로 비동기 함수를 정의합니다.
 * [async/await]   fetch의 응답을 기다리는 비동기 처리 방식입니다.
 *
 * @returns {Promise<Array>} 직원 배열. 오류 시 빈 배열([]) 반환.
 */
export const getAllEmployees = async () => {
    try {
        // [Template Literal] BASE_URL 그대로 사용 (이미 전체 경로)
        const response = await fetch(BASE_URL);
        await checkResponse(response);  // 4xx/5xx 이면 Error throw
        return await response.json();   // JSON 파싱 후 반환
    } catch (error) {
        console.error('[getAllEmployees] 오류:', error);
        handleApiError(error);
        return [];  // 오류 시 빈 배열 반환 → UI가 깨지지 않음
    }
};

/**
 * [버전 1] 모든 직원 목록을 부서 정보와 함께 가져옵니다.
 * departmentDto 필드에 부서 객체가 포함되어 옵니다.
 * departmentId 필드는 null이 됩니다.
 *
 * @returns {Promise<Array>} 부서 정보가 포함된 직원 배열. 오류 시 빈 배열 반환.
 */
export const getAllEmployeesWithDepartments = async () => {
    try {
        // [Template Literal] /departments 경로를 URL에 추가합니다.
        const response = await fetch(`${BASE_URL}/departments`);
        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error('[getAllEmployeesWithDepartments] 오류:', error);
        handleApiError(error);
        return [];
    }
};

/**
 * [버전 1] ID로 특정 직원 한 명을 조회합니다.
 *
 * @param {number|string} id - 조회할 직원 ID
 * @returns {Promise<object|null>} 직원 객체. 없거나 오류 시 null 반환.
 */
export const getEmployeeById = async (id) => {
    try {
        // [Template Literal] URL에 id 변수를 삽입합니다.
        const response = await fetch(`${BASE_URL}/${id}`);

        // 404: 해당 ID의 직원이 없는 경우 (에러가 아닌 "없음" 상황)
        if (response.status === 404) {
            return null;
        }

        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error(`[getEmployeeById] ID ${id} 조회 오류:`, error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 이메일로 특정 직원 한 명을 조회합니다.
 *
 * 주의: 이메일에 '@' 기호가 포함되어 있어도 URL에 그대로 사용합니다.
 * 백엔드에서 @CrossOrigin과 경로 처리가 되어 있으므로 별도 인코딩 불필요합니다.
 *
 * @param {string} email - 조회할 직원 이메일 (예: john@company.com)
 * @returns {Promise<object|null>} 직원 객체. 없거나 오류 시 null 반환.
 */
export const getEmployeeByEmail = async (email) => {
    try {
        // [Template Literal] /email/ 경로 뒤에 email 변수를 삽입합니다.
        const response = await fetch(`${BASE_URL}/email/${email}`);

        if (response.status === 404) {
            return null;
        }

        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error(`[getEmployeeByEmail] 이메일 ${email} 조회 오류:`, error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 새 직원을 생성합니다.
 *
 * @param {object} employeeData - 생성할 직원 데이터
 * @param {string} employeeData.firstName    - 이름
 * @param {string} employeeData.lastName     - 성
 * @param {string} employeeData.email        - 이메일
 * @param {number} employeeData.departmentId - 소속 부서 ID
 * @returns {Promise<object|null>} 생성된 직원 객체. 오류 시 null 반환.
 */
export const createEmployee = async (employeeData) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',                                   // HTTP 메서드: 생성
            headers: { 'Content-Type': 'application/json' }, // 요청 본문이 JSON임을 서버에 알림
            body: JSON.stringify(employeeData),               // JS 객체 → JSON 문자열 변환
        });
        await checkResponse(response);
        return await response.json();   // 서버가 반환한 생성된 직원 데이터
    } catch (error) {
        console.error('[createEmployee] 생성 오류:', error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 기존 직원 정보를 수정합니다.
 *
 * @param {number|string} id - 수정할 직원 ID
 * @param {object} employeeData - 수정할 직원 데이터 (전체 필드 포함)
 * @returns {Promise<object|null>} 수정된 직원 객체. 오류 시 null 반환.
 */
export const updateEmployee = async (id, employeeData) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',                                    // HTTP 메서드: 전체 수정
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
        });
        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error(`[updateEmployee] ID ${id} 수정 오류:`, error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 직원을 삭제합니다.
 *
 * @param {number|string} id - 삭제할 직원 ID
 * @returns {Promise<boolean>} 삭제 성공이면 true, 실패이면 false.
 */
export const deleteEmployee = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',   // HTTP 메서드: 삭제
        });
        await checkResponse(response);
        return true;    // 삭제 성공
    } catch (error) {
        console.error(`[deleteEmployee] ID ${id} 삭제 오류:`, error);
        handleApiError(error);
        return false;   // 삭제 실패
    }
};

// ─────────────────────────────────────────────────────────────
// [버전 1] 사용 방법 (다른 파일에서 import할 때)
//
// import {
//     getAllEmployees,
//     getAllEmployeesWithDepartments,
//     getEmployeeById,
//     getEmployeeByEmail,
//     createEmployee,
//     updateEmployee,
//     deleteEmployee,
// } from '../api/employeeApi.js';
//
// const employees    = await getAllEmployees();
// const withDepts    = await getAllEmployeesWithDepartments();
// const emp          = await getEmployeeById(1);
// const empByEmail   = await getEmployeeByEmail('john@company.com');
// const newEmp       = await createEmployee({ firstName:'John', lastName:'Doe', email:'...', departmentId:1 });
// ─────────────────────────────────────────────────────────────


// ============================================================
// ★ [버전 2] 클래스 방식 (Class-based) - ECMAScript 모던 문법
// ============================================================
//
// 버전 1의 7개 함수를 하나의 "클래스"라는 틀에 묶은 것입니다.
// 내부 로직은 버전 1과 완전히 동일합니다.
//
// 클래스를 사용하는 이유:
//   - 직원 관련 API를 하나의 단위(EmployeeApi)로 묶어 관리합니다.
//   - #baseUrl을 private 필드로 숨겨 외부 변경을 방지합니다.
//   - departmentApi.js와 동일한 패턴이므로 구조 통일성이 높습니다.
//   - new EmployeeApi()로 인스턴스를 만들어 독립적으로 사용합니다.
//
// ─────────────────────────────────────────────────────────────

/**
 * [버전 2] 직원 API 통신을 담당하는 클래스입니다.
 *
 * [class]  관련 메서드(함수)와 데이터를 하나의 설계도로 묶습니다.
 * [export] 이 클래스를 다른 파일에서 import할 수 있도록 공개합니다.
 *
 * 사용 예시:
 *   import { EmployeeApi } from '../api/employeeApi.js';
 *   const employeeApi = new EmployeeApi();  // 인스턴스 생성
 *   const employees = await employeeApi.getAll();
 */
export class EmployeeApi {

    // ─── 클래스 Private 필드 ──────────────────────────────────────

    // [Private Field #] 앞에 #을 붙이면 클래스 외부에서 접근할 수 없습니다.
    // 버전 1의 const BASE_URL 과 같은 역할이지만 클래스 안에 캡슐화된 것입니다.
    //
    // 외부에서 employeeApi.#baseUrl 로 접근하면 SyntaxError 발생!
    // → URL을 실수로 변경하는 것을 원천 차단합니다.
    #baseUrl = 'http://localhost:8080/api/employees';


    // ─── 메서드 (Methods) ─────────────────────────────────────────
    // 클래스 안에 정의된 함수를 "메서드"라고 합니다.
    // function 키워드 없이 메서드 이름만으로 정의합니다.

    /**
     * 모든 직원 목록을 서버에서 가져옵니다. (기본 조회)
     * GET /api/employees
     *
     * [this.#baseUrl] 클래스 메서드 안에서 자신의 private 필드에 접근합니다.
     *   this       = 현재 인스턴스 (new EmployeeApi() 로 만든 객체)
     *   this.#baseUrl = 위에서 선언한 private 필드
     *
     * @returns {Promise<Array>} 직원 배열. 오류 시 빈 배열([]) 반환.
     */
    async getAll() {
        try {
            const response = await fetch(this.#baseUrl);
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error('[EmployeeApi.getAll] 오류:', error);
            handleApiError(error);
            return [];
        }
    }

    /**
     * 모든 직원 목록을 부서 정보와 함께 가져옵니다.
     * GET /api/employees/departments
     *
     * 응답의 각 직원 객체에 departmentDto 가 포함됩니다.
     * departmentId 는 null이 됩니다.
     *
     * @returns {Promise<Array>} 부서 포함 직원 배열. 오류 시 빈 배열 반환.
     */
    async getAllWithDepartments() {
        try {
            // [Template Literal] this.#baseUrl 에 '/departments' 경로를 이어붙입니다.
            const response = await fetch(`${this.#baseUrl}/departments`);
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error('[EmployeeApi.getAllWithDepartments] 오류:', error);
            handleApiError(error);
            return [];
        }
    }

    /**
     * ID로 특정 직원 한 명을 조회합니다.
     * GET /api/employees/{id}
     *
     * @param {number|string} id - 조회할 직원 ID
     * @returns {Promise<object|null>} 직원 객체. 없거나 오류 시 null 반환.
     */
    async getById(id) {
        try {
            const response = await fetch(`${this.#baseUrl}/${id}`);

            if (response.status === 404) {
                return null;    // 없는 직원 → null 반환 (에러가 아닌 정상 케이스)
            }

            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`[EmployeeApi.getById] ID ${id} 조회 오류:`, error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 이메일로 특정 직원 한 명을 조회합니다.
     * GET /api/employees/email/{email}
     *
     * [주의] 이메일 경로의 '@' 기호는 인코딩 없이 그대로 URL에 포함합니다.
     *   백엔드 @CrossOrigin 설정과 Spring의 경로 처리로 동작합니다.
     *
     * @param {string} email - 조회할 이메일 주소
     * @returns {Promise<object|null>} 직원 객체. 없거나 오류 시 null 반환.
     */
    async getByEmail(email) {
        try {
            // [Template Literal] /email/ 경로 뒤에 email 변수를 삽입합니다.
            const response = await fetch(`${this.#baseUrl}/email/${email}`);

            if (response.status === 404) {
                return null;
            }

            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`[EmployeeApi.getByEmail] 이메일 ${email} 조회 오류:`, error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 새 직원을 생성합니다.
     * POST /api/employees
     *
     * [Spread Operator ...] 원본 객체를 복사하면서 필요 시 값을 추가/덮어쓸 수 있습니다.
     * 예) const body = { ...employeeData, createdAt: new Date() };
     *
     * 여기서는 단순 전달이므로 spread 없이 employeeData를 그대로 사용합니다.
     * 하지만 PRD가 spread 활용을 명시하므로 패턴은 아래와 같이 확장 가능합니다.
     *
     * @param {object} employeeData - 생성할 직원 데이터
     * @param {string} employeeData.firstName    - 이름
     * @param {string} employeeData.lastName     - 성
     * @param {string} employeeData.email        - 이메일
     * @param {number} employeeData.departmentId - 소속 부서 ID
     * @returns {Promise<object|null>} 생성된 직원 객체. 오류 시 null 반환.
     */
    async create(employeeData) {
        try {
            // [Spread Operator] 원본 employeeData를 복사하여 요청 본문을 만듭니다.
            // 이렇게 하면 원본 객체를 변경하지 않고 안전하게 처리할 수 있습니다.
            // 나중에 서버 요구사항이 바뀌어 필드를 추가해야 할 때 확장이 쉽습니다.
            // 예: const requestBody = { ...employeeData, role: 'EMPLOYEE' };
            const requestBody = { ...employeeData };

            const response = await fetch(this.#baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error('[EmployeeApi.create] 생성 오류:', error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 기존 직원 정보를 수정합니다.
     * PUT /api/employees/{id}
     *
     * [Spread Operator] 수정 데이터 객체를 안전하게 복사하여 전송합니다.
     * 원본 객체를 변경하지 않으므로 예기치 않은 사이드 이펙트를 방지합니다.
     *
     * @param {number|string} id - 수정할 직원 ID
     * @param {object} employeeData - 수정할 직원 데이터 (전체 필드)
     * @returns {Promise<object|null>} 수정된 직원 객체. 오류 시 null 반환.
     */
    async update(id, employeeData) {
        try {
            // [Spread Operator] 원본 employeeData를 복사합니다.
            // v1.0: body: JSON.stringify(employeeData)  ← 원본을 직접 사용
            // v2.0: const requestBody = { ...employeeData } ← 복사본을 사용 (더 안전)
            const requestBody = { ...employeeData };

            const response = await fetch(`${this.#baseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`[EmployeeApi.update] ID ${id} 수정 오류:`, error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 직원을 삭제합니다.
     * DELETE /api/employees/{id}
     *
     * @param {number|string} id - 삭제할 직원 ID
     * @returns {Promise<boolean>} 삭제 성공이면 true, 실패이면 false.
     */
    async delete(id) {
        try {
            const response = await fetch(`${this.#baseUrl}/${id}`, {
                method: 'DELETE',
            });
            await checkResponse(response);
            return true;
        } catch (error) {
            console.error(`[EmployeeApi.delete] ID ${id} 삭제 오류:`, error);
            handleApiError(error);
            return false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
// [버전 2] 사용 방법 (다른 파일에서 import할 때)
//
// import { EmployeeApi } from '../api/employeeApi.js';
//
// // [인스턴스 생성] 클래스(설계도) → 인스턴스(실제 객체)
// const employeeApi = new EmployeeApi();
//
// // 메서드 호출 - employeeApi.메서드명() 형태
// const employees  = await employeeApi.getAll();
// const withDepts  = await employeeApi.getAllWithDepartments();
// const emp        = await employeeApi.getById(1);
// const empByEmail = await employeeApi.getByEmail('john@company.com');
// const newEmp     = await employeeApi.create({
//     firstName: 'John', lastName: 'Doe',
//     email: 'john@company.com', departmentId: 1
// });
// const updated    = await employeeApi.update(1, { firstName: 'Jane', ... });
// const deleted    = await employeeApi.delete(1);  // true or false
// ─────────────────────────────────────────────────────────────


// ============================================================
// ★ 두 버전 비교 요약
// ============================================================
//
// ┌─────────────────────┬────────────────────────────┬──────────────────────────┐
// │ 항목                │ 버전 1 (함수형)              │ 버전 2 (클래스)            │
// ├─────────────────────┼────────────────────────────┼──────────────────────────┤
// │ URL 관리            │ const BASE_URL (모듈)        │ #baseUrl (클래스 내부)    │
// │ 함수 정의           │ export const fn = async()=>{}│ async 메서드             │
// │ 호출 방법           │ getAllEmployees()            │ api.getAll()             │
// │ import 방법         │ import { getAllEmployees }   │ import { EmployeeApi }   │
// │ 인스턴스 필요       │ 불필요                       │ new EmployeeApi()        │
// │ Spread Operator     │ 미사용                       │ create/update에서 사용   │
// │ 초보자 접근성       │ ★★★★★ 쉬움               │ ★★★☆☆ 중간             │
// │ 확장성/유지보수     │ ★★★☆☆ 보통               │ ★★★★★ 좋음             │
// └─────────────────────┴────────────────────────────┴──────────────────────────┘
