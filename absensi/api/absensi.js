const { readSheet, appendRow, updateSheet, generateId } = require('./_sheets');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    // POST — scan QR dan catat absensi
    if (req.method === 'POST') {
      const { qr_code } = req.body || {};
      if (!qr_code || !qr_code.trim()) {
        return res.status(400).json({ success: false, message: 'QR code kosong' });
      }

      // Cari user
      const users = await readSheet('users');
      const user = users.find((u) => u.qr_code === qr_code.trim());

      if (!user) {
        return res.status(404).json({ success: false, message: 'QR code tidak terdaftar' });
      }

      // Cek sudah absen hari ini
      const absensi = await readSheet('absensi');
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const sudah = absensi.some(
        (a) => a.user_id === user.id && a.waktu && a.waktu.startsWith(today)
      );

      if (sudah) {
        return res.status(409).json({
          success: false,
          message: user.nama + ' sudah absen hari ini',
        });
      }

      // Catat
      const id = generateId(absensi);
      const waktu = new Date().toLocaleString('sv-SE').replace('T', ' '); // YYYY-MM-DD HH:mm:ss

      await appendRow('absensi', [String(id), user.id, user.nama, waktu]);

      return res.status(200).json({ success: true, nama: user.nama, waktu });
    }

    // GET — daftar absensi (dengan filter opsional ?date=YYYY-MM-DD&name=xxx)
    if (req.method === 'GET') {
      let absensi = await readSheet('absensi');
      const { date, name } = req.query || {};

      if (date) {
        absensi = absensi.filter((a) => a.waktu && a.waktu.startsWith(date));
      }
      if (name) {
        absensi = absensi.filter(
          (a) => a.nama && a.nama.toLowerCase().includes(name.toLowerCase())
        );
      }

      // Sort terbaru
      absensi.sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''));

      // Daftar tanggal unik
      const allAbsensi = await readSheet('absensi');
      const dates = [...new Set(allAbsensi.map((a) => (a.waktu || '').slice(0, 10)))].sort().reverse();

      const users = await readSheet('users');

      return res.status(200).json({
        success: true,
        absensi,
        total: absensi.length,
        total_users: users.length,
        dates,
      });
    }

    // DELETE — hapus record absensi
    if (req.method === 'DELETE') {
      const { id, clearAll } = req.body || {};

      if (clearAll) {
        await updateSheet('absensi', ['id', 'user_id', 'nama', 'waktu'], []);
        return res.status(200).json({ success: true, message: 'Semua data dihapus' });
      }

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID wajib' });
      }

      const absensi = await readSheet('absensi');
      const filtered = absensi.filter((a) => a.id !== String(id));
      await updateSheet('absensi', ['id', 'user_id', 'nama', 'waktu'], filtered);

      return res.status(200).json({ success: true, message: 'Record dihapus' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};