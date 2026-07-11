// backend/core/utils/businessRules.js
const db = require('../../db/database');

// Calcular puntos según el total de la factura
function calculatePoints(total) {
  // Ejemplo: 1 punto por cada $10
  return Math.floor(total / 10);
}

// Actualizar inventario después de una factura
function updateInventoryOnInvoice(items) {
  // items: [{ productId, quantity }]
  for (const item of items) {
    const stmt = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?');
    const result = stmt.run(item.quantity, item.productId);
    if (result.changes === 0) {
      throw new Error(`Producto con ID ${item.productId} no encontrado o stock insuficiente`);
    }
  }
}

// Verificar stock antes de una venta
function checkStock(productId, requiredQuantity) {
  const row = db.prepare('SELECT quantity FROM inventory WHERE id = ?').get(productId);
  if (!row) throw new Error(`Producto con ID ${productId} no encontrado`);
  if (row.quantity < requiredQuantity) {
    throw new Error(`Stock insuficiente para el producto ${productId}. Disponible: ${row.quantity}`);
  }
}

module.exports = {
  calculatePoints,
  updateInventoryOnInvoice,
  checkStock,
};