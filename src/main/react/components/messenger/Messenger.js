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
import {useMessengerHomeHooks} from "./useMessengerHomeHooks";
import {string} from "prop-types";

function Messenger({ isOpen, toggleMessenger }) {

    // 활성화된 뷰 관리
    const [activeView, setActiveView] = useState(() => {
        const savedView = localStorage.getItem('activeView');
        return savedView ? savedView : 'home';
    });

    useEffect(() => {
        localStorage.setItem('activeView', activeView);
        // console.log('활성화된 뷰', activeView);
    }, [activeView]);

    // 날짜 변환 함수
    const formatDate = (dateString) => {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "유효하지 않은 날짜";
        }

        // 일-월-년 시:분
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

                    {/* 메신저 본문 동적 뷰*/}
                    {activeView === 'home' && <MessengerHome />}
                    {activeView === 'info' && <Info />}
                    {activeView === 'note' && <Note formatDate={formatDate} />}
                    {activeView === 'chat' && <Chat />}

            </div>
        </div>
    );
}

export default Messenger;
