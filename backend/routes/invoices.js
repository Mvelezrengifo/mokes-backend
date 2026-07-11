const express = require("express");
const db = require("../db/database");
const PDFDocument = require("pdfkit");
const router = express.Router();

// Obtener todas las facturas
router.get("/", (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT invoices.*, patients.name AS patient_name, patients.document AS patient_document
      FROM invoices
      LEFT JOIN patients ON patients.id = invoices.patient_id
      ORDER BY invoices.date DESC
    `).all();

    const parsed = invoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || "[]")
    }));

    res.json({ success: true, invoices: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Crear factura y sumar puntos
router.post("/", (req, res) => {
  const { patient_id, date, total, items, description } = req.body;
  const d = date || new Date().toISOString().slice(0, 10);
  const t = Number(total) || 0;
  const itemsArray = Array.isArray(items) ? items : [];

  try {
    const info = db.prepare(`
      INSERT INTO invoices (patient_id, date, total, items, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(patient_id, d, t, JSON.stringify(itemsArray), description || "Servicio Médico");

    const invoice = db.prepare(`
      SELECT invoices.*, patients.name AS patient_name, patients.document AS patient_document
      FROM invoices
      LEFT JOIN patients ON patients.id = invoices.patient_id
      WHERE invoices.id = ?
    `).get(info.lastInsertRowid);

    // Lógica de puntos automática
    const pts = Math.floor(t / 10);
    if (pts > 0) {
      db.prepare(`INSERT INTO points (patient_id, points, source, date) VALUES (?, ?, ?, ?)`).run(patient_id, pts, "invoice", d);
    }

    res.json({ success: true, invoice: { ...invoice, items: itemsArray } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM invoices WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;