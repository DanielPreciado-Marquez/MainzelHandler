FROM mysql:latest

ENV MYSQL_ROOT_PASSWORD=password

ADD pseudonymizer.sql /docker-entrypoint-initdb.d

EXPOSE 3306
