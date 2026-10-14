const { readSheet, appendRow, updateSheet, generateId } = require('./_sheets');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    // GET — daftar semua user
    if (req.method === 'GET') {
      const users = await readSheet('users');
      return res.status(200).json({ success: true, users });
    }

    // POST — tambah user baru
    if (req.method === 'POST') {
      const { nama } = req.body || {};
      if (!nama || !nama.trim()) {
        return res.status(400).json({ success: false, message: 'Nama kosong' });
      }

      const users = await readSheet('users');
      const id = generateId(users);
      const qr = 'QR_' + id + '_' + crypto.randomBytes(4).toString('hex');

      await appendRow('users', [String(id), nama.trim(), qr]);
      return res.status(200).json({ success: true, id, nama: nama.trim(), qr_code: qr });
    }

    // PUT — edit user
    if (req.method === 'PUT') {
      const { id, nama } = req.body || {};
      if (!id || !nama) {
        return res.status(400).json({ success: false, message: 'ID dan Nama wajib' });
      }

      const users = await readSheet('users');
      const updated = users.map((u) => {
        if (u.id === String(id)) return { ...u, nama: nama.trim() };
        return u;
      });

      await updateSheet('users', ['id', 'nama', 'qr_code'], updated);
      return res.status(200).json({ success: true, message: 'User diupdate' });
    }

    // DELETE — hapus user
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID wajib' });
      }

      const users = await readSheet('users');
      const filtered = users.filter((u) => u.id !== String(id));

      await updateSheet('users', ['id', 'nama', 'qr_code'], filtered);
      return res.status(200).json({ success: true, message: 'User dihapus' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};