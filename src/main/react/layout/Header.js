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
import {UserContext} from "../context/UserContext";
import {useNoteHooks} from "../components/messenger/useNoteHooks";
import {connected} from "process";


function Header() {

    const { user, stompClientRef } = useContext(UserContext);
    const { isMessengerOpen, setMessengerOpen } = useContext(MessengerContext);

    const {
        noteList,
        setNoteList,
        fetchData,
    } = useNoteHooks();

    const handleCloseReceivedNoteModal = () => setNewNote(null); // 수신 쪽지 모달 닫기
    const [newNote, setNewNote] = useState(null); // 수신 쪽지 state

    // 메신저 토글
    const toggleMessenger = () => {
        setMessengerOpen(!isMessengerOpen);
    };

    const handleEmailClick = () => {
        window.location.href = '/sentMail';
    }

    useEffect(() => {
        const stompClient = stompClientRef.current;

        if (!stompClient) {
            console.error("🚨 stompClientRef.current가 초기화 실패");
            return;
        }

        // WebSocket 연결 상태 확인
        const checkConnection = () => {
            if (stompClient.connected) {
                console.log("✅ 쪽지 WebSocket 연결 성공");
                subscribeToNotes();
            } else {
                console.log("⏳ WebSocket 연결 대기");
                stompClient.activate();
            }
        };

        // 쪽지 구독
        const subscribeToNotes = () => {
            if (stompClient.subscription) {
                console.log("⚠️ 이미 구독이 활성화");
                return;
            }

            const subscription = stompClient.subscribe('/user/queue/note', (noteResponse) => {
                const receivedNote = JSON.parse(noteResponse.body);
                console.log("수신 쪽지:", receivedNote);

                setNoteList(prev => [receivedNote, ...prev]);

                fetchData()
                    .then(() => {
                        setNewNote(receivedNote);
                        console.log("쪽지 목록 동기화 완료");
                    })
                    .catch(error => {
                        console.error("쪽지 데이터 업데이트 실패:", error);
                    });
            });
            stompClient.subscription = subscription;
        };

        stompClient.onConnect = () => {
            console.log("✅ 쪽지 WebSocket 연결 성공");
            subscribeToNotes();
        };

        stompClient.onDisconnect = () => {
            console.log("❌ 쪽지 WebSocket 연결 끊김");
        };

        checkConnection();

        return () => {
            if (stompClient.subscription) {
                stompClient.subscription.unsubscribe();
                console.log("❌ 쪽지 구독 해제");
                stompClient.subscription = null;
            }
        };
    }, [stompClientRef, fetchData, setNoteList]);

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
