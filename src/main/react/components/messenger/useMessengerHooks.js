import React, {useCallback, useContext, useEffect, useState} from "react";
import axios from "axios";
import { useDebounce } from "../common/useDebounce";
import useSearch from "./useSearch";
import {UserContext} from "../../context/UserContext";


export const useMessengerHooks = () => {


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