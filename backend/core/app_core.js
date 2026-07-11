// backend/core/app_core.js
// Este es el ORQUESTADOR CENTRAL que une todos los servicios

const patients = require('./services/patientsCore');
const appointments = require('./services/appointmentsCore');
const medicalRecords = require('./services/medicalRecordsCore');
const invoices = require('./services/invoicesCore');
const points = require('./services/pointsCore');
const inventory = require('./services/inventoryCore');

module.exports = {
  patients,
  appointments,
  medicalRecords,
  invoices,
  points,
  inventory,
};