// backend/core/services/pointsCore.js
const db = require('../../db/database');

exports.getByPatient = (patientId) => {
  return db.prepare(`
    SELECT * FROM points WHERE patient_id = ?
    ORDER BY date DESC
  `).all(patientId);
};

exports.addPoints = (patientId, points, source) => {
  if (!patientId) throw new Error('El paciente es obligatorio');
  if (!points || points <= 0) throw new Error('Los puntos deben ser mayores a 0');

  const stmt = db.prepare(`
    INSERT INTO points (patient_id, points, source, date)
    VALUES (?, ?, ?, datetime('now'))
  `);
  stmt.run(patientId, points, source || 'Acumulación');
};

exports.getTotal = (patientId) => {
  const row = db.prepare(`
    SELECT SUM(points) AS total FROM points WHERE patient_id = ?
  `).get(patientId);
  return row?.total || 0;
};

exports.redeemPoints = (patientId, pointsToRedeem) => {
  const total = exports.getTotal(patientId);
  if (total < pointsToRedeem) {
    throw new Error(`Puntos insuficientes. Disponibles: ${total}, solicitados: ${pointsToRedeem}`);
  }
  // Restar puntos (registrar como gasto)
  exports.addPoints(patientId, -pointsToRedeem, 'Canje de puntos');
};