/**
 * @file departmentApi.js
 * @description 부서(Department) API 통신 모듈
 *
 * 이 파일은 두 가지 버전으로 작성되어 있습니다.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [버전 1] 함수형 방식  ← 초보자에게 권장, 먼저 읽으세요!    │
 * │  [버전 2] 클래스 방식  ← ES 문법 학습 후 단계적으로 이해    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 두 버전 모두 동일한 기능을 수행합니다.
 * 현재 실제로 export되어 사용되는 버전은 [버전 2] 클래스 방식입니다.
 * [버전 1]을 사용하고 싶다면 파일 하단의 주석을 참고하세요.
 */

// ============================================================
// 공통 설정
// ============================================================

// [import] utils.js에서 공통 함수를 가져옵니다.
// 필요한 함수만 골라서 가져오는 방식을 "named import"라고 합니다.
import { handleApiError, checkResponse } from '../utils.js';

// [const] 재할당이 없는 값은 const로 선언합니다. (var 사용 금지)
// 부서 API의 기본 URL - 두 버전에서 공통으로 사용합니다.
const BASE_URL = 'http://localhost:8080/api/departments';


// ============================================================
// ★ [버전 1] 함수형 방식 (Function-based) - 초보자 추천
// ============================================================
//
// v1.0(department.js)의 전역 함수와 거의 같은 구조입니다.
// 달라진 점은 딱 두 가지입니다.
//   1) export를 붙여서 다른 파일에서 import할 수 있게 했습니다.
//   2) const + Arrow Function으로 작성했습니다.
//
// 이미 v1.0이 익숙하다면 이 버전부터 읽으세요.
// ─────────────────────────────────────────────────────────────

/**
 * [버전 1] 모든 부서 목록을 서버에서 가져옵니다.
 *
 * [export] 이 함수를 다른 파일에서 import할 수 있도록 공개합니다.
 * [const]  재할당이 없으므로 const로 선언합니다.
 * [Arrow Function] async () => {} 형태로 함수를 정의합니다.
 * [async/await] 서버 응답을 기다리는 비동기 처리 방식입니다.
 *
 * @returns {Promise<Array>} 부서 배열. 오류 시 빈 배열([]) 반환.
 */
export const getAllDepartments = async () => {
    try {
        // [Template Literal] 백틱(``)을 사용해 URL을 표현합니다.
        // v1.0: fetch(API_BASE_URL + '/departments')
        // v2.0: fetch(`${BASE_URL}`)  ← 이미 BASE_URL이 전체 경로이므로 그대로 사용
        const response = await fetch(BASE_URL);

        // checkResponse: HTTP 오류 상태(4xx, 5xx)이면 Error를 throw합니다.
        await checkResponse(response);

        // 응답 본문을 JSON으로 파싱하여 반환합니다.
        return await response.json();
    } catch (error) {
        // [Template Literal] 오류 로그에 함수 이름을 포함합니다.
        console.error('[getAllDepartments] 오류:', error);
        handleApiError(error);  // utils.js의 공통 에러 처리
        return [];              // 오류 발생 시 빈 배열을 반환해 UI가 깨지지 않게 합니다.
    }
};

/**
 * [버전 1] ID로 특정 부서 하나를 조회합니다.
 *
 * @param {number|string} id - 조회할 부서의 ID
 * @returns {Promise<object|null>} 부서 객체. 없거나 오류 시 null 반환.
 */
export const getDepartmentById = async (id) => {
    try {
        // [Template Literal] URL에 id 변수를 삽입합니다.
        // v1.0: fetch(API_BASE_URL + '/departments/' + id)
        // v2.0: fetch(`${BASE_URL}/${id}`)
        const response = await fetch(`${BASE_URL}/${id}`);

        // 404: 해당 ID의 부서가 없는 경우 - 오류가 아닌 정상적인 "없음" 상황
        if (response.status === 404) {
            // handleApiError 대신 직접 메시지를 반환합니다. (정상 케이스이므로)
            return null;
        }

        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error(`[getDepartmentById] ID ${id} 조회 오류:`, error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 새 부서를 생성합니다.
 *
 * @param {object} departmentData - 생성할 부서 데이터 { departmentName, departmentDescription }
 * @returns {Promise<object|null>} 생성된 부서 객체. 오류 시 null 반환.
 */
export const createDepartment = async (departmentData) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',                             // HTTP 메서드: 생성
            headers: { 'Content-Type': 'application/json' }, // 요청 본문이 JSON임을 서버에 알림
            body: JSON.stringify(departmentData),       // JS 객체 → JSON 문자열 변환
        });
        await checkResponse(response);
        return await response.json();   // 서버가 반환한 생성된 부서 데이터
    } catch (error) {
        console.error('[createDepartment] 생성 오류:', error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 기존 부서 정보를 수정합니다.
 *
 * @param {number|string} id - 수정할 부서의 ID
 * @param {object} departmentData - 수정할 데이터 { departmentName, departmentDescription }
 * @returns {Promise<object|null>} 수정된 부서 객체. 오류 시 null 반환.
 */
export const updateDepartment = async (id, departmentData) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',                              // HTTP 메서드: 전체 수정
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(departmentData),
        });
        await checkResponse(response);
        return await response.json();
    } catch (error) {
        console.error(`[updateDepartment] ID ${id} 수정 오류:`, error);
        handleApiError(error);
        return null;
    }
};

