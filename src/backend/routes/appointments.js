// backend/routes/appointments.js
const express = require("express");
const db = require("../db/database");
const router = express.Router();

// GET /appointments
router.get("/", (req, res) => {
  try {
    const appointments = db.prepare("SELECT * FROM appointments").all();
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener citas" });
  }
});

// POST /appointments
router.post("/", (req, res) => {
  const { patient_id, date, time, notes } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO appointments (patient_id, date, time, notes) VALUES (?, ?, ?, ?)");
    const info = stmt.run(patient_id, date, time, notes);
    const appointment = { id: info.lastInsertRowid, patient_id, date, time, notes };
    res.json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al crear cita" });
  }
});

// DELETE /appointments/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare("DELETE FROM appointments WHERE id = ?");
    const info = stmt.run(id);
    res.json({ success: info.changes > 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al eliminar cita" });
  }
});

module.exports = router;
