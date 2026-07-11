// backend/core/services/inventoryCore.js
const db = require('../../db/database');
const { validateInventory } = require('../utils/validators');
const { checkStock } = require('../utils/businessRules');

exports.getAll = () => {
  return db.prepare('SELECT * FROM inventory ORDER BY name').all();
};

exports.getById = (id) => {
  return db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
};

exports.create = (data) => {
  validateInventory(data);
  const stmt = db.prepare(`
    INSERT INTO inventory (name, quantity, price, description)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(data.name, data.quantity, data.price, data.description || '');
  return { id: info.lastInsertRowid, ...data };
};

exports.updateStock = (id, quantityChange) => {
  // quantityChange puede ser positivo (reposición) o negativo (venta)
  const stmt = db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?');
  const result = stmt.run(quantityChange, id);
  if (result.changes === 0) throw new Error('Producto no encontrado');
  return { success: true };
};

exports.checkStock = (id, requiredQuantity) => {
  checkStock(id, requiredQuantity);
  return { available: true };
};