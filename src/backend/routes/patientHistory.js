const express = require("express");
const db = require("../db/database");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT id, date FROM patient_history ORDER BY date DESC").all();
    res.json({ success: true, entries: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/date/:date", (req, res) => {
  const { date } = req.params;
  try {
    const row = db.prepare("SELECT * FROM patient_history WHERE date = ?").get(date);
    if (!row) return res.json({ success: true, snapshot: null });
    let patients = [];
    try {
      patients = JSON.parse(row.snapshot || "[]");
      if (!Array.isArray(patients)) patients = [];
    } catch {
      patients = [];
    }
    res.json({ success: true, snapshot: { id: row.id, date: row.date, patients } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare("SELECT * FROM patient_history WHERE id = ?").get(id);
    if (!row) return res.json({ success: true, snapshot: null });
    let patients = [];
    try {
      patients = JSON.parse(row.snapshot || "[]");
      if (!Array.isArray(patients)) patients = [];
    } catch {
      patients = [];
    }
    res.json({ success: true, snapshot: { id: row.id, date: row.date, patients } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const saveHandler = (req, res) => {
  try {
    const patients = db.prepare("SELECT id, name, email, phone, age FROM patients").all();
    const date = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(patients || []);
    const upsert = db.prepare(
      "INSERT INTO patient_history(date, snapshot) VALUES(?, ?) ON CONFLICT(date) DO UPDATE SET snapshot=excluded.snapshot"
    );
    upsert.run(date, json);
    const row = db.prepare("SELECT id, date FROM patient_history WHERE date = ?").get(date);
    res.json({ success: true, entry: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post("/save", saveHandler);
router.get("/save", saveHandler);

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM patient_history WHERE id = ?").run(id);
    res.json({ success: info.changes > 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
