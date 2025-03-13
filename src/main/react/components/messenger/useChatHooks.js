import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import useSearch from "./useSearch";
import toast from "../common/Toast";

export const useChatHooks = () => {

    // 채팅 목록 상태
    const [chatList, setChatList] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 채팅 모달 상태
    const [selectedChat, setSelectedChat] = useState(() => localStorage.getItem('selectedChat') || null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(() => localStorage.getItem('isChatModalOpen') === 'true');

    // 우클릭 메뉴 상태
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedChatNo, setSelectedChatNo] = useState(null);

    // 채팅 목록 조회
    const {data: fetchChatList =[], isLoading, fetchData } = useSearch('/api/messengers/chat/list', searchKeyword);

    // 채팅 목록 업데이트
    useEffect(() => {
        if (fetchChatList.length > 0) {
            setChatList(fetchChatList);
        }
    }, [fetchChatList, searchKeyword]);

    // 채팅 모달 열기/닫기
    const openChatModal = (chatNo) => {
        setSelectedChat(chatNo);
        setIsChatModalOpen(true);
        localStorage.setItem('selectedChat', chatNo);
        localStorage.setItem('isChatModalOpen', 'true');
    };

    const closeChatModal = () => {
        setSelectedChat(null);
        setIsChatModalOpen(false);
        localStorage.removeItem('selectedChat');
        localStorage.setItem('isChatModalOpen', 'false');
    };

    // 우클릭 메뉴 열기
    const handleContextMenu = (event, chatNo) => {
        event.preventDefault();
        event.stopPropagation();

        const x = event.pageX;
        const y = event.pageY;

        const menuWidth = 150;
        const menuHeight = 100;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y;

        if (x + menuWidth > windowWidth) {
            adjustedX = windowWidth - menuWidth - 10;
        }

        if (y + menuHeight > windowHeight) {
            adjustedY = windowHeight - menuHeight - 10;
        }

        setMenuPosition({ x: adjustedX, y: adjustedY });
        setSelectedChatNo(chatNo);
        setMenuVisible(true);
    };

    // 우클릭 메뉴 클릭
    const handleMenuClick = (action) => {
        setMenuVisible(false);
        const selectedChat = chatList.find(chat => chat.chatNo === selectedChatNo);

        if (action === 'edit') {
            if (selectedChat) {
                showInputAlert(selectedChat);
            }
        } else if (action === 'leave') {
            if (selectedChat) {
                showDeleteAlert(selectedChat)
            }
        }
    }

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuVisible && !event.target.closest('.context-menu') && !event.target.closest('.chat-item')) {
                setMenuVisible(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [menuVisible]);

    // 검색어 변경
    const handleChange = (e) => {
        setSearchKeyword(e.target.value);
    }

    // 채팅방 이름 수정
    const updateChatTitle = async (chatNo, newTitle) => {
        try {
            const response
                = await axios.put(`/api/messengers/chat/update/title`, { chatNo: chatNo, chatTitle: newTitle })

            console.log('채팅방 이름 업데이트:', response.data)
            window.showToast("채팅방 이름이 업데이트되었습니다.")
            fetchData();
        } catch (error) {
            console.error('채팅방 이름 업데이트 중 오류 발생', error);
        }
    }

    const showInputAlert = (chat) => {
        Swal.fire({
            title: `${chat?.chatTitle}`,
            input: 'text',
            inputLabel: '새로운 채팅방 이름을 입력하세요',
            inputPlaceholder: '50자 이하',
            showCancelButton: true,
            confirmButtonText: '저장',
            cancelButtonText: '취소',
            inputAttributes: {
                autocomplete: 'off'
            },
            inputValidator: (value) => {
                if (!value) {
                    return '공백은 불가능합니다';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newTitle = result.value;
                console.log("새로운 방 제목:", newTitle);
                updateChatTitle(chat.chatNo, newTitle);
            }
        });
    };

    // 채팅방 나가기
    const leaveChatRoom = async (chatNo) => {
        try {
            const response
                = await axios.delete(`/api/messengers/chat/delete/${chatNo}`);
            fetchData();
        } catch (error) {
            console.error('채팅방을 나가는 중 오류 발생', error)
        }
    }

    const showDeleteAlert = (chat) => {
        Swal.fire({
            title: `${chat?.chatTitle}`,
            html: '정말로 이 채팅방을 나가시겠습니까?<br/>퇴장 후 대화 내용은 복구가 불가능합니다',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '나가기',
            cancelButtonText: '취소',
            reverseButtons: true,
            customClass: {
                icon: 'custom-icon-size'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("채팅방에서 나갑니다: 채팅방 ID =", chat.chatNo);
                leaveChatRoom(chat.chatNo);
            }
        });
    };


    return {

        chatList,
        setChatList,
        searchKeyword,
        setSearchKeyword,
        handleChange,
        menuVisible,
        menuPosition,
        handleContextMenu,
        handleMenuClick,
        selectedChat,
        isChatModalOpen,
        openChatModal,
        closeChatModal,
        fetchChatList: fetchData,
        isLoading

    };
};