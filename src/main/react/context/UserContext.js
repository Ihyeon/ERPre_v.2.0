import React, {createContext, useState, useEffect, useRef} from 'react';
import axios from 'axios';
import {useNoteHooks} from "../components/messenger/useNoteHooks";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

// 전역 변수 생성
export const UserContext = createContext();

// 데이터 전달
export const UserProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const stompClientRef = useRef(null); // WebSocket 클라이언트 참조

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
        const socket = new SockJS('http://localhost:8787/talk', null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
        });
        const stompClient = Stomp.over(socket);
        stompClient.debug = () => {}; // 디버깅 로그 비활성화
        stompClientRef.current = stompClient;

        stompClient.connect({}, () => {
            console.log("전역 WebSocket 연결 성공")

            // // 쪽지 구독
            // stompClient.subscribe('/user/queue/note', (noteResponse) => {
            //     const receivedNote = JSON.parse(noteResponse.body);
            //     console.log("수신 쪽지:", receivedNote);
            // });
        });

        stompClient.reconnectDelay = 10000;
        stompClient.activate();

        return () => {
            stompClient.deactivate()
                .then(() => console.log("전역 WebSocket 연결 해제 성공"))
                .catch((error) => console.log("전역 WebSocket 해제 오류", error));
        };
    }, []);


    return (
        <UserContext.Provider value={{ user, setUser, stompClientRef }}>
            {children}
        </UserContext.Provider>
    );
};
