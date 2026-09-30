-- Deploy with ENROLLMENT_FORMS_ENABLED=false; enable after all clients are ready.
CREATE TABLE enrollment_form (
 channel VARCHAR(16) NOT NULL, category VARCHAR(32) NOT NULL,
 version INT NOT NULL DEFAULT 0, fields JSON NOT NULL,
 updated_by BIGINT NULL, updated DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(channel,category)
) ENGINE=InnoDB;
CREATE TABLE enrollment_form_answer (
 enroll_id BIGINT NOT NULL PRIMARY KEY, channel VARCHAR(16) NOT NULL,
 category VARCHAR(32) NOT NULL, version INT NOT NULL,
 snapshot JSON NOT NULL, answers JSON NOT NULL,
 created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
-- Optional/removed visit questions must not fabricate a visit date.
ALTER TABLE mission_enroll MODIFY visit_datetime_start DATETIME(3) NULL,
 MODIFY visit_datetime_end DATETIME(3) NULL;