/**
 * [버전 1] 부서를 삭제합니다.
 *
 * @param {number|string} id - 삭제할 부서의 ID
 * @returns {Promise<boolean>} 삭제 성공이면 true, 실패이면 false.
 */
export const deleteDepartment = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',   // HTTP 메서드: 삭제
        });
        await checkResponse(response);
        return true;    // 삭제 성공
    } catch (error) {
        console.error(`[deleteDepartment] ID ${id} 삭제 오류:`, error);
        handleApiError(error);
        return false;   // 삭제 실패
    }
};

// ─────────────────────────────────────────────────────────────
// [버전 1] 사용 방법 (다른 파일에서 import할 때)
//
// import {
//     getAllDepartments,
//     getDepartmentById,
//     createDepartment,
//     updateDepartment,
//     deleteDepartment,
// } from '../api/departmentApi.js';
//
// const departments = await getAllDepartments();
// const dept = await getDepartmentById(1);
// const newDept = await createDepartment({ departmentName: 'HR', departmentDescription: '...' });
// ─────────────────────────────────────────────────────────────


// ============================================================
// ★ [버전 2] 클래스 방식 (Class-based) - ECMAScript 모던 문법
// ============================================================
//
// 버전 1의 5개 함수를 하나의 "클래스"라는 틀에 묶은 것입니다.
// 내부 로직은 버전 1과 완전히 동일합니다.
//
// 클래스를 사용하는 이유:
//   - 관련된 함수들을 하나의 단위로 묶어 관리할 수 있습니다.
//   - BASE_URL을 클래스 내부(#baseUrl)에 숨겨 외부에서 실수로 변경하지 못하게 합니다.
//   - new DepartmentApi()로 인스턴스를 만들면 여러 곳에서 독립적으로 사용할 수 있습니다.
//   - 다음 단계(React, Vite)에서도 동일한 패턴을 사용합니다.
//
// ─────────────────────────────────────────────────────────────

/**
 * [버전 2] 부서 API 통신을 담당하는 클래스입니다.
 *
 * [class] 관련 함수(메서드)와 데이터를 하나의 설계도로 묶습니다.
 * [export] 이 클래스를 다른 파일에서 import할 수 있도록 공개합니다.
 *
 * 사용 예시:
 *   import { DepartmentApi } from '../api/departmentApi.js';
 *   const departmentApi = new DepartmentApi();  // 인스턴스 생성
 *   const departments = await departmentApi.getAll();
 */
export class DepartmentApi {

    // ─── 클래스 필드 (Class Fields) ───────────────────────────────

    // [Private Field #] 앞에 #을 붙이면 클래스 외부에서 접근할 수 없습니다.
    // 즉, 이 URL은 DepartmentApi 클래스 안에서만 사용할 수 있습니다.
    // 버전 1의 const BASE_URL = '...'과 동일한 역할이지만, 클래스 안에 캡슐화된 것입니다.
    //
    // v1.0 방식: const API_BASE_URL = '...'  ← 전역에서 누구나 접근 가능
    // v2.0 방식: #baseUrl = '...'            ← 클래스 내부에서만 접근 가능
    #baseUrl = 'http://localhost:8080/api/departments';


    // ─── 메서드 (Methods) ─────────────────────────────────────────
    // 클래스 안에 정의된 함수를 "메서드"라고 부릅니다.
    // function 키워드 없이 이름만으로 정의합니다.

