APIPSTUDIO SIMPLEHOST V1

Isi proyek:
- server.js: server penghubung Roblox Open Cloud
- public/index.html: tampilan website untuk HP
- package.json: dependensi dan perintah start
- .env.example: contoh pengaturan tanpa rahasia

PERSYARATAN
- Node.js 20 atau lebih baru
- Hosting untuk aplikasi Node.js
- Roblox Open Cloud API Key dengan izin Assets yang sesuai
- Creator ID akun atau grup yang berhak mengunggah aset

ENVIRONMENT VARIABLES DI HOSTING
ROBLOX_API_KEY       API Key Roblox (rahasia)
ROBLOX_CREATOR_ID    User ID atau Group ID pemilik aset
ROBLOX_CREATOR_TYPE  USER atau GROUP
UPLOAD_ACCESS_CODE   Kode akses rahasia untuk website
PORT                 Biasanya diatur otomatis oleh hosting

JANGAN upload file .env atau API Key ke GitHub. API Key hanya boleh disimpan pada Environment/Secrets hosting.

DEPLOY KE RENDER
1. Upload isi folder ini ke repository GitHub.
2. Render Dashboard > New > Web Service.
3. Hubungkan repository.
4. Language: Node
5. Build Command: npm install
6. Start Command: npm start
7. Root Directory: kosong
8. Tambahkan empat environment variables di atas.
9. Deploy.

UPLOAD
- Mendukung .rbxm dan .rbxmx, maksimal 20 MB.
- Roblox mengunggah model sebagai package.
- Asset ID tidak otomatis berarti model sudah disetujui atau tersedia publik di Creator Store.
- Roblox Assets API masih Beta dan dapat berubah.

Keamanan: gunakan HTTPS, lindungi kode akses, dan jangan membagikan API Key, password Roblox, atau kode rahasia.
