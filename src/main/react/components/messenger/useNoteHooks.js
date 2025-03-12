import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useSearch from "./useSearch";

// 커스텀 훅: useNoteHooks.js
// 🟠 쪽지 상태 관리
// 🟡 우클릭 메뉴 관리
export const useNoteHooks = () => {

    // 🟠 쪽지 상태 관리
    const [noteList, setNoteList] = useState([]); // 쪽지 목록
    const [isNoteDropdownOpen, setIsNoteDropdownOpen] = useState(false); // 쪽지 필터 메뉴
    const [noteStatus, setNoteStatus] = useState('received'); // 현재 쪽지 필터 상태
    const [searchKeyword, setSearchKeyword] = useState(''); // 검색어 상태
    const [noteDetail, setNoteDetail] = useState(null); // 선택된 쪽지 상세정보
    const options = [
        { label: '받은 쪽지', value: 'received' },
        { label: '새로운 쪽지', value: 'new' },
        { label: '보낸 쪽지', value: 'sent' },
        { label: '보관함', value: 'bookmarked' }
    ]; // 쪽지 상태 필터 옵션

    // 🟡 우클릭 메뉴 상태 관리
    const [contextMenu, setContextMenu] = useState({visible: false, x: 0, y: 0, noteNo: null}); // 우클릭 컨텍스트 메뉴 상태

    // 🟠 쪽지 전송 모달 상태 관리
    const [isNewNoteModalOpen, setNewNoteModalOpen] = useState(() => localStorage.getItem('isNewNoteModalOpen') === 'true');
    const openNewNoteModal = () => { setNewNoteModalOpen(true); };
    const closeNewNoteModal = () => { setNewNoteModalOpen(false); };

    // 🟠 쪽지 필터 핸들러
    const handleNoteStatus = (option) => {
        const newStatus = option?.value || 'received';
        setNoteStatus(newStatus);
        setIsNoteDropdownOpen(false);
        console.log("변경된 노트 상태", newStatus);
    };

    // 🟠 공통 검색 훅: 검색 키워드 및 상태 기반으로 쪽지 데이터 가져오기
    const {data: fetchNoteList =[], isLoading, fetchData } = useSearch('/api/messengers/note/list', searchKeyword, noteStatus); // 구조 분해 할당시 이름 변경

    // 🟠 쪽지 내용을 요약해서 표시하는 함수
    const getPreviewContent = (htmlContent) => {

        const parser = new DOMParser(); // 문자열 HTML을 파싱할 DOMParser 생성
        const doc = parser.parseFromString(htmlContent, "text/html"); // HTML 문자열을 DOM 객체로 변환
        const imgTags = doc.getElementsByTagName("img"); // DOM에서 모든 <img> 태그 추출

        if (imgTags.length >= 1 && doc.body.children.length === imgTags.length) {
            // 이미지
            return "<사진>";
        } else if (imgTags.length > 0) {
            // 이미지와 텍스트 혼합
            return `${doc.body.innerText.substring(0, 20)}... <사진>`;
        } else {
            // 텍스트 단독
            return doc.body.innerText.length > 0
                ? doc.body.innerText.substring(0, 20) + (doc.body.innerText.length > 20 ? '...' : '')
                : "내용 없음";
        }
    };

    // 🟠 쪽지 상세 조회 열기 (읽음 상태 업데이트)
    const handleOpenNote = async (note) => {
        try {
            const response = await axios.put(`/api/messengers/note/${note.noteNo}`);
            setNoteDetail(response.data || note);

            // 🟠 읽음 상태를 UI에 즉시 반영
            setNoteList((prevNotes) =>
                prevNotes.map((n) =>
                    n.noteNo === note.noteNo ? { ...n, noteReceiverReadYn: "Y" } : n
                )
            );

            await fetchData();
        } catch (error) {
            console.error("쪽지 상세 조회 중 오류 발생:", error);
        }
    }

    // 🟠 쪽지 상세 조회 닫기
    const handleCloseNote = () => { setNoteDetail(null); }

    // 🟡 우클릭 이벤트 핸들러: 컨텍스트 메뉴 표시
    const handleRightClick = (event, noteNo) => {
        console.log("우클릭 이벤트 동작", event, "쪽지 번호", noteNo);

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
        if (x + menuWidth > windowWidth) { adjustedX = windowWidth - menuWidth - 10; }
        if (y + menuHeight > windowHeight) { adjustedY = windowHeight - menuHeight - 10; }

        setContextMenu({ visible: true, x: adjustedX, y: adjustedY, noteNo });
    };

    // 🟡 컨텍스트 메뉴 클릭 핸들러
    const handleMenuClick = (action) => {
        setContextMenu((prev) => ({ ...prev, visible: false, x: prev.x, y: prev.y, noteNo: prev.noteNo }));
        const selectedNote = noteList.find(note => note.noteNo === contextMenu.noteNo);

        if (action === 'recall') {
            if (selectedNote) { showRecallAlert(selectedNote); }
        } else if (action === 'delete') {
            if (selectedNote) { showDeleteAlert(selectedNote); }
        }
    };


    //  🟠 북마크 선택/해제 함수
    const handleBookmark = async (note) => {
        const prevBookmarkedYn = note.noteReceiverBookmarkedYn;
        try {
            setNoteList((prevNotes) =>
                prevNotes.map((n) =>
                    n.noteNo === note.noteNo
                        ? { ...n, noteReceiverBookmarkedYn: note.noteReceiverBookmarkedYn }
                        : n
                )
            );
            setNoteDetail((prevDetail) =>
                prevDetail && prevDetail.noteNo === note.noteNo
                    ? { ...prevDetail, noteReceiverBookmarkedYn: note.noteReceiverBookmarkedYn }
                    : { ...note }
            );
            await axios.put(`/api/messengers/note/${note.noteNo}/bookmark`);
            await fetchData(); // 서버 동기화 활성화
        } catch (error) {
            console.error("북마크 업데이트 중 오류:", error);
            setNoteList((prevNotes) =>
                prevNotes.map((n) =>
                    n.noteNo === note.noteNo
                        ? { ...n, noteReceiverBookmarkedYn: prevBookmarkedYn }
                        : n
                )
            );
            setNoteDetail((prevDetail) =>
                prevDetail && prevDetail.noteNo === note.noteNo
                    ? { ...prevDetail, noteReceiverBookmarkedYn: prevBookmarkedYn }
                    : { ...note, noteReceiverBookmarkedYn: prevBookmarkedYn }
            );
            window.showToast("북마크 업데이트에 실패했습니다.");
        }
    };

    // 🟠 쪽지 회수 함수
    const recallNote = async (noteNo) => {
        try {
            setNoteList((prev) => prev.filter((note) => note.noteNo !== noteNo));
            await axios.put(`/api/messengers/note/recall/${noteNo}`);
            window.showToast('쪽지가 회수되었습니다');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                await Swal.fire("회수 불가", "수신자가 이미 쪽지를 읽었기 때문에 회수할 수 없습니다.", "warning");
            } else {
                console.error("쪽지 회수 중 오류 발생:", error);
            }

            await fetchData();
        }
    };

    // 🟠 쪽지 회수 확인 및 경고창
    const  showRecallAlert = (note) => {
        Swal.fire({
            title: "쪽지 회수",
            html: '쪽지를 회수하시겠습니까?<br/>회수 후 쪽지 내용은 수신자에게 보이지 않습니다.',
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "회수",
            cancelButtonText: "취소",
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    console.log("쪽지 회수 성공");
                    await recallNote(note.noteNo); // 개별 삭제
                    window.showToast("쪽지가 회수되었습니다");
                } catch (error) {
                    console.error("쪽지 회수 실패", error);
                    window.showToast("쪽지 회수 중 오류가 발생했습니다");
                }
            }
        });
    };

    // 🟠 쪽지 삭제 함수
    const deleteNote = async (noteStatus = noteStatus, noteNo = null) => {
        try {
            await axios.put(`/api/messengers/note/delete`, null, {
                params: {
                    ...(noteStatus && { noteStatus }), // 전체 쪽지 삭제
                    ...(noteNo && { noteNo }) // 특정 쪽지 삭제인 경우
                }
            });
            setNoteList((prev) =>
                noteNo ? prev.filter((note) => note.noteNo !== noteNo) : []
            );
        } catch (error) {
            console.error('쪽지 삭제 중 오류 발생:', error);
        }
    };

    // 🟠 개별 쪽지 삭제 경고창
    const showDeleteAlert = (note) => {
        return new Promise((resolve) => {
            Swal.fire({
                title: `쪽지 삭제`,
                html: '해당 쪽지를 정말 삭제하시겠습니까?<br/>삭제된 쪽지는 복구할 수 없습니다.<br/>※ 나에게 보낸 쪽지인 경우, 받은 쪽지함과 보낸 쪽지함에서 모두 삭제됩니다.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                reverseButtons: true,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        console.log("삭제 전 noteList:", noteList);
                        await deleteNote(noteStatus, note.noteNo); // 개별 삭제
                        setNoteList((prev) => prev.filter((n) => n.noteNo !== note.noteNo));
                        const updateNotes = await fetchData() || [];
                        setNoteList(updateNotes);
                        console.log("삭제 후 noteList:", updateNotes);
                        window.showToast("쪽지가 삭제되었습니다");
                    } catch (error) {
                        console.error("쪽지 삭제 실패", error);
                        window.showToast("쪽지 삭제 중 오류가 발생했습니다");
                        setNoteList((prev) => prev || []);
                    }
                }
                resolve(); // Promise 해결 (성공 또는 취소 시)
            });
        });
    };

    // 🟠 전체 삭제 경고창
    const showDeleteAllAlert = () => {
        Swal.fire({
            title: `전체 쪽지 삭제`,
            html: '정말로 모든 쪽지를 삭제하시겠습니까?<br/>삭제 후 모든 쪽지 내용은 복구가 불가능합니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '전체 삭제',
            cancelButtonText: '취소',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    console.log("쪽지 삭제 성공");
                    await deleteNote(noteStatus);
                    const updateNotes = await fetchData() || [];
                    setNoteList(updateNotes);
                    window.showToast("쪽지가 삭제되었습니다"
                    );
                } catch (error) {
                    console.error("쪽지 삭제 실패", error);
                    window.showToast("쪽지 삭제 중 오류가 발생했습니다");
                }
            }
        });
    };

    // 🟡 컨텍스트 메뉴 외부 클릭 감지하여 메뉴 숨기기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                contextMenu.visible &&
                !event.target.closest('.context-menu') &&
                !event.target.closest('.note-item')
            ) {
                setContextMenu((prev) => ({...prev, visible: false, x: prev.x, y: prev.y, noteNo: prev.noteNo }));
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.visible]);

    // 🟠 서버 데이터와 로컬 쪽지 목록 동기화
    useEffect(() => {
        setNoteList(fetchNoteList || []);
        // console.log('조회한 쪽지 목록', fetchNoteList);
    }, [fetchNoteList]);

    return {

        // 🟠 쪽지 상태 관리
        isLoading,
        noteList,
        setNoteList,
        searchKeyword,
        setSearchKeyword,
        noteStatus,
        isNoteDropdownOpen,
        setIsNoteDropdownOpen,
        options,
        handleNoteStatus,
        getPreviewContent,
        noteDetail,
        setNoteDetail,
        handleOpenNote,
        handleCloseNote,
        deleteNote,
        showDeleteAlert,
        showDeleteAllAlert,
        handleBookmark,
        isNewNoteModalOpen,
        openNewNoteModal,
        closeNewNoteModal,
        fetchData,

        // 🟡 우클릭 메뉴 관리
        contextMenu,
        handleRightClick,
        handleMenuClick,

    };

};