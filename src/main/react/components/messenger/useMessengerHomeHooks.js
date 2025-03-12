import React, {useCallback, useContext, useEffect, useState} from "react";
import axios from "axios";
import useSearch from "./useSearch";
import {UserContext} from "../../context/UserContext";
import MySwal from "sweetalert2";
import {FaUserAlt, FaUserAltSlash, FaUtensils} from "react-icons/fa";
import {MdMeetingRoom, MdWork} from "react-icons/md";
import {PiOfficeChairFill} from "react-icons/pi";

// 🟣 유저 상태 관리
// 🟢 조직도(트리 구조) 렌더링 및 상태 필터링
// ⚪ 웹소켓을 통한 유저 상태 실시간 업데이트 (온라인 상태 및 상태 메시지)
// 🟡 우클릭 메뉴의 유저 상세정보, 쪽지, 채팅방 모달 관리
export const useMessengerHomeHooks = () => {

    // Context: 전역 변수 관리
    const { user, setUser, stompClientRef } = useContext(UserContext);

    // 🟡 우클릭 메뉴의 모달 상태 관리
    const [isModalOpen, setModalOpen] = useState({info: false, note: false, chat: false}); // 모달 열림 상태

    // 🟢 조직도 상태 관리
    const [orgStatus, setOrgStatus] = useState(() => { const employeeId = user?.employeeId; return employeeId ? localStorage.getItem(`orgStatus_${employeeId}`) || "all"  : "all";}); // 조직도 상태 필터링 (초기 상태: 로컬에 저장된 값)
    const [searchKeyword, setSearchKeyword] = useState(''); // 검색어 상태
    const [treeData, setTreeData] = useState([]); // 트리 데이터 상태
    const [expandedKeys, setExpandedKeys] = useState([]); // 확장된 트리 키 상태

    // 🟡 우클릭 메뉴 상태 관리
    const [selectedEmployee, setSelectedEmployee] = useState([]); // 선택된 직원 정보
    const [selectedChatNo, setSelectedChatNo] = useState(null); // 선택된 채팅방 정보
    const [contextMenu, setContextMenu] = useState({visible: false, x: 0, y: 0, node: null}); // 우클릭 컨텍스트 메뉴 상태

    // 🟣 react-select 커스텀 스타일
    const customStyles = {

        // 전체 컨트롤 영역
        control: (provided) => ({
            ...provided,
            minHeight: '30px',
            height: '30px',
            fontSize: '14px',
            display: 'flex',
            width: 'auto',
            minWidth: '120px',
            maxWidth: '150px',
            border: 'none',
            boxShadow: 'none',
            marginRight: '0',
        }),

        // 선택된 값이 표시되는 영역
        valueContainer: (provided) => ({
            ...provided,
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 4px',
        }),

        // 드롭다운 및 입력 아이콘의 컨테이너
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '28px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '0',
            marginLeft: '0px',
        }),

        // 드롭다운 화살표 아이콘의 스타일
        dropdownIndicator: (provided) => ({
            ...provided,
            transition: 'none',
            padding: '0',
            marginRight: '2px',
            cursor: 'pointer'
        }),

        // 드롭다운 아이콘과의 구분선
        indicatorSeparator: () => ({
            display: 'none',
        }),

        // 각 옵션의 스타일
        option: (provided, state) => ({
            ...provided,
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            height: '40px',
        }),

        // 선택된 값이 표시되는 영역
        singleValue: (provided, state) => ({
            ...provided,
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
            marginLeft: '0',
            justifyContent: 'flex-end',
            lineHeight: '1',
        }),

        // 드롭다운 메뉴 스타일
        menu: (provided) => ({
            ...provided,
            top: '100%',
            position: 'absolute',
            marginTop: '0',
            borderRadius: '0',
            width: 'auto',
            left: '26px',
            fontSize: '14px',
            padding: '0px 3px 0px 1px',
        }),
    };

    // 🟣 react-select: 드롭다운 옵션에 아이콘과 라벨을 표시하는 커스텀 컴포넌트
    const Option = (props) => {
        return (
            <div {...props.innerProps} className="custom-option">
                {props.data.icon} {/* 상태 아이콘 */}
                <span className="label">{props.label}</span> {/* 상태 라벨 */}
            </div>
        );
    };

    // 🟣 react-select: 선택된 값에 아이콘과 라벨을 표시하는 커스텀 컴포넌트
    const SingleValue = (props) => {
        return (
            <div {...props.innerProps} className="custom-option">
                {props.data.icon} {/* 상태 아이콘 */}
                <span className="label">{props.data.label}</span> {/* 상태 라벨 */}
            </div>
        );
    };

    // 🟣 유저 상태 옵션 목록
    const userIcon = [
        {value: 'online', label: '온라인', icon: <FaUserAlt color="#28A745"/>},
        {value: 'offline', label: '오프라인', icon: <FaUserAltSlash color="#6c757d"/>},
        {value: 'eating', label: '식사중', icon: <FaUtensils color="#ffc107"/>},
        {value: 'working', label: '업무중', icon: <MdWork color="#17a2b8"/>},
        {value: 'meeting', label: '회의중', icon: <MdMeetingRoom color="#007bff"/>},
        {value: 'absent', label: '부재중', icon: <PiOfficeChairFill color="#dc3545"/>}
    ];

    // 🟡 모달 열기 및 닫기 함수
    const openModal = (type) => { setModalOpen(prev => ({...prev, [type]: true})); };
    const closeModal = (type) => { setModalOpen(prev => ({...prev, [type]: false})); };

    // 🟢 상태 필터링 버튼 클릭 핸들러
    const statusFilter = () => {
        const nextStatus = { all: "online", online: "offline", offline: "all" };
        const newStatus = nextStatus[orgStatus]; // orgStatus의 값이 키 중 하나와 일치할 경우, 해당 키의 값을 반환
        setOrgStatus(newStatus);
        localStorage.setItem(`orgStatus_${user.employeeId}`, newStatus);
    };

    // 🟢 공통 검색 훅: 검색 키워드 및 상태 기반으로 조직도 데이터 가져오기
    const {data: employeeData} = useSearch('/api/messengers/organization', searchKeyword, orgStatus); // 구조 분해 할당시 이름 변경

    // 🟡 우클릭 이벤트 핸들러: 컨텍스트 메뉴 표시
    const handleRightClick = (info) => {
        // console.log("우클릭 이벤트 동작", info);
        // console.log("선택된 직원 아이디", info.node.key);
        info.event.preventDefault(); // 브라우저의 기본 우클릭 메뉴 비활성화
        info.event.stopPropagation(); // 우클릭 이벤트가 부모 컴포넌트로 전파되지 않도록 차단

        if (!info.node.isLeaf) { return; }

        const x = info.event.pageX;
        const y = info.event.pageY;

        const menuWidth = 150; // 메뉴의 너비
        const menuHeight = 100; // 메뉴의 높이
        const windowWidth = window.innerWidth; // 브라우저 창의 너비
        const windowHeight = window.innerHeight; // 브라우저 창의 높이

        // 화면을 벗어나지 않도록 메뉴 위치 조정
        let adjustedX = x;
        let adjustedY = y;
        if (x + menuWidth > windowWidth) { adjustedX = windowWidth - menuWidth - 10; }
        if (y + menuHeight > windowHeight) { adjustedY = windowHeight - menuHeight - 10; }

        setContextMenu( { visible: true, x: adjustedX, y: adjustedY, node: info.node});
        setSelectedEmployee([{ employeeId: info.node.key, employeeName: info.node.title.props.children[1].props.children[0] }]);
    };

    // 🟡 컨텍스트 메뉴 클릭 핸들러
    const handleMenuClick = async (action) => {

        // 메뉴 숨기기
        setContextMenu((prev) => ({ ...prev, visible: false, x: prev.x, y: prev.y, node: prev.node }));

        if (action === 'viewDetail') {
            openModal("info");
        } else if (action === 'sendNote') {
            openModal("note");
        } else if (action === 'startChat') {
            try {
                const response = await axios.post('/api/messengers/chat/create', selectedEmployee.map(emp => emp.employeeId));
                const chatNo = response.data.chatNo;
                setSelectedChatNo(chatNo);
                openModal("chat");
            } catch (error) {
                console.error("채팅방 생성 중 오류 발생:", error);
            }
        }
    };

    // 🟢 상태별 아이콘 가져오기 함수
    const getStatusIcon = (status) => {
        const employeeStatus = status || 'offline';
        const iconObj = userIcon.find((icon) => icon.value === employeeStatus);
        return iconObj ? (
            <span className="valid-status-icon">
                {iconObj.icon}
            </span>
        ) : null;
    };

    // 🟢 직원 데이터 기반의 조직도 트리 구조 생성
    const createOrgTree = (data) => {
        // 부서 중복 여부 관리
        const departmentMap = {};

        // 최상위 노드(루트 노드) 생성
        const tree = [{
            key: "0",
            title: (
                <div className="org-tree-root">
                    Erpre
                </div>),
            children: [] // 루트 노드 하위에 추가될 부서 및 직원 노드 저장
        }];

        // 직원 데이터를 순회하며 부서와 직원 노드 생성
        data.forEach((employee) => {
            const departmentName = employee.departmentName;

            // 직원 정보를 트리에 추가할 노드로 변환
            const employeeNode = {
                key: employee.employeeId,
                employeeName: employee.employeeName,
                jobName: employee.jobName,
                employeeStatus: employee.employeeStatus,
                employeeStatusMessage: employee.employeeStatusMessage,
                title: (
                    <div className="org-status-wrap">
                        <div className="org-status-icon">
                            {/* 직원 상태 아이콘 */}
                            {getStatusIcon(employee.employeeStatus)}
                        </div>
                        <span>
                            {/* 직원 이름, 직급, 상태메시지 */}
                            {employee.employeeName} {employee.jobName}
                            <span className="org-status-message" title={employee.employeeStatusMessage}>
                                {employee.employeeStatusMessage || ''}
                            </span>
                        </span>
                    </div>
                ),
                isLeaf: true, // 최하위 노드로  설정
            };

            // 부서가 아직 추가되지 않았다면 부서 노드 생성
            if (!departmentMap[departmentName]) {
                const departmentNode = {
                    key: departmentName,
                    title: <span className="org-department-title">{departmentName}</span>,
                    children: [] // 부서 하위에 추가될 직원 노드 저장
                };
                departmentMap[departmentName] = departmentNode; // 부서를 맵에 등록
                tree[0].children.push(departmentNode); // 루트 노드에 부서 추가
            }
            departmentMap[departmentName].children.push(employeeNode); // 부서 노드의 하위에 직원 노드 추가
        });

        return tree;
    };

    // 🟢 트리 데이터를 새로운 상태로 업데이트하는 함수
    const updateTreeWithNewStatus = (treeData, statusUpdate) => {
        const { employeeId, employeeStatus, employeeStatusMessage } = statusUpdate;

        // 트리 노드를 업데이트하는 재귀 함수
        const updateNodeStatus = (treeData) => {
            return treeData.map(node => {
                if (node.key === employeeId) {

                    return {
                        ...node,
                        employeeStatus,
                        employeeStatusMessage,
                        title: (
                            <div className="org-status-wrap">
                                <div className="org-status-icon">
                                    {getStatusIcon(employeeStatus)}
                                </div>
                                <span>
                                {node.employeeName} {node.jobName}
                                    <span className="org-status-message" title={employeeStatusMessage}>
                                    {employeeStatusMessage || ''}
                                </span>
                            </span>
                            </div>
                        )
                    };
                } else if (node.children) {
                    return {
                        ...node, children: updateNodeStatus(node.children),
                    };
                }
                return node;
            });
        };
        return updateNodeStatus(treeData);
    };

    // ⚪ 공통 WebSocket 전송 함수
    const sendStatusUpdate = async (updateType, updateData) => {

        if (!stompClientRef.current) {
            console.error("WebSocket이 연결되지 않았습니다.");
            window.showToast("WebSocket 연결 오류");
            return;
        }

        try {
            stompClientRef.current.send('/app/status', {}, JSON.stringify({ [updateType]: updateData }));
            setUser((prevUser) => ({ ...prevUser,  [updateType]: updateData, }));

            if (updateType === "employeeStatus") {
                window.showToast("상태가 변경되었습니다.");
            } else if (updateType === "employeeStatusMessage") {
                await MySwal.fire({
                    title: "저장 완료",
                    text: "상태 메시지가 변경되었습니다.",
                    icon: "success",
                });
            }

        } catch (error) {
            console.error(`${updateType} 변경 중 오류가 발생했습니다:`, error);
            window.showToast("변경 중 오류가 발생했습니다.");
        }
    };

    // ⚪ 상태 업데이트 전송 함수
    const updateStatus = async (selectedOption) => {
        const newStatus = selectedOption.value;
        await sendStatusUpdate("employeeStatus", newStatus);
    };

    // ⚪ 상태 메시지 업데이트 전송 함수
    const updateStatusMessage = async (newStatusMessage) => {
        await sendStatusUpdate("employeeStatusMessage", newStatusMessage);
    };

    // 🟣 상태 메시지 변경 알림창
    async function handleStatusMessage() {
        const result = await MySwal.fire({
            title: '상태 메시지 변경',
            input: 'text',
            inputPlaceholder: '50자 이하',
            inputAttributes: {
                maxlength: 50,
                'aria-label': '50자 이하',
                autocomplete: 'off',
            },
            showCancelButton: true,
            confirmButtonText: '저장',
            cancelButtonText: '취소',
            preConfirm: (newStatusMessage) => {
                if (!newStatusMessage) {
                    MySwal.showValidationMessage('상태 메시지를 입력해주세요');
                    return false;
                }
                return newStatusMessage;
            },
        });
        if (result.isConfirmed && result.value) {
            await updateStatusMessage(result.value);
        }
    }

    // 🟢 트리 구조의 모든 노드에서 키를 추출하여 초기 확장 상태에 사용
    const extractKeys = (nodes) => {
        let keys = [];
        nodes.forEach(node => {
            keys.push(node.key);
            if (node.children) {
                keys = keys.concat(extractKeys(node.children));
            }
        });
        return keys;
    };

    // 🟢 트리 구조 생성 및 업데이트
    useEffect(() => {
        if (employeeData.length > 0) {
            const structuredData = createOrgTree(employeeData); // employeeData를 부서별로 그룹화된 트리 데이터로 반환
            setTreeData(structuredData);
            setExpandedKeys(extractKeys(structuredData)); // 트리 구조에서 모든 노드의 키를 추출하여 초기 확장 상태 설정

            // console.log("조직도 직원 데이터", employeeData);
            // console.log("그룹화된 조직도 직원 데이터", structuredData);
        } else {
            setTreeData([]);
            setExpandedKeys([]);
        }
    }, [employeeData]);

    // // ⚪ 웹소켓 구독 연결
    // useEffect(() => {
    //     const socket = new SockJS('http://localhost:8787/talk');
    //     const stompClient = Stomp.over(socket);
    //     stompClientRef.current = stompClient;
    //     stompClient.debug = () => {};
    //
    //     stompClient.connect({}, () => {
    //         console.log("조직도 WebSocket 연결 성공");
    //
    //         // 직원 상태 업데이트 구독
    //         stompClient.subscribe('/topic/status', (statusResponse) => {
    //             const statusUpdate = JSON.parse(statusResponse.body);
    //             console.log("조직도 업데이트 성공:", statusUpdate);
    //             setTreeData((prevData) => updateTreeWithNewStatus(prevData, statusUpdate));
    //         });
    //
    //     }, (error) => {
    //         console.log("조직도 WebSocket 연결 오류:", error);
    //     });
    //
    //     stompClient.reconnectDelay = 10000;
    //     stompClient.activate();
    //
    //     return () => {
    //         stompClient.deactivate()
    //             .then(() => console.log("조직도 WebSocket 연결 해제 성공"))
    //             .catch((error) => console.log("조직도 WebSocket 해제 오류", error));
    //     };
    // }, []);

    // 🟡 컨텍스트 메뉴 외부 클릭 감지하여 메뉴 숨기기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenu.visible && !event.target.closest('.context-menu')) {
                setContextMenu((prev) => ({...prev, visible: false, x: prev.x, y: prev.y, node: prev.node}));
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.visible]);









    // 쪽지 전송 모달 상태 관리
    const [isNewNoteModalOpen, setNewNoteModalOpen] = useState(() => localStorage.getItem('isNewNoteModalOpen') === 'true');
    const openNewNoteModal = () => { setNewNoteModalOpen(true); };
    const closeNewNoteModal = () => { setNewNoteModalOpen(false); };


    // 채팅 목록 state
    const [chatList, setChatList] = useState([]);

    // 개별 채팅 모달
    const [selectedChat, setSelectedChat] = useState(() => localStorage.getItem('selectedChat') || null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(() => localStorage.getItem('isChatModalOpen') === 'true');

    const openChatModal = (chatNo) => {
        setSelectedChat(chatNo);
        setIsChatModalOpen(true);
        localStorage.setItem('selectedChat', chatNo);
        localStorage.setItem('isChatModalOpen', true);
    };

    const closeChatModal = () => {
        setSelectedChat(null);
        setIsChatModalOpen(false);
        localStorage.removeItem('selectedChat');
        localStorage.setItem('isChatModalOpen', false);
    };

    // 목록 조회 fetch data
    const fetchChatList = useCallback(async (keyword) => {
        const params = keyword ? { searchKeyword: keyword } : {};

        try {
            const response = await axios.get('/api/messengers/chat/list', { params });
            const newChatList = response.data;

            console.log("불러온 채팅 데이터", response.data);
            console.log("불러온 채팅 데이터", newChatList);

            // 채팅 목록이 이전과 다를 때만 업데이트
            if (JSON.stringify(chatList) !== JSON.stringify(newChatList)) {
                setChatList(newChatList);
            }
        } catch (error) {
            console.error('채팅 목록 조회 실패:', error);
            if (error.response) {
                console.error('서버 응답 에러:', error.response.data); // 서버 응답 상세 확인
            }
        }
    }, [chatList]);

    // 🟢  검색 state
    const [messengerSearchText, setMessengerSearchText] = useState('');

    // 🟢 검색어 변경 함수
    const handleMessengerSearchTextChange = (event) => {
        setMessengerSearchText(event.target.value);
    }
    const handleSearchDel = () => {
        setMessengerSearchText('')
    }

    return {

        isModalOpen,
        selectedEmployee,
        selectedChatNo,
        setContextMenu,
        treeData,
        expandedKeys,
        setExpandedKeys,
        searchKeyword,
        setSearchKeyword,
        orgStatus,
        statusFilter,
        contextMenu,
        handleRightClick,
        handleMenuClick,
        userIcon,
        updateStatus,
        handleStatusMessage,
        customStyles,
        Option,
        SingleValue,
        updateTreeWithNewStatus,
        setTreeData,
        closeModal,

        // 🟠 쪽지
        isNewNoteModalOpen,
        openNewNoteModal,
        closeNewNoteModal,

        // 🔴 채팅
        chatList,
        setChatList,
        fetchChatList,
        selectedChat,
        isChatModalOpen,
        openChatModal,
        closeChatModal,

        // 🟢 공통
        messengerSearchText,
        setMessengerSearchText,
        handleSearchDel,
        handleMessengerSearchTextChange,

    };
};