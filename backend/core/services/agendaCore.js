// backend/core/services/agendaCore.js
const db = require('../../db/database');

function getAppointmentsByDate(date) {
  const stmt = db.prepare(`
    SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE DATE(a.date) = ?
    ORDER BY a.time ASC
  `);
  return stmt.all(date);
}

function getAppointmentsByRange(startDate, endDate) {
  const stmt = db.prepare(`
    SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE DATE(a.date) BETWEEN ? AND ?
    ORDER BY a.date ASC, a.time ASC
  `);
  return stmt.all(startDate, endDate);
}

function getUpcomingAppointments(limit = 10) {
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE DATE(a.date) >= ? AND a.status = 'pending'
    ORDER BY a.date ASC, a.time ASC
    LIMIT ?
  `);
  return stmt.all(today, limit);
}

function getAppointmentsSummary(date) {
  const appointments = getAppointmentsByDate(date);
  const total = appointments.length;
  const byStatus = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };
  const byHour = appointments.reduce((acc, a) => {
    const hour = a.time.split(':')[0];
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  return { total, byStatus, byHour, appointments };
}

module.exports = {
  getAppointmentsByDate,
  getAppointmentsByRange,
  getUpcomingAppointments,
  getAppointmentsSummary,
};