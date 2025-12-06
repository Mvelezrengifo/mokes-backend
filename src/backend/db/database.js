const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "mokes-clinic.db");
const db = new Database(dbPath);

// Tabla patients
db.exec(`  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    email TEXT,
    phone TEXT
  );`);

// Tabla appointments
db.exec(`  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    date TEXT,
    time TEXT,
    notes TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );`);

// Tabla invoices
db.exec(`  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    date TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );`);

// Tabla inventory
db.exec(`  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );`);

db.exec(`  CREATE TABLE IF NOT EXISTS patient_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    snapshot TEXT NOT NULL
  );`);

db.exec(`  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );`);

db.exec(`  CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    source TEXT,
    date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );`);

// Verificar si falta la columna 'description' y agregarla si no existe
const columns = db.prepare("PRAGMA table_info(inventory)").all();
const hasDescription = columns.some(col => col.name === "description");
if (!hasDescription) {
db.prepare("ALTER TABLE inventory ADD COLUMN description TEXT").run();
}

module.exports = db;
