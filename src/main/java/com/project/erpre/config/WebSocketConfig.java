package com.project.erpre.config;

import lombok.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // 웹소켓 연결을 설정하는 엔드포인트 정의
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/talk")
                .setAllowedOriginPatterns("*") // CORS 허용
//                .setHandshakeHandler(new DefaultHandshakeHandler() {
//                    @Override
//                    protected Principal determineUser(@NonNull ServerHttpRequest request, @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {
//                        return null; // 모든 사용자가 접근 가능하도록 null 반환
//                    }
//                })
                .setHandshakeHandler(new DefaultHandshakeHandler() { // WebSocket 인증 핸들러
                    @Override
                    protected Principal determineUser(@NonNull ServerHttpRequest request,
                                                      @NonNull WebSocketHandler wsHandler,
                                                      @NonNull Map<String, Object> attributes) {
                        Principal principal = request.getPrincipal();
                        if (principal != null) {
                            System.out.println("WebSocket 연결된 사용자: " + principal.getName());
                        } else {
                            System.out.println("WebSocket 연결 시 Principal 객체가 null입니다.");
                        }
                        return principal;
                    }
                })
                .addInterceptors(new HttpSessionHandshakeInterceptor()) // 세션 정보 전달
                .withSockJS();
    }

    // 메시지 브로커 설정
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        // 전송(발신) - 클라이언트가 메시지를 전송할 때 "/app"으로 시작하도록 설정
        registry.setApplicationDestinationPrefixes("/app");

        // 구독(수신) - 클라이언트가 특정 주제를 구독하면 서버가 그 주제와 관련된 메시지를 클라이언트에게 푸시해주는 기능
        registry.enableSimpleBroker("/topic", "/queue");

    }


}
