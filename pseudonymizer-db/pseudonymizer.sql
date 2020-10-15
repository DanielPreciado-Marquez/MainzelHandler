CREATE USER IF NOT EXISTS 'pseudonymizer-user'@'%' IDENTIFIED WITH mysql_native_password BY 'pseudonymizer-password';

CREATE DATABASE IF NOT EXISTS pseudonymizer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE ON pseudonymizer_db.* TO 'pseudonymizer-user'@'%';

USE pseudonymizer_db;

CREATE TABLE IF NOT EXISTS patient (
    pseudonym VARCHAR(255) NOT NULL,
    mdat VARCHAR(255),
    PRIMARY KEY (pseudonym)
);

-- Test environment

CREATE DATABASE IF NOT EXISTS pseudonymizer_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

GRANT
SELECT
,
INSERT
,
UPDATE
,
    DELETE ON pseudonymizer_db_test.* TO 'pseudonymizer-user'@'%';

USE pseudonymizer_db_test;

CREATE TABLE IF NOT EXISTS patient (
    pseudonym VARCHAR(255) NOT NULL,
    mdat VARCHAR(255),
    PRIMARY KEY (pseudonym)
);

INSERT INTO
    patient (pseudonym, mdat)
VALUES
    ('pseudonym', 'mdat');
