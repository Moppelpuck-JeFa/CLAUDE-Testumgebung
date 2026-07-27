<?php

const BACKUP_TABLES = ['users', 'standorte', 'voelker', 'durchsichten', 'arzneimittel', 'behandlungen', 'ernten'];
// Kindtabellen zuerst leeren, damit Fremdschlüssel nicht im Weg stehen.
const BACKUP_TRUNCATE_ORDER = ['durchsichten', 'behandlungen', 'ernten', 'voelker', 'arzneimittel', 'standorte', 'users'];

function backup_export_data(PDO $db): array {
    $data = ['exported_at' => date('c'), 'tables' => []];
    foreach (BACKUP_TABLES as $table) {
        $data['tables'][$table] = $db->query("SELECT * FROM `$table`")->fetchAll();
    }
    return $data;
}

function handle_backup(string $method, ?string $action): void {
    require_auth();
    $db = get_db();

    if ($method === 'GET' && $action === null) {
        $json = json_encode(backup_export_data($db), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $filename = 'imkerei-backup-' . date('Y-m-d-H-i-s') . '.json';
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }

    if ($method === 'POST' && $action === 'restore') {
        if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
            error_response('Keine Backup-Datei hochgeladen');
        }

        $raw = file_get_contents($_FILES['backup']['tmp_name']);
        $data = json_decode($raw, true);
        if (!is_array($data) || !isset($data['tables']) || !is_array($data['tables'])) {
            error_response('Die Datei ist kein gültiges Backup dieser App.');
        }
        foreach (BACKUP_TABLES as $table) {
            if (!array_key_exists($table, $data['tables'])) {
                error_response("Die Datei ist kein gültiges Backup dieser App (fehlende Tabelle: $table).");
            }
        }

        // Sicherheitskopie der aktuellen Daten anlegen, bevor sie überschrieben werden.
        $backupsDir = __DIR__ . '/../backups';
        if (!is_dir($backupsDir)) mkdir($backupsDir, 0755, true);
        $safetyFile = $backupsDir . '/vor-wiederherstellung-' . date('Y-m-d-H-i-s') . '.json';
        file_put_contents($safetyFile, json_encode(backup_export_data($db), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        try {
            $db->exec('SET FOREIGN_KEY_CHECKS = 0');
            $db->beginTransaction();

            foreach (BACKUP_TRUNCATE_ORDER as $table) {
                $db->exec("DELETE FROM `$table`");
            }

            foreach (BACKUP_TABLES as $table) {
                $rows = $data['tables'][$table];
                if (empty($rows)) continue;
                $columns = array_keys($rows[0]);
                $columnList = implode(', ', array_map(fn($c) => "`$c`", $columns));
                $placeholders = implode(', ', array_fill(0, count($columns), '?'));
                $stmt = $db->prepare("INSERT INTO `$table` ($columnList) VALUES ($placeholders)");
                foreach ($rows as $row) {
                    $stmt->execute(array_values($row));
                }
            }

            $db->commit();

            foreach (BACKUP_TABLES as $table) {
                $maxId = (int) $db->query("SELECT COALESCE(MAX(id), 0) FROM `$table`")->fetchColumn();
                $db->exec("ALTER TABLE `$table` AUTO_INCREMENT = " . ($maxId + 1));
            }

            $db->exec('SET FOREIGN_KEY_CHECKS = 1');
            json_response(['success' => true]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            $db->exec('SET FOREIGN_KEY_CHECKS = 1');
            error_response('Wiederherstellung fehlgeschlagen: ' . $e->getMessage(), 500);
        }
    }

    error_response('Nicht gefunden', 404);
}
