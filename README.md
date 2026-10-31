# MenuKita · Kedai Senja

MenuKita adalah aplikasi pemesanan untuk Kedai Senja. Pelanggan dapat melihat menu, mengirim pesanan, dan memantau statusnya; pemilik atau barista dapat mengelola pesanan serta ketersediaan menu.

## Persyaratan

- Node.js 20.9 atau lebih baru
- npm

## Instalasi

```bash
npm ci
```

## Konfigurasi

Untuk menyimpan dan menyinkronkan data melalui Supabase, buat berkas `.env.local` dari `.env.example`, lalu isi URL proyek dan anon key Supabase. Nama variabel yang digunakan:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Jalankan SQL dalam [`supabase/schema.sql`](supabase/schema.sql) melalui SQL Editor Supabase untuk membuat tabel, kebijakan, publikasi realtime, serta data awal. Tanpa konfigurasi Supabase, aplikasi menggunakan data demo dan penyimpanan LocalStorage di browser.

## Mulai

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk memilih nomor meja otomatis, tambahkan parameter `?meja=4`; parameter `?mode=adm` membuka tampilan admin.

## Fitur

- Katalog menu dengan pencarian dan kategori.
- Pemesanan makan di tempat atau takeaway, termasuk catatan pesanan.
- Pemantauan status pesanan dan pembaruan realtime melalui Supabase.
- Tampilan dapur untuk memperbarui status pesanan dan ketersediaan menu.
- Autentikasi Supabase untuk mengamankan akses Pemilik & Barista dari publik (Pelanggan memesan bebas tanpa akun, staf/pemilik wajib login untuk mengelola pesanan & menu dengan proteksi Row Level Security).
- Ringkasan penjualan dan tema gelap.

## Perintah

```bash
npm run lint
npm run build
npm run start
```

Skrip tersebut menjalankan ESLint, membuat build produksi, dan menjalankan server produksi.
