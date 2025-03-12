// ✏️
// 상태 필터링에서 'null' 값으로 디폴트(전체)를 표현할지, 'all' 이라는 명시적인 값을 보내서 판단하게 할지 -> 추후 유지보수가 용이하도록 명시적인 값 사용, default = 'all'

import React, {useContext, useEffect} from 'react';
import Select from "react-select";
import Tree from "rc-tree";
import {FaGlobe, FaUserAlt, FaUserAltSlash, FaUserCircle } from "react-icons/fa";
import {UserContext} from "../../context/UserContext";
import InfoDetailModal from "./InfoDetailModal";
import NewNoteModal from "./NewNoteModal";
import ChatRoomModal from "./ChatRoomModal";
import {useMessengerHomeHooks} from "./useMessengerHomeHooks";

// MessengerHome.js (Messenger.css): 메신저 홈 컴포넌트
const MessengerHome = () => {

    const {

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

    } = useMessengerHomeHooks();

    // Context: 전역 변수 관리
    const { user, stompClientRef } = useContext(UserContext);

    useEffect(() => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            const subscription = stompClientRef.current.subscribe('/topic/status', (statusResponse) => {
                const statusUpdate = JSON.parse(statusResponse.body);
                console.log("조직도 업데이트 성공:", statusUpdate);
                setTreeData((prevData) => updateTreeWithNewStatus(prevData, statusUpdate));
            });
            return () => {
                subscription.unsubscribe();
                console.log("상태 구독 해제");
            };
        }
    }, [stompClientRef.current?.connected, setTreeData, updateTreeWithNewStatus]);


    return (
        <div>
        {/* 검색 및 필터 */}
        <div className="search-wrap">
            <div className={`search_box ${searchKeyword ? 'has_text' : ''}`}>
                <label className="label_floating">
                    이름, 부서, 직급
                </label>
                <i className="bi bi-search"></i>
                <input
                    type="text"
                    className="box search"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{width: '190px'}}
                />

                {/* 검색어 삭제 버튼 */}
                {searchKeyword && (
                    <button
                        className="btn-del"
                        onClick={() => setSearchKeyword('')}
                    >
                        <i className="bi bi-x"></i>
                    </button>)}
            </div>

            {/* 상태 필터 버튼 */}
            <div className="org-status">
                <button onClick={statusFilter} className={orgStatus === 'all' ? 'btn1' : orgStatus === 'online' ? 'btn2' : 'btn3'}>
                    {orgStatus === 'all' && <FaGlobe />}
                    {orgStatus === 'online' && <FaUserAlt />}
                    {orgStatus === 'offline' && <FaUserAltSlash />}
                </button>
            </div>
        </div>

        <div className="messenger-content" onClick={() => setContextMenu({...contextMenu, visible: false})}>

            {/* 🟣 상단 유저 프로필 */}
            <div className="messenger-user">
                <div className="erpre-logo">
                    {user?.employeeImageUrl ? (<img src={user.employeeImageUrl} alt="프로필 사진"/>) : (<FaUserCircle/>)}
                </div>
                <div className="info">
                    <div className="info-wrapper">
                        <div className="user-name">{user?.employeeName || ''}</div>
                        <div className="profile status">
                            {/* react-select 라이브러리를 사용한 유저 상태 셀렉트 박스 */}
                            <div className="status-select-wrapper">
                                <Select
                                    value={userIcon.find(option => option.value === user?.employeeStatus)}
                                    onChange={updateStatus}
                                    options={userIcon}
                                    styles={customStyles}
                                    isSearchable={false}
                                    components={{ Option, SingleValue }}
                                />
                            </div>
                        </div>
                    </div>
                    <button className="status-message" onClick={handleStatusMessage}>
                        {user?.employeeStatusMessage || '상태 메시지를 입력해주세요.'}
                    </button>
                </div>
            </div>

            {/* 직원 조직도 */}
            <Tree
                treeData={treeData}
                expandedKeys={expandedKeys} // 현재 확장된 키
                onExpand={(keys) => setExpandedKeys(keys)} // 확장/축소 이벤트 콜백 함수
                showIcon={false}
                showLine={true}
                onRightClick={handleRightClick}
                virtual={false}
            />

            {/* 🟡 우클릭 메뉴  */}
            {contextMenu.visible && (
                <div
                className="context-menu"
                style={{ top: `${contextMenu.y}px`,  left: `${contextMenu.x}px` }}
            >
                <ul>
                    <li onClick={() => handleMenuClick('viewDetail')}> 상세정보 </li>
                    <li onClick={() => handleMenuClick('sendNote')}> 쪽지보내기 </li>
                    <li onClick={() => handleMenuClick('startChat')}> 채팅하기 </li>
                </ul>
            </div>)}

            {/* 🟡 상세정보 모달 */}
            {isModalOpen.info && (
                <InfoDetailModal
                    employeeId={selectedEmployee[0]?.employeeId}
                    closeInfoModal={() => closeModal('info')}
                />
            )}

            {/* 🟡 쪽지보내기 모달 */}
            {isModalOpen.note && (
                <NewNoteModal
                    closeNewNoteModal={() => closeModal('note')}
                    initialRecipients={selectedEmployee}
                />
            )}

            {/* 🟡 채팅방 모달 */}
            {isModalOpen.chat && selectedChatNo && (
                <ChatRoomModal
                    closeChatModal={() => closeModal('chat')}
                    chatNo={selectedChatNo}
                    chatTitle={selectedEmployee[0]?.employeeName}
                />
            )}

        </div>
    </div>);
};

export default MessengerHome;