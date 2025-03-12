import React from 'react';
import DOMPurify from "dompurify";
import { FaStar } from "react-icons/fa";
import {useNoteHooks} from "./useNoteHooks";

const NoteList = ({
                      noteList,
                      handleOpenNote,
                      handleRightClick,
                      handleBookmark,
                      formatDate
                  }) => {

    const {
        getPreviewContent,
    } = useNoteHooks();

    return (
        <div className="note-list">
            {Array.isArray(noteList) && noteList.length > 0 ? (
                noteList.map((note) => {
                    const cleanHTML = DOMPurify.sanitize(note.noteContent);
                    const previewContent = getPreviewContent(cleanHTML);

                    return (
                        <div
                            className={`note-item ${note.noteReceiverReadYn === 'N' ? 'unread' : ''}`}
                            key={note.noteNo}
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
                                {note.noteReceiverBookmarkedYn === 'Y' ? (
                                    <FaStar className="star-icon active" />
                                ) : (
                                    <FaStar className="star-icon" />
                                )}
                            </div>
                            <div className="note-info">
                                <div className="note-sender">{note.employeeName}</div>
                                <div className="note-content">{previewContent}</div>
                            </div>
                            <div className="note-date">{formatDate(note.noteSendDate)}</div>
                        </div>
                    );
                })
            ) : (
                <div></div>
            )}
        </div>
    );
};

export default NoteList;