/**
 * BACKEND REST API SERVER + THIRD-PARTY GEOCODING API
 * Framework: Express.js
 * Database: SQLite3
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi Database SQLite
const dbPath = path.resolve(__dirname, 'findkos_hybrid.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Gagal koneksi database:', err.message);
    else console.log('Terhubung ke database SQLite (findkos_hybrid.db)');
});

// Setup Tabel
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS kos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kos TEXT NOT NULL,
        lokasi TEXT NOT NULL,
        harga_bulanan INTEGER NOT NULL,
        fasilitas TEXT NOT NULL,
        gambar_url TEXT,
        latitude REAL,
        longitude REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS favorit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kos_id INTEGER NOT NULL,
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kos_id) REFERENCES kos(id) ON DELETE CASCADE
    )`);

    // Insert data dummy awal jika kosong
    db.get(`SELECT COUNT(*) as count FROM kos`, (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO kos (nama_kos, lokasi, harga_bulanan, fasilitas, gambar_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            stmt.run('Kos Anugerah Residence', 'Tembalang, Semarang', 1200000, 'AC, Wi-Fi 100Mbps, Kamar Mandi Dalam', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500', -7.0505, 110.4379);
            stmt.run('Kos UDINUS Executive', 'Pendrikan Kidul, Semarang', 1800000, 'AC, Smart TV, Wi-Fi, Water Heater', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500', -6.9826, 110.4091);
            stmt.run('Kos Melati Asri', 'Gajahmungkur, Semarang', 850000, 'Wi-Fi, Kasur, Lemari, Garasi Motor', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500', -7.0092, 110.4145);
            stmt.finalize();
        }
    });
});

// Helper function untuk memanggil Third-Party REST API OpenStreetMap (Nominatim Geocoding)
async function getCoordinatesFromLocation(locationName) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'FindKos-App/1.0 (Student Project)' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error('Error memanggil OpenStreetMap API:', error.message);
    }
    // Default Fallback (Area Semarang) jika API luar tidak menemukan lokasi
    return { lat: -6.9826, lon: 110.4091 };
}

// =================================================================
// CUSTOM REST API ENDPOINTS
// =================================================================

// 1. GET /api/kos -> Ambil semua daftar kos
app.get('/api/kos', (req, res) => {
    const search = req.query.q ? `%${req.query.q}%` : '%';
    const sql = `SELECT * FROM kos WHERE nama_kos LIKE ? OR lokasi LIKE ? ORDER BY id DESC`;
    
    db.all(sql, [search, search], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.status(200).json({ status: 'success', data: rows });
    });
});

// 2. POST /api/kos -> Tambah kos baru & panggil Third-Party API
app.post('/api/kos', async (req, res) => {
    const { nama_kos, lokasi, harga_bulanan, fasilitas, gambar_url } = req.body;
    
    if (!nama_kos || !lokasi || !harga_bulanan) {
        return res.status(400).json({ status: 'error', message: 'Nama, lokasi, dan harga wajib diisi' });
    }

    // MEMANGGIL REST API THIRDPARTY (OpenStreetMap) untuk koordinat
    const coords = await getCoordinatesFromLocation(lokasi);

    const sql = `INSERT INTO kos (nama_kos, lokasi, harga_bulanan, fasilitas, gambar_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        nama_kos, 
        lokasi, 
        harga_bulanan, 
        fasilitas || 'Standar', 
        gambar_url || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500',
        coords.lat,
        coords.lon
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.status(201).json({
            status: 'success',
            message: 'Kos berhasil ditambahkan dengan koordinat dari OpenStreetMap API!',
            data: { id: this.lastID, nama_kos, lokasi, harga_bulanan, latitude: coords.lat, longitude: coords.lon }
        });
    });
});

// 3. DELETE /api/kos/:id -> Hapus kos
app.delete('/api/kos/:id', (req, res) => {
    const sql = `DELETE FROM kos WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        if (this.changes === 0) return res.status(404).json({ status: 'error', message: 'Kos tidak ditemukan' });
        res.status(200).json({ status: 'success', message: 'Data kos berhasil dihapus' });
    });
});

// 4. GET /api/favorit
app.get('/api/favorit', (req, res) => {
    const sql = `
        SELECT favorit.id as favorit_id, favorit.created_at, kos.* 
        FROM favorit 
        JOIN kos ON favorit.kos_id = kos.id 
        ORDER BY favorit.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.status(200).json({ status: 'success', data: rows });
    });
});

// 5. POST /api/favorit
app.post('/api/favorit', (req, res) => {
    const { kos_id, catatan } = req.body;
    if (!kos_id) return res.status(400).json({ status: 'error', message: 'kos_id wajib disertakan' });

    const sql = `INSERT INTO favorit (kos_id, catatan) VALUES (?, ?)`;
    db.run(sql, [kos_id, catatan || ''], function(err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.status(201).json({ status: 'success', message: 'Ditambahkan ke favorit', favorit_id: this.lastID });
    });
});

// 6. DELETE /api/favorit/:id
app.delete('/api/favorit/:id', (req, res) => {
    const sql = `DELETE FROM favorit WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.status(200).json({ status: 'success', message: 'Dihapus dari favorit' });
    });
});

app.listen(PORT, () => {
    console.log(`Server REST API Hybrid berjalan di http://localhost:${PORT}`);
});