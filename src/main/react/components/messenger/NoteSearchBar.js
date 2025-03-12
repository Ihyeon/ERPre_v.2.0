// NoteSearchBar.js
import React, {useRef, useEffect, useState} from 'react';

const NoteSearchBar = React.memo(({ searchKeyword, setSearchKeyword }) => {
    const inputRef = useRef(null);

    // 1) 로컬 상태: 화면에 표시될 입력 값
    const [inputValue, setInputValue] = useState(searchKeyword || '');

    // 2) IME 합성 중 여부
    const [isComposing, setIsComposing] = useState(false);

    // 3) IME 합성 이벤트 핸들러
    const handleComposition = (e) => {
        if (e.type === 'compositionstart') {
            setIsComposing(true);
        } else if (e.type === 'compositionend') {
            setIsComposing(false);
            // 합성 완료 시점에만 부모 상태에 최종 글자 반영
            setSearchKeyword(e.target.value);
        }
    };

    // 4) onChange: IME 합성 중에는 로컬 상태만 갱신
    const handleChange = (e) => {
        setInputValue(e.target.value);

        // 합성 중이 아니라면 즉시 부모 상태도 갱신
        if (!isComposing) {
            setSearchKeyword(e.target.value);
        }
    };

    // 5) 부모에서 searchKeyword가 바뀌면 로컬 상태도 동기화
    useEffect(() => {
        setInputValue(searchKeyword);
    }, [searchKeyword]);

    // 6) 컴포넌트 마운트 시 포커스 (원한다면)
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // 검색어 삭제 버튼
    const handleClear = () => {
        setInputValue('');
        setSearchKeyword('');
        inputRef.current?.focus();
    };


    // const handleInputChange = (e) => {
    //     setSearchKeyword(e.target.value);
    // };

    // useEffect(() => {
    //     if (inputRef.current && document.activeElement === inputRef.current) {
    //         inputRef.current.focus();
    //     }
    // }, []);

    // useEffect(() => {
    //     inputRef.current?.focus();
    // }, []);

    return (
        <div className="search-wrap">
            <div className={`search_box ${inputValue ? 'has_text' : ''}`}>
                <label className="label_floating">이름, 내용</label>
                <i className="bi bi-search"></i>
                <input
                    ref={inputRef}
                    type="text"
                    className="box search"
                    value={inputValue}
                    onChange={handleChange}
                    onCompositionStart={handleComposition}
                    onCompositionUpdate={handleComposition}
                    onCompositionEnd={handleComposition}
                />

                {/* 검색어 삭제 */}
                {searchKeyword && (
                    <button
                        className="btn-del"
                        onClick={handleClear}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                )}
            </div>
        </div>
    );
});

export default NoteSearchBar;