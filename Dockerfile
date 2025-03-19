# Stage 1: 프론트엔드 빌드 (Webpack)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci  # 더 빠르고 안정적인 의존성 설치
COPY . .
RUN npm run build  # Webpack으로 src/main/resources/static/bundle 생성

# Stage 2: 백엔드 빌드 및 실행 (Spring Boot)
FROM openjdk:11-slim
WORKDIR /app
COPY build/libs/erpre-0.0.1-SNAPSHOT.jar app.jar
COPY --from=frontend /app/src/main/resources/static/bundle static/bundle
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]