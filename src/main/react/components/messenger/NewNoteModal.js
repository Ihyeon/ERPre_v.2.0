import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import Draggable from "react-draggable";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CustomToolbar } from "./CustomToolbar";
import SockJS from "sockjs-client";
import {FaRegPlusSquare} from "react-icons/fa";
import { Client as StompClient } from '@stomp/stompjs';
import { UserContext } from "../../context/UserContext";
import UseSearch from "./useSearch";
import EmployeeSearchModal from "./EmployeeSearchModal";
import axios from "axios";

// NewNoteModal.js (Note.css): 쪽지 전송 모달 컴포넌트
// 쪽지 작성 및 전송
// 파일 첨부 (로컬 저장소에 저장, 추후 클라우드 스토리지로 확장 가능)
// 예약 전송 및 수신자 선택 (추후 이름 입력시 자동완성 되는 기능 확장 가능)
// ReactQuill 에디터 커스터마이징 (CustomToolbar 사용)
const NewNoteModal = ({ closeNewNoteModal }) => {

    const { user, setUser } = useContext(UserContext); // 사용자 정보 

    const [receivers, setReceivers] = useState([]); // 선택된 수신 직원 목록
    const [noteContent, setNoteContent] = useState(""); // 발신 메세지
    const [sendToMe, setSendToMe] = useState(false); // 나에게 보내기 여부
    const [scheduledSend, setScheduledSend] = useState(false); // 예약 전송 여부
    const [scheduledDate, setScheduledDate] = useState(""); // 예약 날짜
    const [searchKeyword, setSearchKeyword] = useState(""); // 직원 검색 텍스트
    const [isAutocompleteVisible, setAutocompleteVisible] = useState(false); // 자동완성 목록 상태
    const [selectedIndex, setSelectedIndex] = useState(-1); // 자동완성 목록에서 현재 선택된 인덱스
    const [isEmployeeSearchModalOpen, setEmployeeSearchModalOpen] = useState(false); // 직원 검색 모달 상태
    const stompClientRef = useRef(null); // WebSocket 클라이언트 참조
    const quillRef = useRef(null); // ReactQuill 참조
    const autocompleteRef = useRef(null); // 자동완성 목록 참조
    const inputRef = useRef(null); // 입력 필드 참조

    // 직원 검색
    const {data: employeeData =[], fetchData} = UseSearch(
        "/api/messengers/note/employeeList",
        searchKeyword
    );

    const openEmployeeSearchModal = () => setEmployeeSearchModalOpen(true);
    const closeEmployeeSearchModal = () => setEmployeeSearchModalOpen(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                autocompleteRef.current &&
                !autocompleteRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)
            ) {
                setAutocompleteVisible(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setAutocompleteVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // 자동완성 목록 검색 키워드 변경 핸들러
    const handleInputChange = (e) => {
        const keyword = e.target.value;
        setSearchKeyword(keyword);
        setSelectedIndex(-1);
        if (keyword.trim() === "") {
            setAutocompleteVisible(false);
        } else {
            setAutocompleteVisible(true);
        }
    };

    // 자동완성 목록 키보드 입력 처리
    const handleKeyDownAutocomplete = (e) => {
        if (!isAutocompleteVisible || employeeData.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prevIndex) =>
                (prevIndex + 1) % employeeData.length
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prevIndex) =>
                (prevIndex - 1 + employeeData.length) % employeeData.length
            );
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            handleAddReceiver(employeeData[selectedIndex]);
            setAutocompleteVisible(false);
        }
    };


    // 검색된 직원 추가
    const handleAddReceiver = (employee) => {
        setReceivers((prevReceivers) => {
            if (prevReceivers.some((r) => r.employeeId === employee.employeeId)) return prevReceivers;
            return [...prevReceivers, employee];
        });
        setSearchKeyword("");
        setSelectedIndex(-1);
    };

    // 수신 직원 추가
    const onSelectedEmployees = (selectedEmployees) => {

        const newReceivers = selectedEmployees.filter(
            (newEmployee) => !receivers.some((r) => r.employeeId === newEmployee.employeeId)
        ).map((employee) => ({ ...employee }));

        setReceivers([...receivers, ...newReceivers]);

        closeEmployeeSearchModal();
    };

    // 수신 직원 제거
    const handleRemoveReceiver = (employeeId) => {
        setReceivers(receivers.filter((r) => r.employeeId !== employeeId));
    };

    // 파일 업로드 핸들러
    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "*"); // 모든 파일 유형 허용
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                // 파일 업로드 로직 추가 (서버에 업로드하거나 로컬에서 처리)
                console.log("선택된 파일:", file);
                // // 예시로 파일 이름을 에디터에 삽입
                // const quill = quillRef.current.getEditor();
                // quill.insertText(quill.getSelection().index, `[파일: ${file.name}]`);
            }
        };
    };

    // 쪽지 전송 함수
    const handleSendNote = async () => {
        try {
            const receiverIds = sendToMe ? [] : receivers.map(r => r.employeeId);

            if (!sendToMe && receiverIds.length === 0) {
                console.error('받는 사람이 선택되지 않았습니다.');
                return;
            }

            if (sendToMe && user && user.employeeId) {
                receiverIds.push(user.employeeId);
            }

            const newNote = {
                employeeName: user.employeeName,
                noteReceiverIds: receiverIds,
                noteContent,
                noteSendDate: scheduledSend ? scheduledDate : null,
            };

            // WebSocket 연결이 설정되었는지 확인 후 send 호출
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.publish({
                    destination: "/app/note",
                    body: JSON.stringify(newNote),
                });
                console.log("전송된 쪽지:", newNote);
            } else {
                console.error("쪽지 WebSocket 연결이 설정되지 않았습니다.");
            }
            closeNewNoteModal();

        } catch (error) {
            console.error('쪽지 전송 오류:', error);
        }
    };

    // 웹소켓 연결
    useEffect(() => {
        const socket = new SockJS('http://localhost:8787/talk');

        stompClientRef.current = new StompClient({
            webSocketFactory: () => socket,
            reconnectDelay: 10000,
            onConnect: () => {
                console.log("쪽지 전송 WebSocket 연결 성공");
            },
            onDisconnect: () => console.log("쪽지 WebSocket 연결이 닫혔습니다."),
        });

        stompClientRef.current.activate();

        return () => {
            stompClientRef.current.deactivate()
                .then(() => console.log("쪽지 WebSocket 연결이 성공적으로 해제되었습니다."))
                .catch((error) => console.error("WebSocket 해제 중 오류:", error));
        };
    }, []);

    // Quill 모듈 설정
    const quillModules = useMemo(() => {
        return {
            toolbar: {
                container: "#toolbar",
                handlers: {
                    upload: handleFileUpload,
                }
            },
        }
    },[]);

    useEffect(() => {
        fetchData().then(() => {
            console.log("자동완성 직원 데이터", employeeData);
        }).catch((error) => {
            console.error("자동완성 직원 데이터 조회 오류:", error);
        });
    }, [searchKeyword])

    return (
        <>
            <Draggable>
                <div className="new-note-modal">
                    {/*<div className="note-modal-header">*/}
                    {/*    <h2></h2>*/}
                    {/*</div>*/}
                    <div className="note-modal-body">
                        {/* 수신자 선택 섹션 */}
                        <div className="receiver-section">
                            <label>받는 사람</label>
                            <button
                                className="note-employee-search"
                                onClick={openEmployeeSearchModal}
                            >
                                <FaRegPlusSquare/>
                            </button>
                            <div className="receiver-input-container">
                                <div className="selected-receivers">
                                    {receivers.map((employee) => (
                                        <span key={employee.employeeId} className="receiver-tag">
                                                {employee.employeeName}
                                            <button onClick={() => handleRemoveReceiver(employee.employeeId)}>
                                                     &times;
                                             </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        ref={inputRef}
                                        placeholder={receivers.length === 0 ? "직원 이름을 직접 입력하거나 + 버튼을 눌러 직원을 검색하세요." : ''}
                                        value={searchKeyword}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDownAutocomplete}
                                        onFocus={() => searchKeyword && setAutocompleteVisible(true)}
                                        className="receiver-input"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* 자동완성 조회 목록 */}
                        {isAutocompleteVisible && searchKeyword.trim() !== "" && (
                            <ul className="autocomplete-suggestions" ref={autocompleteRef}>
                                {employeeData.length === 0 ? (
                                    <li>검색 결과가 없습니다</li>
                                ) : (
                                    employeeData.map((employee, index) => (
                                        <li
                                            key={employee.employeeId}
                                            className={index === selectedIndex ? "selected" : ""}
                                            onClick={() => handleAddReceiver(employee)}
                                        >
                                            {employee.employeeName} ({employee.jobName}, {employee.departmentName})
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}

                        {/* 전송 옵션 */}
                        <div className="options">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sendToMe}
                                    onChange={() => setSendToMe(!sendToMe)}
                                />
                                나에게 보내기
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={scheduledSend}
                                    onChange={() => setScheduledSend(!scheduledSend)}
                                />
                                예약 전송
                            </label>
                            {scheduledSend && (
                                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 에디터 */}
                        {/* Custom Toolbar: 파일 업로드 버튼을 포함한 에디터 툴바 */}
                        <CustomToolbar handleFileUpload={handleFileUpload}/>

                        {/* ReactQuill: 에디터 */}
                        <ReactQuill
                            theme="snow"
                            value={noteContent}
                            onChange={setNoteContent}
                            modules={quillModules}
                            className="note-textarea"
                            ref={quillRef}
                        />
                        {/* 버튼 */}
                        <div className="note-footer">
                            <button className="send-button" onClick={handleSendNote}>보내기</button>
                            <button onClick={closeNewNoteModal} className="cancel-button">닫기</button>
                        </div>
                    </div>
                </div>
            </Draggable>

            {/* 직원 검색 모달 */}
            {isEmployeeSearchModalOpen && (
                <EmployeeSearchModal
                    closeEmployeeSearchModal={closeEmployeeSearchModal}
                    onSelectedEmployees={onSelectedEmployees}
                    createUrl=""
                />
            )}

        </>
    );
};

export default NewNoteModal;
