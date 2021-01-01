# build
FROM maven:3.6.3-jdk-11

WORKDIR /app

COPY settings.xml /root/.m2/settings.xml

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package

# package
FROM openjdk:11

EXPOSE 8081 8082

WORKDIR /app

COPY target/demonstrator-app-*.jar ./app.jar

CMD ["java", "-jar", "/app/app.jar"]