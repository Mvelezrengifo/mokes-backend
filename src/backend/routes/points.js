const express = require("express");
const db = require("../db/database");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM points ORDER BY date DESC, id DESC").all();
    res.json({ success: true, points: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/totals", (req, res) => {
  try {
    const rows = db.prepare("SELECT patient_id, SUM(points) AS total FROM points GROUP BY patient_id").all();
    res.json({ success: true, totals: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/patient/:patient_id", (req, res) => {
  const { patient_id } = req.params;
  try {
    const rows = db.prepare("SELECT * FROM points WHERE patient_id = ? ORDER BY date DESC, id DESC").all(patient_id);
    const total = db.prepare("SELECT SUM(points) AS total FROM points WHERE patient_id = ?").get(patient_id);
    res.json({ success: true, points: rows, total: total?.total || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", (req, res) => {
  const { patient_id, points, note, source, date } = req.body;
  try {
    const d = date || new Date().toISOString().slice(0, 10);
    const stmt = db.prepare("INSERT INTO points (patient_id, points, source, date, note) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(patient_id, points, source || "manual", d, note || null);
    const rec = db.prepare("SELECT * FROM points WHERE id = ?").get(info.lastInsertRowid);
    res.json({ success: true, point: rec });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM points WHERE id = ?").run(id);
    res.json({ success: info.changes > 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

