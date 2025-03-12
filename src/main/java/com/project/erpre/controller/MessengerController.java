package com.project.erpre.controller;

import com.project.erpre.model.dto.*;
import com.project.erpre.service.EmployeeService;
import com.project.erpre.service.FileService;
import com.project.erpre.service.MessengerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messengers")
public class MessengerController {

    private static final Logger logger = LoggerFactory.getLogger(MessengerController.class);

    private final MessengerService messengerService;
    private final EmployeeService employeeService;
    private final FileService fileService;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public MessengerController(MessengerService messengerService, EmployeeService employeeService, FileService fileService, ApplicationEventPublisher eventPublisher) {
        this.messengerService = messengerService;
        this.employeeService = employeeService;
        this.fileService = fileService;
        this.eventPublisher = eventPublisher;
    }

    /////////////////////////////////////////////////////////////////////// 🟢 메신저홈

    // 🟢 검색어와 상태 필터에 따른 메신저 조직도 조회 API
    @GetMapping("/organization")
    public ResponseEntity<List<EmployeeDTO>> getMessengerEmployeeList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchKeyword
    ) {
        try {
            List<EmployeeDTO> employees = employeeService.getMessengerEmployeeList(status, searchKeyword);
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 메신저 직원 검색 API (쪽지, 채팅)
    @GetMapping("/employeeList")
    public ResponseEntity<Page<EmployeeDTO>> getEmployeeList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String searchKeyword
    ) {
        try {
            Page<EmployeeDTO> result = employeeService.getEmployeeList(page - 1, size, searchKeyword);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 유저 정보 조회 API
    @GetMapping("/info")
    public ResponseEntity<EmployeeDTO> getUserInfo() {
        EmployeeDTO employeeDTO = messengerService.getUserInfo();
        return ResponseEntity.ok(employeeDTO);
    }

    // 유저 정보 상세조회 API
    @GetMapping("/info/{employeeId}")
    public ResponseEntity<EmployeeDTO> getUserInfo(@PathVariable String employeeId) {
        EmployeeDTO employeeDTO = messengerService.getUserInfo(employeeId);
        return ResponseEntity.ok(employeeDTO);
    }
    
    // 유저 프로필 사진 URL 업데이트 API
    @PutMapping("/profile/update")
    public ResponseEntity<String> updateProfileImage(@RequestBody Map<String, String> request) {
        String fileName = request.get("fileName");
        messengerService.updateProfileImage(fileName);
        return ResponseEntity.ok("프로필 이미지 업데이트 성공");
    }

    // 유저 프로필 사진 URL 삭제 API
    @DeleteMapping("/profile/delete")
    public ResponseEntity<Void> deleteProfileImage() {
        messengerService.deleteProfileImage();
        return ResponseEntity.noContent().build();
    }

    // 유저 정보 업데이트 API (핸드폰 번호)
    @PutMapping("/info/update")
    public ResponseEntity<?> updateInfo(@RequestBody Map<String, String> requests) {
        messengerService.updateEmployeeTel(requests);
        return ResponseEntity.noContent().build();
    }


    /////////////////////////////////////////////////////////////////////// 🟠 쪽지


    // 상태에 따른 쪽지 목록 조회 및 검색 API
    @GetMapping("/note/list")
    public ResponseEntity<List<NoteDTO>> getNoteList(
            @RequestParam(required = false) String searchKeyword,
            @RequestParam String status
    ) {
        logger.info("getNoteList API 호출됨 - searchKeyword: {}, status: {}", searchKeyword, status);
        try {
            List<NoteDTO> notes = messengerService.getNoteListByUser(searchKeyword, status);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            logger.error("쪽지 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 쪽지 상세 정보 조회 및 읽음 상태 업데이트 API
    @PutMapping("/note/{noteNo}")
    public ResponseEntity<NoteDTO> getNoteByNo(@PathVariable Long noteNo) {
        NoteDTO noteDetail = messengerService.getNoteByNo(noteNo);
        return ResponseEntity.ok(noteDetail);
    }

    // 쪽지 북마크 상태 업데이트 API
    @PutMapping("/note/{noteNo}/bookmark")
    public ResponseEntity<Void> updateBookmark(@PathVariable Long noteNo) {
        messengerService.updateBookmark(noteNo);
        return ResponseEntity.ok().build();
    }

    // 쪽지 회수 API
    @PutMapping("/note/recall/{noteNo}")
    public ResponseEntity<Void> recallNote(@PathVariable Long noteNo) {
        messengerService.recallNote(noteNo);
        return ResponseEntity.noContent().build();
    }

    // (상태/전체/개별) 쪽지 삭제 API
    @PutMapping("/note/delete")
    public ResponseEntity<Void> deleteNote(
            @RequestParam(value = "noteNo", required = false) Long noteNo,
            @RequestParam(value = "noteStatus", required = false, defaultValue = "received") String noteStatus
    ) {
        if (noteNo != null) {
            messengerService.deleteNoteById(noteNo); // 개별 삭제
        } else if (noteStatus != null) {
            messengerService.deleteAllNotes(noteStatus); // 상태에 따른 전체 삭제
        } else {
            return ResponseEntity.badRequest().build(); // 올바르지 않은 요청
        }
        return ResponseEntity.noContent().build();
    }

    // 쪽지 전송시 자동완성 직원 검색
    @GetMapping("/note/employeeList")
    public ResponseEntity<List<EmployeeDTO>> getNoteEmployeeList (
            @RequestParam(required = false) String searchKeyword
    ) {
        try {
            List<EmployeeDTO> employees = employeeService.getNoteEmployeeList(searchKeyword);
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            logger.error("직원 자동완성 검색 중 오류 발생: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }


    /////////////////////////////////////////////////////////////////////// 🔴 채팅


    // 현재 참여하고 있는 채팅 목록 조회 및 검색 API
    @GetMapping("/chat/list")
    public List<ChatDTO> getChatListByUser(@RequestParam(required = false) String searchKeyword) {
        return messengerService.getChatListByUser(searchKeyword);
    }

    //  개별 채팅방 조회 API
    @GetMapping("/chat/{chatNo}")
    public ResponseEntity<Map<String, Object>> getSelectedChat(@PathVariable Long chatNo,
                                                               @RequestParam(required = false) String searchKeyword) {
        Map<String, Object> response = messengerService.getSelectedChat(chatNo, searchKeyword);
        return ResponseEntity.ok(response);
    }

    // 새 채팅방 생성 API
    @PostMapping("/chat/create")
    public ResponseEntity<ChatDTO> createChatRoom(@RequestBody List<String> participantIds) {
        ChatDTO newChatRoom = messengerService.createChatRoom(participantIds);
        return ResponseEntity.ok(newChatRoom);
    }

    // 채팅방 이름 변경 API
    @PutMapping("/chat/update/title")
    public ResponseEntity<Void> updateChatTitle(@RequestBody ChatParticipantDTO.ChatTitleUpdateDTO chatTitleUpdateDTO) {
        Long chatNo = chatTitleUpdateDTO.getChatNo();
        String newTitle = chatTitleUpdateDTO.getChatTitle();

        messengerService.updateChatTitle(chatNo, newTitle);
        return ResponseEntity.ok().build();
    }

    // 채팅방 나가기 API
    @DeleteMapping("/chat/delete/{chatNo}")
    public ResponseEntity<String> leaveChatRoom(@PathVariable Long chatNo) {
        try {
            messengerService.leaveChatRoom(chatNo);
            return ResponseEntity.ok("채팅방에서 성공적으로 나갔습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("채팅방 나가기 실패: " + e.getMessage());
        }
    }

}
