// ContextMenu.js
import React from 'react';
import {useNoteHooks} from "./useNoteHooks";

const ContextMenu = ({ contextMenu, noteStatus, handleMenuClick }) => {

    const {

    } = useNoteHooks();

    if (!contextMenu.visible) return null;

    return (
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
    );
};

export default ContextMenu;