    /**
     * 모든 부서 목록을 서버에서 가져옵니다. (GET /api/departments)
     *
     * [async] 이 메서드는 비동기 처리를 합니다. (await 사용 가능)
     * [this.#baseUrl] 클래스 메서드 안에서 자신의 필드에 접근할 때 this.를 사용합니다.
     *
     * @returns {Promise<Array>} 부서 배열. 오류 시 빈 배열([]) 반환.
     */
    async getAll() {
        try {
            // [this.#baseUrl] this = 이 클래스의 인스턴스, #baseUrl = 위에서 선언한 private 필드
            const response = await fetch(this.#baseUrl);
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error('[DepartmentApi.getAll] 오류:', error);
            handleApiError(error);
            return [];
        }
    }

    /**
     * ID로 특정 부서 하나를 조회합니다. (GET /api/departments/{id})
     *
     * @param {number|string} id - 조회할 부서의 ID
     * @returns {Promise<object|null>} 부서 객체. 없거나 오류 시 null 반환.
     */
    async getById(id) {
        try {
            // [Template Literal] this.#baseUrl에 id를 합쳐 URL을 만듭니다.
            const response = await fetch(`${this.#baseUrl}/${id}`);

            if (response.status === 404) {
                return null;    // 없는 부서 ID → null 반환 (에러가 아닌 정상 케이스)
            }

            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`[DepartmentApi.getById] ID ${id} 조회 오류:`, error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 새 부서를 생성합니다. (POST /api/departments)
     *
     * [Destructuring 파라미터] 객체를 통째로 받는 대신 필요한 값만 꺼냅니다.
     *
     * v1.0: createDepartment(departmentData)
     *       → 함수 안에서 departmentData.departmentName 처럼 접근
     *
     * v2.0: create({ departmentName, departmentDescription })
     *       → 파라미터에서 바로 변수로 꺼내어 사용 (더 명확하고 간결)
     *
     * @param {object} param0 - 생성할 부서 데이터
     * @param {string} param0.departmentName - 부서명
     * @param {string} param0.departmentDescription - 부서 설명
     * @returns {Promise<object|null>} 생성된 부서 객체. 오류 시 null 반환.
     */
    async create({ departmentName, departmentDescription }) {
        try {
            // [Spread Operator ...] 객체를 복사하거나 병합할 때 사용합니다.
            // 여기서는 destructuring으로 받은 값을 다시 객체로 조립합니다.
            // { departmentName, departmentDescription } 은 아래와 동일합니다.
            // { departmentName: departmentName, departmentDescription: departmentDescription }
            const requestBody = { departmentName, departmentDescription };

            const response = await fetch(this.#baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error('[DepartmentApi.create] 생성 오류:', error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 기존 부서 정보를 수정합니다. (PUT /api/departments/{id})
     *
     * [Destructuring 파라미터] 두 번째 파라미터도 destructuring으로 받습니다.
     *
     * @param {number|string} id - 수정할 부서의 ID
     * @param {object} param1 - 수정할 데이터
     * @param {string} param1.departmentName - 새 부서명
     * @param {string} param1.departmentDescription - 새 부서 설명
     * @returns {Promise<object|null>} 수정된 부서 객체. 오류 시 null 반환.
     */
    async update(id, { departmentName, departmentDescription }) {
        try {
            const response = await fetch(`${this.#baseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // [Spread Operator] 수정 데이터 객체를 조립합니다.
                // 나중에 필드가 추가될 경우 ...rest 등으로 확장하기 쉽습니다.
                body: JSON.stringify({ departmentName, departmentDescription }),
            });
            await checkResponse(response);
            return await response.json();
        } catch (error) {
            console.error(`[DepartmentApi.update] ID ${id} 수정 오류:`, error);
            handleApiError(error);
            return null;
        }
    }

    /**
     * 부서를 삭제합니다. (DELETE /api/departments/{id})
     *
     * @param {number|string} id - 삭제할 부서의 ID
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
            console.error(`[DepartmentApi.delete] ID ${id} 삭제 오류:`, error);
            handleApiError(error);
            return false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
// [버전 2] 사용 방법 (다른 파일에서 import할 때)
//
// import { DepartmentApi } from '../api/departmentApi.js';
//
// // [인스턴스 생성] 클래스로부터 실제 사용할 객체를 만듭니다.
// const departmentApi = new DepartmentApi();
//
// // 메서드 호출 - departmentApi.메서드명() 형태로 사용합니다.
// const departments = await departmentApi.getAll();
// const dept       = await departmentApi.getById(1);
// const newDept    = await departmentApi.create({ departmentName: 'HR', departmentDescription: '인사팀' });
// const updated    = await departmentApi.update(1, { departmentName: 'HR', departmentDescription: '인사관리팀' });
// const deleted    = await departmentApi.delete(1);
// ─────────────────────────────────────────────────────────────


// ============================================================
// ★ 두 버전 비교 요약
// ============================================================
//
// ┌─────────────────────┬────────────────────────┬────────────────────────┐
// │ 항목                │ 버전 1 (함수형)         │ 버전 2 (클래스)         │
// ├─────────────────────┼────────────────────────┼────────────────────────┤
// │ URL 관리            │ const BASE_URL (모듈)   │ #baseUrl (클래스 내부)  │
// │ 함수 정의           │ export const fn = ()=>{} │ 클래스 메서드          │
// │ 호출 방법           │ getAllDepartments()      │ api.getAll()           │
// │ import 방법         │ import { getAllDept.. } │ import { DepartmentApi }│
// │ 인스턴스 필요       │ 불필요                  │ new DepartmentApi()    │
// │ 초보자 접근성       │ ★★★★★ 쉬움            │ ★★★☆☆ 중간           │
// │ 확장성/유지보수     │ ★★★☆☆ 보통            │ ★★★★★ 좋음           │
// └─────────────────────┴────────────────────────┴────────────────────────┘
