const express = require("express");
const db = require("../db/database");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM medical_records ORDER BY date DESC, id DESC").all();
    res.json({ success: true, records: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/patient/:patient_id", (req, res) => {
  const { patient_id } = req.params;
  try {
    const rows = db.prepare("SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC, id DESC").all(patient_id);
    res.json({ success: true, records: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { patient_id, date, description } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO medical_records (patient_id, date, description) VALUES (?, ?, ?)");
    const info = stmt.run(patient_id, date, description);
    const rec = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(info.lastInsertRowid);
    res.json({ success: true, record: rec });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM medical_records WHERE id = ?").run(id);
    res.json({ success: info.changes > 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

