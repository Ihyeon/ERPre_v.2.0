package com.project.erpre;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@SpringBootApplication
@EnableScheduling
public class ErpreApplication implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ErpreApplication.class);

    // @Autowired
    // private JdbcTemplate jdbcTemplate; // JdbcTemplate을 자동으로 주입받기 위해 선언

    public static void main(String[] args) {
//        // .env 파일 로드
//        Dotenv dotenv = Dotenv.load();
//
//        // 환경 변수 로드 확인
//        String databaseUrl = dotenv.get("DATABASE_URL");
//        String databaseUsername = dotenv.get("DATABASE_USERNAME");
//        String databasePassword = dotenv.get("DATABASE_PASSWORD");
//        String corsAllowedOrigins = dotenv.get("CORS_ALLOWED_ORIGINS");
//
//        // .env에서 읽어온 환경 변수들을 System 속성으로 설정
//        System.setProperty("spring.datasource.url", databaseUrl);
//        System.setProperty("spring.datasource.username", databaseUsername);
//        System.setProperty("spring.datasource.password", databasePassword);
//        System.setProperty("cors.allowed-origins", corsAllowedOrigins);

        // Spring Boot 애플리케이션 실행
        SpringApplication.run(ErpreApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // String sql = "SELECT NOW()"; // PostgreSQL에서 현재 날짜와 시간을 가져오는 쿼리
        // String result = jdbcTemplate.queryForObject(sql, String.class);
        // System.out.println("현재 데이터베이스 시간: " + result);

        LocalDateTime now = LocalDateTime.now(); // 현재 시간을 LocalDateTime 객체로 가져옴
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"); // 출력할 날짜 형식 지정
        String formattedNow = now.format(formatter); // 형식에 맞게 변환
        logger.info("★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★");
        logger.info("현재 시간: {}", formattedNow); // 현재 시간 로그 출력
        logger.info("★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★");
    }

}
