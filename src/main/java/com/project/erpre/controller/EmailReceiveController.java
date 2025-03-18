package com.project.erpre.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.erpre.model.dto.EmailReceiveDTO;
import com.project.erpre.model.entity.EmailFileReceive;
import com.project.erpre.model.entity.EmailReceive;
import com.project.erpre.repository.EmailReceiveRepository;
import com.project.erpre.service.EmailReceiveService;

@CrossOrigin(origins = "${cors.allowed-origins}")
@RestController
@RequestMapping("/api/email")
public class EmailReceiveController {

  @Autowired
  private EmailReceiveService emailReceiveService;

  @Autowired
  private EmailReceiveRepository emailReceiveRepository;

  // 받은메일 내역
  @GetMapping("/receive/{employeeEmail}")
  public List<EmailReceiveDTO> getEmailsDirectlyFromIMAP(@PathVariable String employeeEmail) {
    return emailReceiveService.fetchEmailsFromIMAP(employeeEmail);
  }

  // 이메일 뷰어 모달
  @GetMapping("/receive/read/{uid}")
  public EmailReceiveDTO getReceivedEmailDetail(
    @RequestParam String employeeEmail,
    @PathVariable long uid) {
    return emailReceiveService.getReceivedEmailDetail(employeeEmail, uid);
  }

  // 첨부파일정보
  @GetMapping("/receive/files/list/{emailNmR}")
  public List<EmailFileReceive> getReceivedEmailFiles(@PathVariable Integer emailNmR) {
    return emailReceiveService.getReceivedEmailFiles(emailNmR);
  }

}