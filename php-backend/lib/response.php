<?php

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function error_response(string $message, int $status = 400): void {
    json_response(['error' => $message], $status);
}

// MySQL-DATE-Spalten akzeptieren (anders als SQLites TEXT-basierte Spalten)
// keinen Leerstring. Optionale Datumsfelder aus dem Frontend kommen bei
// leerem <input type="date"> als "" an und müssen zu NULL werden.
function blank_to_null($value) {
    return ($value === null || $value === '') ? null : $value;
}

// PDO liefert MySQL-DECIMAL-Spalten immer als String zurück (unabhängig von
// Emulation), damit keine Genauigkeit verloren geht. Für die API/Frontend
// erwarten wir dort aber echte JSON-Zahlen, deshalb hier explizit casten.
function cast_numeric(array $row, array $floatKeys = []): array {
    foreach ($floatKeys as $key) {
        if (array_key_exists($key, $row) && $row[$key] !== null) {
            $row[$key] = (float) $row[$key];
        }
    }
    return $row;
}

function cast_numeric_rows(array $rows, array $floatKeys = []): array {
    return array_map(fn($row) => cast_numeric($row, $floatKeys), $rows);
}
