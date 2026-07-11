// core/utils/businessMemoryService.js
const fs = require('fs');
const path = require('path');

// Ruta al archivo JSON de memoria comercial
const MEMORY_PATH = path.join(__dirname, '../../core/businessMemory.json');

let businessMemory = {
  services: [],
  promotions: [],
  schedule: {},
  policies: {},
  lastUpdated: null
};

/**
 * Carga el archivo businessMemory.json al iniciar el servicio.
 * Si el archivo no existe, crea uno por defecto.
 */
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const raw = fs.readFileSync(MEMORY_PATH, 'utf8');
      businessMemory = JSON.parse(raw);
      console.log('📦 Business Memory cargada correctamente.');
    } else {
      console.warn('⚠️ businessMemory.json no encontrado. Creando archivo por defecto.');
      saveMemory();
    }
  } catch (error) {
    console.error('Error al cargar Business Memory:', error);
  }
}

/**
 * Guarda la memoria comercial en el archivo JSON.
 * (Por ahora solo para escritura manual o futura API)
 */
function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(businessMemory, null, 2), 'utf8');
    console.log('💾 Business Memory guardada correctamente.');
  } catch (error) {
    console.error('Error al guardar Business Memory:', error);
  }
}

/**
 * Construye un string de contexto comercial para inyectar en el System Prompt.
 * Incluye servicios, precios, promociones, horarios y políticas.
 */
function getBusinessContext() {
  // Servicios y precios
  const servicesList = businessMemory.services
    .map(s => `• ${s.name}: $${s.price} (${s.duration} min) - ${s.description}`)
    .join('\n');

  // Promociones vigentes (filtra por fecha)
  const today = new Date().toISOString().split('T')[0];
  const activePromotions = businessMemory.promotions.filter(p => p.validUntil >= today);
  const promoList = activePromotions.length > 0
    ? activePromotions.map(p => `• ${p.name}: ${p.description} (válido hasta ${p.validUntil})`).join('\n')
    : 'No hay promociones vigentes en este momento.';

  // Horarios
  const scheduleText = Object.entries(businessMemory.schedule)
    .map(([day, hours]) => `• ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`)
    .join('\n');

  // Políticas
  const policiesText = Object.entries(businessMemory.policies)
    .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
    .join('\n');

  return `
INFORMACIÓN COMERCIAL DE LA CLÍNICA (DATOS ACTUALIZADOS AL ${businessMemory.lastUpdated || 'desconocido'}):

1. SERVICIOS Y PRECIOS:
${servicesList}

2. PROMOCIONES VIGENTES:
${promoList}

3. HORARIOS DE ATENCIÓN:
${scheduleText}

4. POLÍTICAS DE LA CLÍNICA:
${policiesText}

IMPORTANTE: Esta información es la que rige actualmente en la clínica. Si el doctor (el cliente) te pide actualizar algún dato, indícale que puede decírtelo y lo registrarás para futuras actualizaciones.
`;
}

/**
 * (Opcional) Permite actualizar el contexto desde el frontend o desde la conversación.
 * Por ahora solo actualiza el objeto en memoria y guarda el archivo.
 */
function updateMemory(newData) {
  if (newData.services) businessMemory.services = newData.services;
  if (newData.promotions) businessMemory.promotions = newData.promotions;
  if (newData.schedule) businessMemory.schedule = newData.schedule;
  if (newData.policies) businessMemory.policies = newData.policies;
  businessMemory.lastUpdated = new Date().toISOString().split('T')[0];
  saveMemory();
  console.log('🔄 Business Memory actualizada correctamente.');
}

/**
 * Agrega un nuevo servicio a la memoria comercial.
 * Si el servicio ya existe, actualiza el precio y duración.
 */
function addService(serviceName, price, duration) {
  const existing = businessMemory.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  if (existing) {
    // Actualizar precio y duración si se proporcionan
    if (price !== undefined) existing.price = price;
    if (duration !== undefined) existing.duration = duration;
    console.log(`🔄 Servicio actualizado: ${serviceName} ($${price}, ${duration}min)`);
  } else {
    const newService = {
      id: 'service-' + Date.now(),
      name: serviceName,
      price: price || 0,
      duration: duration || 30,
      description: ''
    };
    businessMemory.services.push(newService);
    console.log(`➕ Nuevo servicio agregado: ${serviceName} ($${price}, ${duration}min)`);
  }
  businessMemory.lastUpdated = new Date().toISOString().split('T')[0];
  saveMemory();
  return { success: true, service: serviceName, price, duration };
}

/**
 * Obtiene un servicio por nombre (para validaciones)
 */
function getServiceByName(name) {
  return businessMemory.services.find(s => s.name.toLowerCase() === name.toLowerCase());
}

// Cargar la memoria al iniciar el servicio
loadMemory();

module.exports = {
  loadMemory,
  saveMemory,
  getBusinessContext,
  updateMemory,
  addService,
  getServiceByName,
  businessMemory, // exponer objeto por si se necesita raw
};