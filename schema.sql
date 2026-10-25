-- =====================================================
--  وب‌سایت کلینیک زیبایی — اسکیمای MySQL
--  اجرا: mysql -u root -p < schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS clinic8
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinic8;

-- ادمین‌ها
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190)     NOT NULL,
  password_hash VARCHAR(100)     NOT NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB;

-- چالش‌های OTP (ورود دومرحله‌ای ادمین)
CREATE TABLE IF NOT EXISTS otp_challenges (
  id           CHAR(36)         NOT NULL,              -- UUID
  admin_id     INT UNSIGNED     NOT NULL,
  code_hash    CHAR(64)         NOT NULL,              -- SHA-256 hex
  expires_at   DATETIME         NOT NULL,
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consumed_at  DATETIME         NULL,
  last_sent_at DATETIME         NOT NULL,
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_otp_admin (admin_id),
  CONSTRAINT fk_otp_admin FOREIGN KEY (admin_id)
    REFERENCES admins (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- خدمات کلینیک
CREATE TABLE IF NOT EXISTS services (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  title             VARCHAR(190)     NOT NULL,
  slug              VARCHAR(190)     NOT NULL,
  category          VARCHAR(100)     NOT NULL DEFAULT '',
  short_description VARCHAR(500)     NOT NULL DEFAULT '',
  description       MEDIUMTEXT       NULL,
  cover_image       VARCHAR(255)     NOT NULL DEFAULT '',
  duration          VARCHAR(100)     NOT NULL DEFAULT '',   -- مدت زمان انجام
  recovery_time     VARCHAR(190)     NOT NULL DEFAULT '',   -- دوره نقاهت
  side_effects      JSON             NOT NULL,              -- [{title, description}]
  faqs              JSON             NOT NULL,              -- [{question, answer}]
  is_active         TINYINT(1)       NOT NULL DEFAULT 1,
  sort_order        INT              NOT NULL DEFAULT 0,
  created_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_slug (slug),
  KEY idx_services_active_sort (is_active, sort_order)
) ENGINE=InnoDB;

-- نمونه‌های قبل/بعد
CREATE TABLE IF NOT EXISTS before_after (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  service_id   INT UNSIGNED     NOT NULL,
  before_image VARCHAR(255)     NOT NULL,
  after_image  VARCHAR(255)     NOT NULL,
  caption      VARCHAR(500)     NOT NULL DEFAULT '',
  is_published TINYINT(1)       NOT NULL DEFAULT 1,
  sort_order   INT              NOT NULL DEFAULT 0,
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ba_service (service_id, is_published, sort_order),
  CONSTRAINT fk_ba_service FOREIGN KEY (service_id)
    REFERENCES services (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- نوبت‌ها / درخواست‌های مشاوره
CREATE TABLE IF NOT EXISTS appointments (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100)     NOT NULL,
  last_name  VARCHAR(100)     NOT NULL,
  phone      CHAR(11)         NOT NULL,                 -- 09xxxxxxxxx
  service_id INT UNSIGNED     NULL,
  undecided  TINYINT(1)       NOT NULL DEFAULT 0,       -- کاربر در انتخاب خدمت مردد است
  message    VARCHAR(1000)    NOT NULL DEFAULT '',
  status     ENUM('NEW','CONTACTED','CONFIRMED','CANCELED')
                              NOT NULL DEFAULT 'NEW',
  admin_note VARCHAR(1000)    NOT NULL DEFAULT '',
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appt_status_created (status, created_at),
  KEY idx_appt_phone (phone),
  CONSTRAINT fk_appt_service FOREIGN KEY (service_id)
    REFERENCES services (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- اطلاعات کلینیک (فقط یک ردیف با id=1)
CREATE TABLE IF NOT EXISTS clinic_info (
  id            TINYINT UNSIGNED NOT NULL,
  name          VARCHAR(190)     NOT NULL DEFAULT '',
  about         TEXT             NULL,
  address       VARCHAR(500)     NOT NULL DEFAULT '',
  phones        JSON             NOT NULL,               -- ["021...","09..."]
  email         VARCHAR(190)     NOT NULL DEFAULT '',
  instagram_url VARCHAR(500)     NOT NULL DEFAULT '',
  map_lat       DECIMAL(10,7)    NULL,
  map_lng       DECIMAL(10,7)    NULL,
  working_hours JSON             NOT NULL,               -- آرایه ۷ تایی {day, closed, slots:[{open,close}]}
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;
