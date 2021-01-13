CREATE USER IF NOT EXISTS 'demonstrator-user'@'%' IDENTIFIED WITH mysql_native_password BY 'demonstrator-password';

CREATE DATABASE IF NOT EXISTS demonstrator_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE ON demonstrator_db.* TO 'demonstrator-user'@'%';

USE demonstrator_db;

CREATE TABLE IF NOT EXISTS patient (
    pseudonym VARCHAR(255) NOT NULL,
    mdat VARCHAR(255),
    tentative BOOLEAN,
    PRIMARY KEY (pseudonym)
);
