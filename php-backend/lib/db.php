<?php

function get_db(): PDO {
    static $pdo = null;
    static $migrated = false;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    // `static $migrated` bleibt innerhalb eines PHP-FPM-Worker-Prozesses über
    // mehrere Anfragen hinweg erhalten, die Migration läuft also nur einmal
    // pro Worker, nicht bei jeder Anfrage neu.
    if (!$migrated) {
        migrate_schema($pdo);
        $migrated = true;
    }

    return $pdo;
}

// Spalten nachrüsten, die erst nach der ursprünglichen schema.sql
// hinzugekommen sind (betrifft bereits bestehende, produktive Datenbanken;
// bei einem frischen Import von schema.sql sind sie ohnehin schon vorhanden).
function migrate_schema(PDO $pdo): void {
    ensure_column($pdo, 'durchsichten', 'sanftmut', 'VARCHAR(50) NULL');
}

function ensure_column(PDO $pdo, string $table, string $column, string $definition): void {
    $stmt = $pdo->prepare('
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    ');
    $stmt->execute([$table, $column]);
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
    }
}
