const db = require('../db/database');

module.exports = {
  login: (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
  }
};
