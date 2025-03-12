import React, {useContext, useEffect } from 'react';
import {UserContext} from "../../context/UserContext";
import {useNoteHooks} from "./useNoteHooks";
import NoteList from "./NoteList";
import NoteDropdown from "./NoteDropdown";
import NoteSearchBar from "./NoteSearchBar";
import ContextMenu from "./NoteContextMenu";
import NoteModals from "./NoteModals";

// Note.js (note.css)
const Note = ({formatDate}) => {

    const {

        // 🟠 쪽지 상태 관리
        isLoading,
        noteList,
        searchKeyword,
        setSearchKeyword,
        noteStatus,
        isNoteDropdownOpen,
        setIsNoteDropdownOpen,
        options,
        handleNoteStatus,
        noteDetail,
        handleOpenNote,
        handleCloseNote,
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

    } = useNoteHooks();

    const {
        newReceivedNote,
        setNewReceivedNote,
    } = useContext(UserContext);

    const handleCloseNoteWithRefresh = () => {
        handleCloseNote();
        fetchData();
    };

    useEffect(() => {
        if (newReceivedNote) {
            handleOpenNote(newReceivedNote);
            setNewReceivedNote(null);
        }
    }, [newReceivedNote, handleOpenNote, setNewReceivedNote]);

    return (
        <div className="note-list-container">

        {/* 로딩 상태 렌더링 */}
        {isLoading ? (
            <div className="loading-container">
                <div className="loading">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>) : (
                <>

            {/* 검색 및 필터 */}
            <NoteSearchBar
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
            />

            {/* 드롭 메뉴 & 아이콘 */}
            <NoteDropdown
                openNewNoteModal={openNewNoteModal}
                showDeleteAllAlert={showDeleteAllAlert}
                noteStatus={noteStatus}
                options={options}
                isNoteDropdownOpen={isNoteDropdownOpen}
                setIsNoteDropdownOpen={setIsNoteDropdownOpen}
                handleNoteStatus={handleNoteStatus}
            />

            {/* 쪽지 리스트 */}
            <NoteList
                noteList={noteList}
                handleOpenNote={handleOpenNote}
                handleRightClick={handleRightClick}
                handleBookmark={handleBookmark}
                formatDate={formatDate}
            />

            {/* 🟡 우클릭 메뉴 */}
            <ContextMenu
                contextMenu={contextMenu}
                noteStatus={noteStatus}
                handleMenuClick={handleMenuClick}
            />

            {/* 쪽지 전송 모달 */}
            <NoteModals
                isNewNoteModalOpen={isNewNoteModalOpen}
                closeNewNoteModal={closeNewNoteModal}
                noteDetail={noteDetail}
                handleCloseNoteWithRefresh={handleCloseNoteWithRefresh}
            />
        </>
        )}
    </div>);
};

export default Note;