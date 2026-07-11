const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { ipcMain } = require('electron');

function init(app) {
  const dbPath = path.join(app.getPath('userData'), 'mokes-clinic.sqlite');

  // Ensure folder exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error abriendo BD:', err);
    else console.log('SQLite conectada en', dbPath);
  });

  function initializeDatabase() {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        especie TEXT NOT NULL,
        raza TEXT,
        dueno TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        fecha_nacimiento DATE,
        peso REAL,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        fecha DATETIME NOT NULL,
        tipo TEXT NOT NULL,
        motivo TEXT,
        veterinario TEXT,
        estado TEXT DEFAULT 'pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(paciente_id) REFERENCES pacientes(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS historia_clinica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        fecha DATETIME NOT NULL,
        diagnostico TEXT,
        tratamiento TEXT,
        medicamentos TEXT,
        observaciones TEXT,
        veterinario TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(paciente_id) REFERENCES pacientes(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS facturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        numero_factura TEXT UNIQUE,
        fecha DATE NOT NULL,
        total REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        detalles TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(paciente_id) REFERENCES pacientes(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS puntos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        puntos INTEGER DEFAULT 0,
        historial TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(paciente_id) REFERENCES pacientes(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT,
        cantidad INTEGER DEFAULT 0,
        precio_unitario REAL,
        fecha_vencimiento DATE,
        proveedor TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }

  initializeDatabase();

  // --- IPC handlers (retornan promesas) ---
  ipcMain.handle('db:getPacientes', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM pacientes ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  });

  ipcMain.handle('db:addPaciente', (event, p) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO pacientes (nombre, especie, raza, dueno, telefono, email, fecha_nacimiento, peso, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.nombre, p.especie, p.raza, p.dueno, p.telefono, p.email, p.fecha_nacimiento, p.peso, p.notas],
        function(err) {
          if (err) reject(err); else resolve({ id: this.lastID, ...p });
        }
      );
    });
  });

  ipcMain.handle('db:updatePaciente', (event, id, p) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE pacientes SET nombre=?, especie=?, raza=?, dueno=?, telefono=?, email=?, fecha_nacimiento=?, peso=?, notas=? WHERE id=?`,
        [p.nombre, p.especie, p.raza, p.dueno, p.telefono, p.email, p.fecha_nacimiento, p.peso, p.notas, id],
        function(err) {
          if (err) reject(err); else resolve({ id, ...p });
        }
      );
    });
  });

  ipcMain.handle('db:deletePaciente', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM pacientes WHERE id=?', [id], function(err) {
        if (err) reject(err); else resolve({ success: true });
      });
    });
  });

  // Citas
  ipcMain.handle('db:getCitas', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM citas ORDER BY fecha DESC', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  });

  ipcMain.handle('db:addCita', (event, c) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO citas (paciente_id, fecha, tipo, motivo, veterinario, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.paciente_id, c.fecha, c.tipo, c.motivo, c.veterinario, c.estado],
        function(err) { if (err) reject(err); else resolve({ id: this.lastID, ...c }); }
      );
    });
  });

  ipcMain.handle('db:updateCita', (event, id, c) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE citas SET paciente_id=?, fecha=?, tipo=?, motivo=?, veterinario=?, estado=? WHERE id=?`,
        [c.paciente_id, c.fecha, c.tipo, c.motivo, c.veterinario, c.estado, id],
        function(err) { if (err) reject(err); else resolve({ id, ...c }); }
      );
    });
  });

  ipcMain.handle('db:deleteCita', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM citas WHERE id=?', [id], function(err) {
        if (err) reject(err); else resolve({ success: true });
      });
    });
  });

  // Historia clínica
  ipcMain.handle('db:getHistoria', (event, pacienteId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM historia_clinica WHERE paciente_id=? ORDER BY fecha DESC', [pacienteId], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  });

  ipcMain.handle('db:addHistoria', (event, h) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO historia_clinica (paciente_id, fecha, diagnostico, tratamiento, medicamentos, observaciones, veterinario)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [h.paciente_id, h.fecha, h.diagnostico, h.tratamiento, h.medicamentos, h.observaciones, h.veterinario],
        function(err) { if (err) reject(err); else resolve({ id: this.lastID, ...h }); }
      );
    });
  });

  // Facturas
  ipcMain.handle('db:getFacturas', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM facturas ORDER BY fecha DESC', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  });

  ipcMain.handle('db:addFactura', (event, f) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO facturas (paciente_id, numero_factura, fecha, total, estado, detalles)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.paciente_id, f.numero_factura, f.fecha, f.total, f.estado, f.detalles],
        function(err) { if (err) reject(err); else resolve({ id: this.lastID, ...f }); }
      );
    });
  });

  // Puntos (implementación robusta sin depender de ON CONFLICT)
  ipcMain.handle('db:addPuntos', (event, pacienteId, puntos) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT puntos FROM puntos WHERE paciente_id=?', [pacienteId], (err, row) => {
        if (err) return reject(err);
        if (row) {
          db.run('UPDATE puntos SET puntos = puntos + ?, updated_at = CURRENT_TIMESTAMP WHERE paciente_id = ?', [puntos, pacienteId], function(err) {
            if (err) reject(err); else resolve({ success: true });
          });
        } else {
          db.run('INSERT INTO puntos (paciente_id, puntos) VALUES (?, ?)', [pacienteId, puntos], function(err) {
            if (err) reject(err); else resolve({ success: true });
          });
        }
      });
    });
  });

  ipcMain.handle('db:getPuntos', (event, pacienteId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT puntos FROM puntos WHERE paciente_id=?', [pacienteId], (err, row) => {
        if (err) reject(err); else resolve(row ? row.puntos : 0);
      });
    });
  });

  // Inventario
  ipcMain.handle('db:getInventario', () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM inventario ORDER BY nombre ASC', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  });

  ipcMain.handle('db:addProducto', (event, p) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventario (nombre, categoria, cantidad, precio_unitario, fecha_vencimiento, proveedor)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.nombre, p.categoria, p.cantidad, p.precio_unitario, p.fecha_vencimiento, p.proveedor],
        function(err) { if (err) reject(err); else resolve({ id: this.lastID, ...p }); }
      );
    });
  });

  ipcMain.handle('db:updateProducto', (event, id, p) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE inventario SET nombre=?, categoria=?, cantidad=?, precio_unitario=?, fecha_vencimiento=?, proveedor=? WHERE id=?`,
        [p.nombre, p.categoria, p.cantidad, p.precio_unitario, p.fecha_vencimiento, p.proveedor, id],
        function(err) { if (err) reject(err); else resolve({ id, ...p }); }
      );
    });
  });

  ipcMain.handle('db:deleteProducto', (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM inventario WHERE id=?', [id], function(err) {
        if (err) reject(err); else resolve({ success: true });
      });
    });
  });

  // cerrar DB cuando app salga
  app.on('will-quit', () => {
    db.close((err) => {
      if (err) console.error('Error cerrando BD:', err);
      else console.log('BD cerrada');
    });
  });
}

module.exports = init;