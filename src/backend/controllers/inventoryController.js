const db = require('../db/database');

module.exports = {
  getInventory: (req, res) => {
    try {
      const items = db.prepare('SELECT * FROM inventory').all();
      res.json(items);
    } catch (err) {
      console.error('Error al obtener inventario:', err);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  },

  addItem: (req, res) => {
    try {
      const { name, description, quantity, price } = req.body;
      const info = db.prepare('INSERT INTO inventory (name, description, quantity, price) VALUES (?, ?, ?, ?)').run(name, description || "", quantity, price);
      const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
      res.json({ success: true, item });
    } catch (err) {
      console.error('Error al agregar item:', err);
      res.status(500).json({ error: 'Error al agregar item' });
    }
  },

  updateStock: (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, quantity, price } = req.body;
      db.prepare('UPDATE inventory SET name = ?, description = ?, quantity = ?, price = ? WHERE id = ?').run(name, description || "", quantity, price, id);
      const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
      res.json({ success: true, item: updated });
    } catch (err) {
      console.error('Error al actualizar item:', err);
      res.status(500).json({ error: 'Error al actualizar item' });
    }
  },

  deleteItem: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error al eliminar item:', err);
      res.status(500).json({ error: 'Error al eliminar item' });
    }
  }
};
