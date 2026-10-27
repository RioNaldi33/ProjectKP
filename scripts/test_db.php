<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $pdo = DB::connection()->getPdo();
    $dbName = DB::connection()->getDatabaseName();
    $currentUser = $pdo->query("SELECT USER()")->fetchColumn();
    echo "OK DB: {$dbName}\nUSER: {$currentUser}\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

// Debug environment values
echo "ENV getenv(DB_USERNAME): " . (getenv('DB_USERNAME') ?: '[not set]') . "\n";
echo "env('DB_USERNAME') via helper: " . (env('DB_USERNAME') ?: '[not set]') . "\n";
echo "config database mysql username: " . (config('database.connections.mysql.username') ?: '[not set]') . "\n";
echo "config database mysql host: " . (config('database.connections.mysql.host') ?: '[not set]') . "\n";
echo "config database secondmysql username: " . (config('database.connections.secondmysql.username') ?: '[not set]') . "\n";
echo "config database secondmysql host: " . (config('database.connections.secondmysql.host') ?: '[not set]') . "\n";
