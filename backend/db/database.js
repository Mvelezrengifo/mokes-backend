const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "mokes-clinic.db");
const db = new Database(dbPath);

// Tabla patients
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    email TEXT,
    phone TEXT,
    document TEXT
  );
`);

// Tabla appointments
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    date TEXT,
    time TEXT,
    notes TEXT,
    treatment TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );
`);

// Tabla invoices
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    date TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT,
    description TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );
`);

// Tabla inventory
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    description TEXT
  );
`);

// Tabla patient_history
db.exec(`
  CREATE TABLE IF NOT EXISTS patient_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    snapshot TEXT NOT NULL
  );
`);

// Tabla medical_records
db.exec(`
  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );
`);

// Tabla points
db.exec(`
  CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    source TEXT,
    date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );
`);

// ✅ NUEVA TABLA: clinic_services (servicios/tratamientos predefinidos)
db.exec(`
  CREATE TABLE IF NOT EXISTS clinic_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
`);

// ✅ Datos iniciales para clinic_services (seed)
const serviciosIniciales = [
    "Limpieza Facial Profunda",
    "Masaje Relajante",
    "Depilación Láser",
    "Peeling Químico"
];

const insertService = db.prepare("INSERT OR IGNORE INTO clinic_services (name) VALUES (?)");
serviciosIniciales.forEach(s => insertService.run(s));

// ===== MIGRACIONES SEGURAS (solo si la columna no existe) =====

// invoices: description
const invoiceCols = db.prepare("PRAGMA table_info(invoices)").all();
if (!invoiceCols.some(col => col.name === "description")) {
  db.prepare("ALTER TABLE invoices ADD COLUMN description TEXT").run();
}

// inventory: description
const inventoryCols = db.prepare("PRAGMA table_info(inventory)").all();
if (!inventoryCols.some(col => col.name === "description")) {
  db.prepare("ALTER TABLE inventory ADD COLUMN description TEXT").run();
}

// patients: document
const patientCols = db.prepare("PRAGMA table_info(patients)").all();
if (!patientCols.some(col => col.name === "document")) {
  db.prepare("ALTER TABLE patients ADD COLUMN document TEXT").run();
}

// appointments: treatment + status + price
const appointmentCols = db.prepare("PRAGMA table_info(appointments)").all();
if (!appointmentCols.some(col => col.name === "treatment")) {
  db.prepare("ALTER TABLE appointments ADD COLUMN treatment TEXT").run();
  console.log("✅ Columna 'treatment' añadida a appointments");
}
if (!appointmentCols.some(col => col.name === "status")) {
  db.prepare("ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'pending'").run();
  console.log("✅ Columna 'status' añadida a appointments");
}
if (!appointmentCols.some(col => col.name === "price")) {
  db.prepare("ALTER TABLE appointments ADD COLUMN price REAL").run();
  console.log("✅ Columna 'price' añadida a appointments");
}

// ===== EXPORT =====
module.exports = db;