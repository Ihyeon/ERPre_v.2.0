// NoteModals.js
import React from 'react';
import NewNoteModal from './NewNoteModal';
import ReceivedNoteModal from './ReceivedNoteModal';

const NoteModals = ({ isNewNoteModalOpen, closeNewNoteModal, noteDetail, handleCloseNoteWithRefresh }) => {
    return (
        <>
            {isNewNoteModalOpen && (
                <div className="new-note-modal-content">
                    <NewNoteModal closeNewNoteModal={closeNewNoteModal} />
                </div>
            )}
            {noteDetail && (
                <ReceivedNoteModal note={noteDetail} onClose={handleCloseNoteWithRefresh} />
            )}
        </>
    );
};

export default NoteModals;