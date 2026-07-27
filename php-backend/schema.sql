-- Schema für die Imkerei-Verwaltung (MySQL/MariaDB)
-- Import z.B. über phpMyAdmin im Kundencenter deines Hosters.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS standorte (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  adresse VARCHAR(500) NULL,
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS voelker (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standort_id INT NULL,
  name VARCHAR(255) NOT NULL,
  beutentyp VARCHAR(255) NULL,
  koenigin_jahr INT NULL,
  koenigin_rasse VARCHAR(255) NULL,
  koenigin_gezeichnet TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'aktiv',
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (standort_id) REFERENCES standorte(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS durchsichten (
  id INT AUTO_INCREMENT PRIMARY KEY,
  volk_id INT NOT NULL,
  datum DATE NOT NULL,
  volksstaerke VARCHAR(255) NULL,
  brutnest VARCHAR(255) NULL,
  koenigin_gesehen TINYINT(1) NOT NULL DEFAULT 0,
  weiselzellen TINYINT(1) NOT NULL DEFAULT 0,
  futtervorrat VARCHAR(255) NULL,
  sanftmut VARCHAR(50) NULL,
  krankheiten TEXT NULL,
  massnahmen TEXT NULL,
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volk_id) REFERENCES voelker(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS arzneimittel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  chargennummer VARCHAR(255) NULL,
  einheit VARCHAR(50) NOT NULL DEFAULT 'ml',
  bestand DECIMAL(10,2) NOT NULL DEFAULT 0,
  verfallsdatum DATE NULL,
  bezugsquelle VARCHAR(255) NULL,
  einkaufsdatum DATE NULL,
  wartezeit_tage INT NOT NULL DEFAULT 0,
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS behandlungen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  volk_id INT NOT NULL,
  arzneimittel_id INT NULL,
  datum DATE NOT NULL,
  indikation VARCHAR(255) NULL,
  dosierung VARCHAR(255) NULL,
  anwendungsmethode VARCHAR(255) NULL,
  menge_verbraucht DECIMAL(10,2) NULL,
  wartezeit_ende DATE NULL,
  behandelnde_person VARCHAR(255) NULL,
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volk_id) REFERENCES voelker(id) ON DELETE CASCADE,
  FOREIGN KEY (arzneimittel_id) REFERENCES arzneimittel(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ernten (
  id INT AUTO_INCREMENT PRIMARY KEY,
  volk_id INT NULL,
  standort_id INT NULL,
  datum DATE NOT NULL,
  menge_kg DECIMAL(10,2) NOT NULL,
  sorte VARCHAR(255) NULL,
  notizen TEXT NULL,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volk_id) REFERENCES voelker(id) ON DELETE SET NULL,
  FOREIGN KEY (standort_id) REFERENCES standorte(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_voelker_standort ON voelker(standort_id);
CREATE INDEX idx_durchsichten_volk ON durchsichten(volk_id);
CREATE INDEX idx_behandlungen_volk ON behandlungen(volk_id);
CREATE INDEX idx_behandlungen_arzneimittel ON behandlungen(arzneimittel_id);
CREATE INDEX idx_ernten_volk ON ernten(volk_id);
CREATE INDEX idx_ernten_standort ON ernten(standort_id);
