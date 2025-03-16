package com.project.erpre.service;

import com.project.erpre.model.dto.EmailReceiveDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import com.project.erpre.model.entity.EmailFileReceive;
import com.project.erpre.model.entity.EmailReceive;
import com.project.erpre.repository.EmailReceiveFileRepository;
import com.project.erpre.repository.EmailReceiveRepository;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMultipart;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

@Service
public class EmailReceiveService {

    @Autowired
    private EmailReceiveRepository emailReceiveRepository;

    @Autowired
    private EmailReceiveFileRepository emailReceiveFileRepository;

//    @Value("${mail.imap.username}")
//    private String imapUsername;
//
//    @Value("${mail.imap.password}")
//    private String imapPassword;
    private String imapUsername = "dummy_username";
    private String imapPassword = "dummy_password";



    private static final String HOST = "imap.gmail.com"; // Gmail IMAP 서버와 통신할 수 있게함
    private static final String MAIL_STORE_TYPE = "imap"; // IMAP 프로토콜 사용을 지정함

    public List<EmailReceiveDTO> fetchEmailsFromIMAP(String employeeEmail) {
        Properties properties = new Properties(); // Gmail IMAP 서버에 연결하는데 필요한 설정들
        properties.put("mail.store.protocol", "imap"); // 메일서버와 통신할 프로토콜
        properties.put("mail.imap.host", HOST); // IMAP 서버지정해 설정
        properties.put("mail.imap.port", "993"); // IMAP연결 표준 포트번호(993 : 암호화연결사용번호)
        properties.put("mail.imap.ssl.enable", "true"); // 이메일 서버와의 연결을 암호화
        properties.put("mail.debug", "false"); // 디버그 활성화

        List<EmailReceiveDTO> emails = new ArrayList<>();

        try {
            System.out.println("메일 서버에 연결합니다.");
            Session emailSession = Session.getDefaultInstance(properties); // 세션 생성
            Store store = emailSession.getStore(MAIL_STORE_TYPE); // IMAP 스토어 객체 생성해 IMAP 서버에 연결함
            store.connect(imapUsername, imapPassword);// 사용자이름과 비번
            System.out.println("수신메일을 위한 계정이 성공적으로 연결되었습니다.");

            try {
                Folder[] folders = store.getDefaultFolder().list("*");
                for (Folder folder : folders) {
                    System.out.println("Available folder: " + folder.getFullName());
                }
            } catch (MessagingException e) {
                System.out.println("IMAP 폴더 목록을 가져오는 중 오류 발생:");
                e.printStackTrace();
            }

            Folder emailFolder = store.getFolder("[Gmail]/전체보관함"); // 받은 편지함 폴더 열기
            if (emailFolder == null) { // emailFolder가 null일 경우
                System.out.println("[Gmail]/전체보관함 폴더를 찾을 수 없습니다.");
                return emails;
            }
            emailFolder.open(Folder.READ_ONLY); // 읽기전용모드로 폴더오픈

            UIDFolder uidFolder = (UIDFolder) emailFolder;

            Message[] messages = emailFolder.getMessages(); // 이메일 메시지 가져오기
            if (messages == null) { // messages가 null인 경우
                System.out.println("폴더에서 메시지를 가져오지 못했습니다.");
                return emails;
            }
            for (Message message : messages) {
                Address[] recipients = message.getRecipients(Message.RecipientType.TO);
                if (recipients == null) { // recipients가 null인 경우
                    System.out.println("수신자가 없는 메시지가 있습니다.");
                    continue;
                }
                for (Address address : recipients) {
                    if (address instanceof InternetAddress) {
                        String recipientEmail = ((InternetAddress) address).getAddress();
                        // System.out.println("수신자 이메일: " + recipientEmail);
                        // System.out.println("로그인직원 이메일: " + employeeEmail);
                        if (recipientEmail != null && recipientEmail.equalsIgnoreCase(employeeEmail)) {
                            long uid = uidFolder.getUID(message);
                            EmailReceiveDTO emailDTO = convertMessageToDTO(message, employeeEmail, uid);
                            emails.add(emailDTO);
                            break;
                        }
                    }
                }
            }
            emailFolder.close(false); // 폴더와 스토어 닫기
            store.close();
        } catch (MessagingException e) {
            System.err.println("메일 서버 연결 중 오류 발생:");
            e.printStackTrace();
        } catch (IOException e) {
            System.err.println("메일 처리 중 IO 오류 발생:");
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("알 수 없는 오류 발생:");
            e.printStackTrace();
        }
        return emails;
    }

