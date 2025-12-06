const express = require("express");
const db = require("../db/database");
const PDFDocument = require("pdfkit");
const router = express.Router();

// -----------------------------------------------------
// Obtener todas las facturas con nombre del paciente
// -----------------------------------------------------
router.get("/", (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT 
        invoices.*, 
        patients.name AS patient_name
      FROM invoices
      LEFT JOIN patients ON patients.id = invoices.patient_id
    `).all();

    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// Crear una factura
// -----------------------------------------------------
router.post("/", (req, res) => {
  const { patient_id, date, total, items } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO invoices (patient_id, date, total, items)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
      patient_id,
      date,
      total,
      JSON.stringify(items || [])
    );

    const invoice = db
      .prepare("SELECT * FROM invoices WHERE id = ?")
      .get(info.lastInsertRowid);

    const pts = Math.floor(Number(total || 0) / 10);
    if (pts > 0) {
      const d = date || new Date().toISOString().slice(0, 10);
      db.prepare("INSERT INTO points (patient_id, points, source, date, note) VALUES (?, ?, ?, ?, ?)")
        .run(patient_id, pts, "invoice", d, null);
    }

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// Eliminar factura
// -----------------------------------------------------
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  try {
    db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// Generar PDF con nombre del paciente
// -----------------------------------------------------
router.get("/:id/pdf", (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la factura + nombre del paciente
    const invoice = db.prepare(`
      SELECT 
        invoices.*,
        patients.name AS patient_name
      FROM invoices
      LEFT JOIN patients ON invoices.patient_id = patients.id
      WHERE invoices.id = ?
    `).get(id);

    if (!invoice)
      return res.status(404).json({ success: false, message: "Factura no encontrada" });

    // Items
    let items = [];
    try {
      items = JSON.parse(invoice.items || "[]");
      if (!Array.isArray(items)) items = [];
    } catch {
      items = [];
    }

    // ------------------------------------------------------------------
    // 🚀 Aquí corregimos el nombre del archivo PDF
    // ------------------------------------------------------------------
    const cleanName = (invoice.patient_name || "Paciente")
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, ""); // elimina caracteres raros

    const fileName = `${cleanName}_factura_${invoice.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );
    // ------------------------------------------------------------------

    // GENERACIÓN DEL PDF
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(22).text(`Factura #${invoice.id}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Paciente: ${invoice.patient_name || "Desconocido"}`);
    doc.fontSize(14).text(`Fecha: ${invoice.date}`);
    doc.fontSize(14).text(`Total: $${invoice.total}`);
    doc.moveDown();

    doc.fontSize(16).text("Items:");
    doc.moveDown();

    if (items.length === 0) {
      doc.fontSize(14).text("No hay items registrados.");
    } else {
      items.forEach((item) => {
        doc
          .fontSize(14)
          .text(`${item.name} - Cantidad: ${item.quantity} - Precio: $${item.price}`);
      });
    }

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
