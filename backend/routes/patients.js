// backend/routes/patients.js
const express = require("express");
const router = express.Router();
const db = require("../db/database");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });

// Función auxiliar para convertir fechas a ISO
function parseDateToISO(dateVal) {
    if (!dateVal && dateVal !== 0) return null;
    if (dateVal instanceof Date && !isNaN(dateVal)) return dateVal.toISOString().slice(0, 10);
    const s = String(dateVal).trim();
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
        const day = m[1].padStart(2, '0');
        const month = m[2].padStart(2, '0');
        let year = m[3];
        if (year.length === 2) year = '20' + year;
        const d2 = new Date(`${year}-${month}-${day}`);
        if (!isNaN(d2)) return d2.toISOString().slice(0, 10);
    }
    return null;
}

// GET /patients
router.get("/", (req, res) => {
    try {
        const patientsRaw = db.prepare("SELECT * FROM patients").all();

        const patients = patientsRaw.map(p => {
            const totalRow = db.prepare("SELECT SUM(points) as total FROM points WHERE patient_id = ?").get(p.id);
            const total_points = totalRow?.total || 0;

            const history = db.prepare("SELECT date, points, note FROM points WHERE patient_id = ? ORDER BY date DESC").all(p.id);

            return { ...p, total_points, history };
        });

        res.json({ success: true, patients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al obtener pacientes" });
    }
});

// POST /patients
router.post("/", (req, res) => {
    const { name, document, email, phone } = req.body;
    try {
        const stmt = db.prepare("INSERT INTO patients (name, document, email, phone) VALUES (?, ?, ?, ?)");
        const info = stmt.run(name, document, email, phone);
        const patient = { id: info.lastInsertRowid, name, document, email, phone };
        res.json({ success: true, patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al crear paciente" });
    }
});

// DELETE /patients/:id
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    try {
        const run = db.transaction(() => {
            db.prepare("DELETE FROM points WHERE patient_id = ?").run(id);
            db.prepare("DELETE FROM medical_records WHERE patient_id = ?").run(id);
            db.prepare("DELETE FROM appointments WHERE patient_id = ?").run(id);
            db.prepare("DELETE FROM invoices WHERE patient_id = ?").run(id);
            const info = db.prepare("DELETE FROM patients WHERE id = ?").run(id);
            return info.changes > 0;
        });
        const success = run();
        res.json({ success });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al eliminar paciente" });
    }
});

// POST /patients/import-excel
router.post("/import-excel", upload.single("file"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

        let processed = 0, updated = 0, errors = [];

        const runner = db.transaction((dataRows) => {
            for (let i = 0; i < dataRows.length; i++) {
                const raw = dataRows[i];
                processed++;

                const normalized = {};
                Object.keys(raw || {}).forEach(k => {
                    const key = k ? k.toString().trim().toLowerCase() : "";
                    normalized[key] = raw[k];
                });

                const document = normalized.document || normalized.documento || normalized.doc || normalized.dni || normalized.identificacion;
                const dateRaw = normalized.date || normalized.fecha;
                const pointsRaw = normalized.points || normalized.puntos || normalized["puntos acumulados"] || normalized.total || normalized["total_points"];

                if (!document) { errors.push({ row: i + 1, message: "Missing document" }); continue; }
                if (!dateRaw) { errors.push({ row: i + 1, message: "Missing date" }); continue; }

                const dateISO = parseDateToISO(dateRaw);
                if (!dateISO) { errors.push({ row: i + 1, message: "Invalid date format" }); continue; }

                const excelPoints = (pointsRaw === null || pointsRaw === undefined || pointsRaw === "") ? null : Number(pointsRaw);
                if (excelPoints === null || isNaN(excelPoints)) { errors.push({ row: i + 1, message: "Invalid points" }); continue; }

                const patient = db.prepare("SELECT * FROM patients WHERE document = ?").get(String(document));
                if (!patient) { errors.push({ row: i + 1, message: "Patient not found" }); continue; }

                const cur = db.prepare("SELECT SUM(points) as total FROM points WHERE patient_id = ?").get(patient.id);
                const currentTotal = cur?.total || 0;
                const delta = Math.round(Number(excelPoints) - Number(currentTotal));
                if (delta === 0) continue;

                const stmt = db.prepare("INSERT INTO points (patient_id, points, source, date, note) VALUES (?, ?, ?, ?, ?)");
                stmt.run(patient.id, delta, "excel-import", dateISO, `Import from Excel; previous_total=${currentTotal}; new_total=${excelPoints}`);
                updated++;
            }
        });

        runner(rows);

        const snapshot = { processed, updated, errors, timestamp: new Date().toISOString() };
        try {
            db.prepare("INSERT INTO patient_history (date, snapshot) VALUES (?, ?)").run(snapshot.timestamp, JSON.stringify(snapshot));
        } catch (e) { console.warn("Could not insert patient_history snapshot:", e.message); }

        res.json({ success: true, processed, updated, errors });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
