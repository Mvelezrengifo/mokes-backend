// businessMemory.js - Memoria del negocio (promociones, precios, tratamientos, reglas)
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/business-data.json');

// Cargar datos iniciales
let memory = {
  promotions: [],
  prices: [],
  treatments: [],
  rules: []
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      memory = JSON.parse(raw);
      console.log('📦 businessMemory cargada desde JSON');
    } else {
      console.warn('⚠️ business-data.json no existe, creando archivo por defecto');
      saveData();
    }
  } catch (error) {
    console.error('Error cargando businessMemory:', error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memory, null, 2), 'utf8');
    console.log('💾 businessMemory guardada');
  } catch (error) {
    console.error('Error guardando businessMemory:', error);
  }
}

// Obtener todo el contexto para OpenAI
function getContextForAI() {
  return `
PROMOCIONES ACTIVAS:
${memory.promotions.map(p => `- ${p.name} (válido hasta ${p.validUntil})`).join('\n')}

PRECIOS DE SERVICIOS:
${memory.prices.map(p => `- ${p.service}: $${p.price}`).join('\n')}

TRATAMIENTOS DISPONIBLES:
${memory.treatments.map(t => `- ${t.name}: ${t.description} (${t.duration} min)`).join('\n')}

REGLAS DEL NEGOCIO:
${memory.rules.map(r => `- ${r}`).join('\n')}
  `;
}

// Agregar nuevo conocimiento (el doctor enseña)
function addKnowledge(category, data) {
  if (!memory[category]) return { error: `Categoría ${category} no existe` };
  memory[category].push(data);
  saveData();
  return { success: true, message: `Agregado a ${category}` };
}

// Consultas específicas
function getPromotion(serviceName) {
  // Lógica simple de búsqueda
  return memory.promotions.find(p => p.name.toLowerCase().includes(serviceName.toLowerCase()));
}

function getPrice(serviceName) {
  return memory.prices.find(p => p.service.toLowerCase() === serviceName.toLowerCase());
}

module.exports = {
  loadData,
  getContextForAI,
  addKnowledge,
  getPromotion,
  getPrice,
  memory // exportar por si se necesita raw
};

// Cargar al inicio
loadData();