package com.project.erpre.controller;

import com.project.erpre.model.dto.ChatMessageDTO;
import com.project.erpre.model.dto.EmployeeStatusDTO;
import com.project.erpre.model.dto.NoteDTO;
import com.project.erpre.service.MessengerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

// STOMP 프로토콜을 활용하여 클라이언트 간 실시간 메시지 전송 처리
// 주로 채팅, 쪽지, 알림과 같은 기능 구현
// 메시지 전송 후 특정 사용자나 그룹에 브로드캐스트
@Slf4j
@Controller
public class TalkController {

    private final MessengerService messengerService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public TalkController(MessengerService messengerService, SimpMessagingTemplate messagingTemplate) {
        this.messengerService = messengerService;
        this.messagingTemplate = messagingTemplate;
    }

    // 🔵 직원 상태 및 상태 메시지 전송 및 저장
    @MessageMapping("/status")
    public void sendStatus(EmployeeStatusDTO employeeStatus, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("WebSocket 요청에서 인증된 사용자가 없습니다.");
        }
        String senderId = principal.getName();
        System.out.println("Principal에서 가져온 사용자 ID: " + principal.getName());

        Map<String, String> updates= new HashMap<>();
        if (employeeStatus.getEmployeeStatus() != null) {
            updates.put("employeeStatus", employeeStatus.getEmployeeStatus());
        }
        if (employeeStatus.getEmployeeStatusMessage() != null) {
            updates.put("employeeStatusMessage", employeeStatus.getEmployeeStatusMessage());
        }

        // 직원 업데이트 상태 DB에 저장
        EmployeeStatusDTO updatedStatus = messengerService.updateInfo(updates, senderId);
        
        // 각 구독자에게 상태 전송
        messagingTemplate.convertAndSend("/topic/status", updatedStatus);
    }


    // 🟠 쪽지 전송 및 저장
    @MessageMapping("/note")
    public void sendNote(NoteDTO note, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("WebSocket 요청에서 인증된 사용자가 없습니다.");
        }

        String senderId = principal.getName();
        Optional<LocalDateTime> scheduledDate = Optional.ofNullable(note.getNoteSendDate());

        // 쪽지 DB에 저장
        NoteDTO savedNote = messengerService.createNote(
                senderId,
                note.getNoteContent(),
                scheduledDate,
                note.getNoteReceiverIds());

        // 각 수신자에게 쪽지 전송
        for (String receiverId : note.getNoteReceiverIds()) {
            messagingTemplate.convertAndSendToUser(receiverId, "/queue/note", savedNote);
            log.info("전송 주소: /user/{}/queue/note", receiverId);
        }
    }


    // 🔴 채팅 메시지 전송 및 저장
    @MessageMapping("/chat/{chatNo}") //  클라이언트가 /app/chat/{chatNo}로 메시지를 전송하면 서버의 @MessageMapping("/chat/{chatNo}") 메서드가 실행
    public void sendTalk(@DestinationVariable Long chatNo, ChatMessageDTO chatMessage) {

        // 메시지 DB에 저장
        ChatMessageDTO savedMessage = messengerService.saveChatMessage(chatNo, chatMessage, chatMessage.getChatSenderId());

        // 메시지 저장 및 전송 확인
        System.out.println("메시지 저장 후 전송: 채팅방 번호 " + chatNo + ", 메시지 내용: " + savedMessage);

        // 특정 채팅방 구독자들에게만 메시지 전송
        messagingTemplate.convertAndSend("/topic/chat/" + chatNo, savedMessage);

        System.out.println("메시지 저장 후 전송: 채팅방 번호 " + chatNo + ", 메시지 내용: " + savedMessage);
        System.out.println("메시지 전송 완료 - 구독 경로: /topic/chat/" + chatNo + ", 메시지 내용: " + savedMessage);
    }

}
