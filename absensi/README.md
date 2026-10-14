# Sistem Absensi QR — Node.js + Google Sheets API

Deploy ke Vercel tanpa VPS. Data permanen di Google Sheets.

## Struktur
```
absensi/
├── api/
│   ├── _sheets.js       (helper Google Sheets)
│   ├── users.js          (API user: GET/POST/PUT/DELETE)
│   └── absensi.js        (API absensi: GET/POST/DELETE)
├── public/
│   ├── index.html        (halaman utama)
│   ├── register.html     (kelola user + QR)
│   ├── scan.html         (scan kamera + input manual)
│   └── admin.html        (laporan kehadiran)
├── package.json
├── vercel.json
└── .gitignore
```

## Setup

### 1. Buat Google Sheets
1. Buka https://sheets.google.com → buat spreadsheet baru
2. Buat 2 tab sheet:
   - **users** — header baris pertama: `id | nama | qr_code`
   - **absensi** — header baris pertama: `id | user_id | nama | waktu`
3. Copy Spreadsheet ID dari URL:
   `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 2. Setup Google Cloud
1. Buka https://console.cloud.google.com
2. Buat project baru
3. Enable **Google Sheets API**
4. Buat **Service Account** → download **JSON key**
5. Share spreadsheet ke email service account (beri akses Editor)

### 3. Deploy ke Vercel
```bash
npm install -g vercel
cd C:\laragon\www\absensi
npm install
vercel login
vercel
```

### 4. Set Environment Variables di Vercel Dashboard
Settings → Environment Variables:
- **SPREADSHEET_ID** = (paste ID spreadsheet)
- **GOOGLE_CREDENTIALS** = (paste base64 dari credentials.json)

Encode credentials ke base64 (PowerShell):
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("credentials.json"))
```

### 5. Selesai
Buka URL Vercel yang diberikan setelah deploy.