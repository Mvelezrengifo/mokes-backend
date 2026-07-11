// backend/core/services/invoicesCore.js
const db = require('../../db/database');
const { validateInvoice } = require('../utils/validators');
const { calculatePoints, updateInventoryOnInvoice } = require('../utils/businessRules');
const pointsCore = require('./pointsCore');

exports.getAll = () => {
  return db.prepare(`
    SELECT i.*, p.name AS patient_name
    FROM invoices i
    LEFT JOIN patients p ON i.patient_id = p.id
    ORDER BY i.date DESC
  `).all();
};

exports.create = (data) => {
  validateInvoice(data);

  // 1. Crear la factura
  const stmt = db.prepare(`
    INSERT INTO invoices (patient_id, date, total, items, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.patient_id,
    data.date || new Date().toISOString().split('T')[0],
    data.total,
    JSON.stringify(data.items),
    data.description || ''
  );

  // 2. Regla de negocio: sumar puntos al paciente
  const pointsEarned = calculatePoints(data.total);
  pointsCore.addPoints(data.patient_id, pointsEarned, `Factura #${info.lastInsertRowid}`);

  // 3. Regla de negocio: descontar inventario
  if (data.items && data.items.length > 0) {
    updateInventoryOnInvoice(data.items);
  }

  return { id: info.lastInsertRowid, ...data };
};

exports.getByPatient = (patientId) => {
  return db.prepare(`
    SELECT * FROM invoices WHERE patient_id = ?
    ORDER BY date DESC
  `).all(patientId);
};