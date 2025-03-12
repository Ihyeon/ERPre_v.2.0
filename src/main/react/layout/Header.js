import React, {useContext, useEffect, useState} from 'react';
import '../../resources/static/css/common/Header.css';
import {FaBell, FaCommentDots, FaEnvelope} from 'react-icons/fa';
import Messenger from '../components/messenger/Messenger'
import {MessengerContext} from '../context/MessengerContext';
import '../../resources/static/css/messenger/Messenger.css';
import "../../resources/static/css/messenger/Chat.css";
import "../../resources/static/css/messenger/Note.css";
import "../../resources/static/css/messenger/Info.css";
import ReceivedNoteModal from "../components/messenger/ReceivedNoteModal";


function Header() {

    const { isMessengerOpen, setMessengerOpen } = useContext(MessengerContext);

    const handleCloseReceivedNoteModal = () => setNewNote(null); // 수신 쪽지 모달 닫기
    const [newNote, setNewNote] = useState(null); // 수신 쪽지 state

    // 메신저 토글
    const toggleMessenger = () => {
        setMessengerOpen(!isMessengerOpen);
    };

    const handleEmailClick = () => {
        window.location.href = '/sentMail';
    }

    return (
        <header>
            <div className="header-container">
                <div className="logo">
                    <a href="/main"><img src="/img/logo2.png"
                                         alt="IKEA Logo"/><span>Erpenterprise Resource  Planning</span></a>
                </div>
                <div className="header-icons">
                    <FaEnvelope className="header-icon mail" title="메일" onClick={handleEmailClick}/>
                    <FaCommentDots className="header-icon messenger" title="메신저" onClick={toggleMessenger}/>
                    <FaBell className="header-icon alarm" title="알림"/>
                </div>
            </div>
            <div className="bottom-border"></div>

            {/* 메신저 컴포넌트 */}
            <Messenger isOpen={isMessengerOpen} toggleMessenger={toggleMessenger}/>

            {/* 쪽지 수신 모달창 */}
            {newNote && (
                <ReceivedNoteModal
                    note={newNote}
                    onClose={handleCloseReceivedNoteModal}
                />
            )}
        </header>
    );
}

export default Header;
