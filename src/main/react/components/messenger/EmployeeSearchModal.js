import React, {useEffect, useMemo, useState} from 'react';
import {useDebounce} from "../common/useDebounce";
import Pagination from "../common/Pagination";
import axios from "axios";
import {TiDelete} from "react-icons/ti";
import useSearch from "./useSearch";

const EmployeeSearchModal = ({closeEmployeeSearchModal, fetchChatList, createUrl, onSelectedEmployees, enableAutoComplete = false}) => {

    // 🔴 직원 state
    const [selectedEmployees, setSelectedEmployees] = useState([]); // 선택된 직원
    const [employeeSearchText, setEmployeeSearchText] = useState(''); // 직원 검색 텍스트
    const debouncedEmployeeSearchText = useDebounce(employeeSearchText, 300);

    // 🔴 페이지네이션 state
    const [totalPages, setTotalPages] = useState(0); // 총 페이지 수
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const [itemsPerPage, setItemsPerPage] = useState(10); // 페이지 당 직원 수
    const [totalItems, setTotalItems] = useState(0); // 총 직원 수

    // 🔴 useSearch 훅 사용
    const initialParams = useMemo(() => ({
        page: currentPage,
        size: itemsPerPage
    }), [currentPage, itemsPerPage]);
    const endpoint = "/api/messengers/employeeList";
    const {
        data: employeeData = [],
        searchLoading
    } = useSearch(endpoint, debouncedEmployeeSearchText, '', initialParams);

    // 🔴 검색 결과 총 페이지 및 직원 수 업데이트
    useEffect(() => {
        console.log("불러온 직원 데이터:", employeeData);
        if (employeeData.content) {
            setTotalItems(employeeData.totalElements || 0);
            setTotalPages(employeeData.totalPages || 0);
        }
    }, [employeeData]);

    // 🔴 페이지 변경 처리 함수
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 🔴 페이지당 항목 수 변경 처리 함수
    const handleItemsPerPageChange = (items) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    // 🔴 검색어 삭제 버튼 클릭 공통 함수
    const handleSearchDel = () => {
        setEmployeeSearchText('');
    };

    // 🔴 검색어 변경(직원)
    const handleEmployeeSearchTextChange = (event) => {
        setEmployeeSearchText(event.target.value);
    };

    // 🔴 모달 배경 클릭 시 창 닫기
    const handleBackgroundClick = (e) => {
        if (e.target.className === 'modal_overlay') {
            closeEmployeeSearchModal();
        }
    };

    // 🔴 직원 전체 선택/해제
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allEmployeesOnPage = employeeData.content?.map(employee => ({
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                departmentName: employee.departmentName,
                jobName: employee.jobName,
            }));
            setSelectedEmployees(prevSelected => {
                const newSelected = [...prevSelected];
                allEmployeesOnPage.forEach(employee => {
                    if (!newSelected.some(selected => selected.employeeId === employee.employeeId)) {
                        newSelected.push(employee);
                    }
                });
                return newSelected;
            });
        } else {
            const allEmployeeIdsOnPage = employeeData.map(employee => employee.employeeId);
            setSelectedEmployees(prevSelected =>
                prevSelected.filter(selected => !allEmployeeIdsOnPage.includes(selected.employeeId))
            );
        }
    };

    // 🔴 전체 선택 체크박스 상태를 업데이트
    const isAllSelected = employeeData.length > 0 && employeeData.every(employee =>
        selectedEmployees.some(selected => selected.employeeId === employee.employeeId)
    );

    // 🔴 페이지 이동 시 선택된 항목 상태 유지하는 로직
    useEffect(() => {
        const allSelectCheckbox = document.getElementById("all-select_checkbox");
        if (allSelectCheckbox) {
            allSelectCheckbox.checked = isAllSelected;
        }
    }, [isAllSelected, employeeData, selectedEmployees]);

    // 🔴 직원 개별 선택/해제
    const handleSelectEmployee = (employeeId, employeeName, departmentName, jobName) => {
        setSelectedEmployees((prevSelected) => {
            const isAlreadySelected = prevSelected.some(
                (selected) => selected.employeeId === employeeId
            );
            if (isAlreadySelected) {
                return prevSelected.filter(
                    (selected) => selected.employeeId !== employeeId
                );
            } else {
                return [
                    ...prevSelected,
                    {employeeId, employeeName, departmentName, jobName},
                ];
            }
        });
    };

    // 🔴 선택된 직원 개별 삭제
    const handleRemoveSelectedEmployee = (employeeId) => {
        setSelectedEmployees(prevSelected =>
            prevSelected.filter(employee => employee.employeeId !== employeeId)
        );
    };

    // 🔴 채팅방 생성 또는 직원 목록 전달
    const createHandler = async () => {
        const employeeIds = selectedEmployees.map(employee => employee.employeeId);

        if (createUrl && createUrl !== '') {
            // 채팅방 생성
            try {
                const response = await axios.post(createUrl, employeeIds);
                console.log('채팅방 생성 성공:', response.data);

                if (fetchChatList) {
                    fetchChatList();
                }
                closeEmployeeSearchModal();
            } catch (error) {
                console.error("채팅방 생성 중 오류 발생:", error);
            }
        } else {
            // 쪽지 - 선택된 직원 목록 전달
            if (selectedEmployees.length > 0) {
                onSelectedEmployees(selectedEmployees);
            }
            closeEmployeeSearchModal();
        }
        console.log("선택된 직원", selectedEmployees);
    };


    return (
    <div className="modal_overlay" onMouseDown={handleBackgroundClick}>
        <div className="modal_container search search_employee">
            <div className="header">
                <div>직원 검색</div>
                <button className="btn_close" onClick={closeEmployeeSearchModal}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="search_wrap">
                <div className={`search_box ${employeeSearchText ? 'has_text' : ''}`}>
                    <label className="label_floating">이름, 부서, 직급</label>
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        className="box search"
                        value={employeeSearchText}
                        onChange={handleEmployeeSearchTextChange}
                        style={{width: '280px'}}
                    />
                    {/* 검색어 삭제 버튼 */}
                    {employeeSearchText && (
                        <button
                            className="btn-del"
                            onClick={() => handleSearchDel(setEmployeeSearchText)}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    )}
                </div>
                <div className="create-wrap">
                    <button
                        className="btn-create"
                        onClick={createHandler}
                    >
                        확인
                    </button>
                </div>
            </div>
            <div className="table_wrap">
                {/* 검색 결과가 있을 경우 목록을 출력 */}
                <table>
                    <thead>
                    <tr>
                        <th>
                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
                            </div>
                        </th>
                        <th>이름</th>
                        <th>부서</th>
                        <th>직급</th>
                    </tr>
                    </thead>
                    <tbody>
                    {searchLoading ? (
                        <tr className="tr_empty">
                            <td colSpan="4">
                                <div className="loading">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </td>
                        </tr>
                    ) : employeeData.content?.length > 0 ? (
                        /* 검색된 직원 목록을 출력 */
                        employeeData.content.map((employee) => (
                            <tr key={employee.employeeId}
                                onClick={() => handleSelectEmployee(employee.employeeId, employee.employeeName, employee.departmentName, employee.jobName)}>
                                {/* 체크박스 */}
                                <td>
                                    <div className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.some(selected => selected.employeeId === employee.employeeId)} // 수정 부분
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => handleSelectEmployee(employee.employeeId, employee.employeeName, employee.departmentName, employee.jobName)}
                                        />
                                    </div>
                                </td>
                                {/* 직원 이름 */}
                                <td>{employee.employeeName || '-'}</td>
                                {/* 직원 부서 */}
                                <td>{employee.departmentName || '-'}</td>
                                {/* 직원 직급 */}
                                <td>{employee.jobName || '-'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr className="tr_empty">
                            <td colSpan="4">
                                <div className="no_data">조회된 결과가 없습니다.</div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

            </div>
            {/* 선택된 직원 목록 */}
            <div className="selected-employees">
                <ul className="selected-employees-list">
                    {selectedEmployees.map((employee) => (
                        <li
                            key={employee.employeeId}
                            className="selected-employee-item"
                            onClick={() => handleRemoveSelectedEmployee(employee.employeeId)}
                        >
                            {employee.employeeName}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSelectedEmployee(employee.employeeId);
                                }}
                            >
                                <TiDelete/>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 페이지네이션 */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                searchLoading={searchLoading}
                handlePage={handlePageChange}
                handleItemsPerPageChange={handleItemsPerPageChange}
                showFilters={false}
            />
        </div>
    </div>
);
}

export default EmployeeSearchModal;
