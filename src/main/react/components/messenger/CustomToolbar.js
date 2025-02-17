import React from 'react';
import {FiPaperclip} from "react-icons/fi";

export const CustomToolbar = ( { handleFileUpload }) => (
    <div id="toolbar">
        {/* 파일 업로드 버튼 */}
        <span className="ql-formats">
            <button type="button" onClick={handleFileUpload}>
                <FiPaperclip />
            </button>
        </span>
        {/* 제목 및 크기 설정 */}
        <span className="ql-formats">
          <select className="ql-size" defaultValue="medium">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
          </select>
          <select className="ql-header">
            <option value="1">Header 1</option>
            <option value="2">Header 2</option>
            <option value="3">Header 3</option>
          </select>
        </span>
        {/* 텍스트 서식 */}
        <span className="ql-formats">
          <button className="ql-bold"/>
          <button className="ql-italic"/>
          <button className="ql-underline"/>
          <button className="ql-strike"/>
        </span>
        {/* 클린 버튼 */}
        <span className="ql-formats">
          <button className="ql-clean"/>
        </span>
    </div>
);