    private EmailReceiveDTO convertMessageToDTO(Message message, String employeeEmail, long uid)
        throws MessagingException, IOException {
    String from = message.getFrom()[0].toString();
    String subject = message.getSubject();
    String text = getTextFromMessage(message); // 수정된 메서드 사용

    return EmailReceiveDTO.builder()
            .emailAddrSendR(from)
            .emailSubjectR(subject)
            .emailTextR(text) // 본문 내용 설정
            .emailDateR(new Timestamp(message.getReceivedDate().getTime()))
            .emailStatusR("nr")
            .employeeEmail(employeeEmail)
            .uid(uid)
            .build();
}

    private String getTextFromMessage(Message message) throws MessagingException, IOException {
        if (message.isMimeType("text/plain")) {
            return message.getContent().toString();
        } else if (message.isMimeType("text/html")) {
            return message.getContent().toString();
        } else if (message.isMimeType("multipart/*")) {
            return getTextFromMultipart((Multipart) message.getContent());
        } else {
            // 다른 타입의 처리
            return "";
        }
    }

    private String getTextFromMultipart(Multipart multipart) throws MessagingException, IOException {
        String result = "";
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart bodyPart = multipart.getBodyPart(i);
            if (bodyPart.isMimeType("text/plain")) {
                result += bodyPart.getContent().toString();
            } else if (bodyPart.isMimeType("text/html")) {
                String html = (String) bodyPart.getContent();
                result += html;
            } else if (bodyPart.getContent() instanceof Multipart) {
                result += getTextFromMultipart((Multipart) bodyPart.getContent());
            }
        }
        return result;
    }

    // 메일 상세 정보 가져오기
    public EmailReceiveDTO getReceivedEmailDetail(String employeeEmail, long uid) {
        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imap"); // 메일서버와 통신할 프로토콜
        properties.put("mail.imap.host", HOST); // IMAP 서버지정해 설정
        properties.put("mail.imap.port", "993"); // IMAP연결 표준 포트번호(993 : 암호화연결사용번호)
        properties.put("mail.imap.ssl.enable", "true"); // 이메일 서버와의 연결을 암호화
        properties.put("mail.debug", "false"); // 디버그 활성화

        try {
            Session emailSession = Session.getDefaultInstance(properties);
            Store store = emailSession.getStore(MAIL_STORE_TYPE);
            store.connect(imapUsername, imapPassword);

            Folder emailFolder = store.getFolder("[Gmail]/전체보관함");
            emailFolder.open(Folder.READ_ONLY);

            UIDFolder uidFolder = (UIDFolder) emailFolder;
            Message message = uidFolder.getMessageByUID(uid);

            if (message != null) {
                Address[] recipients = message.getRecipients(Message.RecipientType.TO);
                if (recipients != null) {
                    for (Address address : recipients) {
                        if (address instanceof InternetAddress) {
                            String recipientEmail = ((InternetAddress) address).getAddress();
                            if (recipientEmail != null && recipientEmail.equalsIgnoreCase(employeeEmail)) {
                                EmailReceiveDTO emailReceiveDTO = convertMessageToDTO(message, employeeEmail, uid);
                                emailFolder.close(false);
                                store.close();
                                return emailReceiveDTO;
                            }
                        }
                    }
                }
            }

            emailFolder.close(false);
            store.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;

    }

    // 수신 메일의 첨부 파일 목록 조회
    public List<EmailFileReceive> getReceivedEmailFiles(Integer emailNmR) {
        return emailReceiveFileRepository.findByEmailNmR(emailNmR);
    }
}
