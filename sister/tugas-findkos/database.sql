-- ===================================================
-- SKEMA DATABASE: db_findkos_hybrid
-- Sistem Terdistribusi - REST API + Third Party API
-- ===================================================

CREATE TABLE IF NOT EXISTS kos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kos VARCHAR(100) NOT NULL,
    lokasi VARCHAR(100) NOT NULL,
    harga_bulanan INTEGER NOT NULL,
    fasilitas TEXT NOT NULL,
    gambar_url TEXT,
    latitude REAL,
    longitude REAL
);

CREATE TABLE IF NOT EXISTS favorit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kos_id INTEGER NOT NULL,
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kos_id) REFERENCES kos(id) ON DELETE CASCADE
);

-- Seed Data Dummy Awal dengan Koordinat Area Semarang
INSERT INTO kos (nama_kos, lokasi, harga_bulanan, fasilitas, gambar_url, latitude, longitude) VALUES
('Kos Anugerah Residence', 'Tembalang, Semarang', 1200000, 'AC, Wi-Fi 100Mbps, Kamar Mandi Dalam', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500', -7.0505, 110.4379),
('Kos UDINUS Executive', 'Pendrikan Kidul, Semarang', 1800000, 'AC, Smart TV, Wi-Fi, Water Heater', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500', -6.9826, 110.4091),
('Kos Melati Asri', 'Gajahmungkur, Semarang', 850000, 'Wi-Fi, Kasur, Lemari, Garasi Motor', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500', -7.0092, 110.4145);