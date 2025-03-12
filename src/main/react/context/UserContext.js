import React, {createContext, useState, useEffect, useRef} from 'react';
import axios from 'axios';
import {useNoteHooks} from "../components/messenger/useNoteHooks";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const stompClientRef = useRef(null); // WebSocket 클라이언트 참조
    const [newReceivedNote, setNewReceivedNote] = useState(null);
    const {
        noteList,
        setNoteList,
    } = useNoteHooks();

    // 유저 정보 조회
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('/api/messengers/info', {
                    withCredentials: true, // 쿠키를 포함하여 요청
                });
                if (response.status === 200) {
                    setUser(response.data); // 서버에서 받은 유저 정보를 상태로 저장
                    console.log("전역 유저 업데이트 성공", response.data);
                } else {
                    console.error('전역 유저 업데이트 실패');
                }
            } catch (error) {
                console.error('전역 유저 업데이트 중 오류 발생:', error);
            }
        };
        fetchUser();
    }, []);

    // 전역 웹소켓
    useEffect(() => {
        const socketFactory = () => new SockJS("http://localhost:8787/talk");
        const stompClient = Stomp.over(socketFactory);
        stompClient.debug = () => {};
        stompClient.reconnectDelay = 5000;
        stompClientRef.current = stompClient;

        stompClient.connect({}, () => {
            console.log("전역 WebSocket 연결 성공");
            subscribeToNotes(stompClient);
            });

        // 해제
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate()
                    .then(() => console.log("전역 WebSocket 연결 해제 성공"))
                    .catch((error) => console.log("전역 WebSocket 해제 오류", error));
            }
        };
    }, []);

    // 쪽지 구독
    const subscribeToNotes = (stompClient) => {
        // 중복 구독 방지
        if (stompClientRef.current?.subscriptionNote) {
            console.log("이미 쪽지 구독 중");
            return;
        }

        const subscription = stompClient.subscribe('/user/queue/note', (msg) => {
            const receivedNote = JSON.parse(msg.body);
            console.log("새 쪽지 수신:", receivedNote);

            setNoteList(prev => {
                if (prev.some(n => n.noteNo === receivedNote.noteNo)) return prev;
                return [receivedNote, ...prev];
            });

            setNewReceivedNote(receivedNote);

            // fetchData()
            //   .then(serverList => setNoteList(serverList));
        });
        stompClientRef.current.subscriptionNote = subscription;
    };


    return (
        <UserContext.Provider value={{
            user, setUser,
            noteList, setNoteList,
            stompClientRef,
            newReceivedNote, setNewReceivedNote
        }}>
            {children}
        </UserContext.Provider>
    );
};
