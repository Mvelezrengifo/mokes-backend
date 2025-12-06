// backend/routes/patients.js
const express = require("express");
const db = require("../db/database");
const router = express.Router();

// GET /patients
router.get("/", (req, res) => {
  try {
    const patients = db.prepare("SELECT * FROM patients").all();
    res.json({ success: true, patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener pacientes" });
  }
});

// POST /patients
router.post("/", (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)");
    const info = stmt.run(name, email, phone);
    const patient = { id: info.lastInsertRowid, name, email, phone };
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

module.exports = router;
