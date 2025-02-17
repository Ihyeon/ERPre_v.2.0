import React, {useContext} from 'react';
import DOMPurify from "dompurify";
import {BsEnvelopePlusFill} from "react-icons/bs";
import {FaStar, FaTrashAlt} from "react-icons/fa";
import {IoChevronDown} from "react-icons/io5";
import {UserContext} from "../../context/UserContext";
import NewNoteModal from "./NewNoteModal";
import ReceivedNoteModal from "./ReceivedNoteModal";
import {useNoteHooks} from "./useNoteHooks";

// Note.js (note.css)
const Note = ({ formatDate }) => {

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
        getPreviewContent,
        noteDetail,
        handleOpenNote,
        handleCloseNote,
        deleteNote,
        showDeleteAllAlert,
        handleBookmark,
        isNewNoteModalOpen,
        openNewNoteModal,
        closeNewNoteModal,

        // 🟡 우클릭 메뉴 관리
        contextMenu,
        handleRightClick,
        handleMenuClick,

    } = useNoteHooks();

    // Context: 전역 유저 정보 관리
    const {user} = useContext(UserContext);

    return (<div className="note-list-container">

            {/* 로딩 상태 렌더링 */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            ) : (
                <>
                    {/* 헤더 */}
                    {/* 검색 및 필터 */}
                    <div className="search-wrap">
                        <div className={`search_box ${searchKeyword ? 'has_text' : ''}`}>
                            <label className="label_floating">
                                이름, 내용
                            </label>
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="box search"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />

                            {/* 검색어 삭제 버튼 */}
                            {searchKeyword && (
                                <button
                                        className="btn-del"
                                        onClick={() => setSearchKeyword('')}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                            )}
                        </div>
                    </div>

                    {/* 드롭 메뉴 & 아이콘 */}
                    <div className="note-header">
                        <div className="dropdown-header" onClick={() => setIsNoteDropdownOpen(!isNoteDropdownOpen)}>
                            <h3 className="dropdown-title">
                                {options.find(opt => opt.value === noteStatus)?.label || '받은 쪽지'}
                                <IoChevronDown/>
                            </h3>
                            {isNoteDropdownOpen &&
                                (
                                    <div className="dropdown-content">
                                        {options.map((option, index) => (<div
                                                key={index}
                                                onClick={() => handleNoteStatus(option)}
                                                className="dropdown-item"
                                            >
                                                {option.label}
                                            </div>))}
                                    </div>
                                )}
                        </div>
                        <button className="new-note-button" onClick={openNewNoteModal} aria-label="새로운 쪽지">
                            <BsEnvelopePlusFill />
                        </button>
                        <button className="delete-note-button" onClick={showDeleteAllAlert} aria-label="전체 삭제">
                            <FaTrashAlt />
                        </button>
                    </div>

                    {/* 쪽지 리스트 */}
                    <div className="note-list">
                        {noteList.map((note, index) => {
                            const cleanHTML = DOMPurify.sanitize(note.messageContent);
                            const previewContent = getPreviewContent(cleanHTML);

                            return (<div
                                    className={`note-item ${note.recipientReadYn === 'N' ? 'unread' : ''}`}
                                    key={index}
                                    onClick={() => handleOpenNote(note)}
                                    onContextMenu={(event) => handleRightClick(event, note.noteNo)}
                                >
                                    <div
                                        className="note-star"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBookmark(note);
                                        }}
                                    >
                                        {note.bookmarkedYn === 'Y' ? (
                                            <FaStar className="star-icon active"/>
                                        ) : (
                                            <FaStar className="star-icon"/>)}
                                    </div>
                                    <div className="note-info">
                                        <div className="note-sender">{note.employeeName}</div>
                                        <div className="note-content">{previewContent}</div>
                                    </div>
                                    <div className="note-date">{formatDate(note.messageSendDate)}</div>
                                </div>);
                        })}
                    </div>
                </>
            )}


            {/* 🟡 우클릭 메뉴 */}
            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px`, height: 'auto' }}
                >
                    <ul style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
                        {noteStatus === 'sent' && (
                            <li
                                onClick={() => handleMenuClick('recall')}
                                style={{ padding: '4px 8px', cursor: 'pointer' }}
                            >
                                회수하기
                            </li>
                        )}
                        <li
                            onClick={() => handleMenuClick('delete')}
                            style={{ padding: '4px 8px', cursor: 'pointer' }}
                        >
                            삭제
                        </li>
                    </ul>
                </div>
            )}

            {/* 쪽지 전송 모달 */}
            {isNewNoteModalOpen && (
                <div className="new-note-modal-content">
                    <NewNoteModal
                        closeNewNoteModal={closeNewNoteModal}
                    />
                </div>
            )}

            {/* 쪽지 수신 모달 */}
            {noteDetail && (
                <ReceivedNoteModal
                    note={noteDetail}
                    onClose={handleCloseNote}
                    handleBookmark={handleBookmark}
                    deletenote={deleteNote}
                />
            )}
        </div>);
};

export default Note;