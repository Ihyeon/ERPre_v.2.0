FROM openjdk:11-slim

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# JAR 파일 복사
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

# Webpack 번들 파일 복사
RUN mkdir -p static
COPY ./build/static/ ./static/


# JAR 실행 경로
ENTRYPOINT ["java", "-jar", "app.jar"]
