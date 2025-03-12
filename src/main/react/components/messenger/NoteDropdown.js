import {IoChevronDown} from "react-icons/io5";
import {BsEnvelopePlusFill} from "react-icons/bs";
import {FaTrashAlt} from "react-icons/fa";
import React from "react";

const NoteDropdown = ({openNewNoteModal, showDeleteAllAlert, noteStatus, options, isNoteDropdownOpen, setIsNoteDropdownOpen, handleNoteStatus}) => {
    return (<div className="note-header">
            <div className="dropdown-header" onClick={() => setIsNoteDropdownOpen(!isNoteDropdownOpen)}>
                <h3 className="dropdown-title">
                    {options.find(opt => opt.value === noteStatus)?.label || '받은 쪽지'}
                    <IoChevronDown/>
                </h3>
                {isNoteDropdownOpen && (<div className="dropdown-content">
                        {options.map((option, index) => (<div
                                key={index}
                                onClick={() => handleNoteStatus(option)}
                                className="dropdown-item"
                            >
                                {option.label}
                            </div>))}
                    </div>)}
            </div>
            <div className="note-header-icon">
                <button className="new-note-button" onClick={openNewNoteModal} aria-label="새로운 쪽지">
                    <BsEnvelopePlusFill/>
                </button>
                <button className="delete-note-button" onClick={showDeleteAllAlert} aria-label="전체 삭제">
                    <FaTrashAlt/>
                </button>
            </div>
        </div>);
};

export default NoteDropdown;