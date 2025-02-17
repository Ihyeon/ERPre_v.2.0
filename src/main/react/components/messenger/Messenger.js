import React, {useEffect, useState} from 'react';
import "rc-tree/assets/index.css"
import {FaComments, FaInfoCircle} from 'react-icons/fa';
import {BsEnvelope} from "react-icons/bs";
import {SlOrganization} from "react-icons/sl";
import {IoClose} from "react-icons/io5";
import MessengerHome from "./MessengerHome";
import Info from "./Info";
import Note from "./Note";
import Chat from "./Chat";
import {useMessengerHooks} from "./useMessengerHooks";
import {string} from "prop-types";

function Messenger({ isOpen, toggleMessenger }) {

    const {

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

    } = useMessengerHooks();

    // 활성화된 뷰 관리
    const [activeView, setActiveView] = useState(() => {
        const savedView = localStorage.getItem('activeView');
        return savedView ? savedView : 'home';
    });

    // 동적 뷰 변경시 localStorage에 저장
    useEffect(() => {
        localStorage.setItem('activeView', activeView);
        console.log('활성화된 뷰', activeView);
    }, [activeView]);

    // 날짜 변환 함수
    const formatDate = (dateString) => {
        const date = new Date(dateString);

        // 날짜가 유효하지 않으면 기본값 반환
        if (isNaN(date.getTime())) {
            return "유효하지 않은 날짜";
        }

        // 원하는 형식: 일-월-년 시:분
        const year = String(date.getFullYear()).slice(2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    return (
        <div>
            {/* 슬라이드 패널*/}
            <div className={`messenger-panel ${isOpen ? 'open' : ''}`}>

                {/* 사이드바 */}
                <div className="sidebar">
                    {/* 사이드바 상단*/}
                    <div className="messenger-btn top">
                        <button className="btn1" onClick={() => setActiveView('home')}><SlOrganization/></button>
                        <button className="btn2" onClick={() => setActiveView('info')}><FaInfoCircle/></button>
                        <button className="btn4" onClick={() => setActiveView('note')}><BsEnvelope/></button>
                        <button className="btn3" onClick={() => setActiveView('chat')}><FaComments/></button>
                    </div>
                    {/* 사이드바 하단*/}
                    <div className="button bottom"></div>
                </div>
                        {/* 메신저 헤더 */}
                        <div className={`messenger-header ${activeView === 'info' ? 'info-header' : ''}`}>
                            <h3>
                                {activeView === 'home' && 'ERPRE'}
                                {activeView === 'info'}
                                {activeView === 'note' && '쪽지'}
                                {activeView === 'chat' && '채팅'}
                            </h3>
                                <IoClose className="messenger-close" title="닫기" onClick={toggleMessenger}/>
                        </div>

                        {/* 검색창 */}
                        {(activeView == 'chat') && (
                            <div className="search-wrap messenger-search">
                                <div className={`search_box ${messengerSearchText ? 'has_text' : ''}`}>
                                    <label className="label_floating">
                                        '참여자, 채팅방 이름, 메세지 내용'
                                    </label>
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        className="box search"
                                        value={messengerSearchText}
                                        onChange={handleMessengerSearchTextChange}
                                        style={{ width: '265px' }}
                                    />
                                    {/* 검색어 삭제 버튼 */}
                                    {messengerSearchText && (
                                        <button
                                            className="btn-del"
                                            onClick={() => handleSearchDel(setMessengerSearchText)}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* 메신저 본문 동적 뷰*/}
                    {activeView === 'home' && <MessengerHome />}
                    {activeView === 'info' && <Info />}
                    {activeView === 'note' &&
                        <Note formatDate={formatDate} />}
                    {activeView === 'chat' &&
                        <Chat
                            chatList={chatList}
                            setChatList={setChatList}
                            fetchChatList={fetchChatList}
                            formatDate={formatDate}
                            selectedChat={selectedChat}
                            isChatModalOpen={isChatModalOpen}
                            openChatModal={openChatModal}
                            closeChatModal={closeChatModal}
                        />}

            </div>
        </div>
    );
}

export default Messenger;
