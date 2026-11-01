const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.ROBLOX_API_KEY || "";
const creatorId = process.env.ROBLOX_CREATOR_ID || "";
const creatorType = (process.env.ROBLOX_CREATOR_TYPE || "USER").toUpperCase();
const accessCode = process.env.UPLOAD_ACCESS_CODE || "";
const MAX_SIZE = 20 * 1024 * 1024;

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 }
});

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function configured(req, res, next) {
  if (!apiKey || !creatorId || !accessCode) {
    return res.status(503).json({ error: "Server belum dikonfigurasi oleh pemilik website." });
  }
  if (!["USER", "GROUP"].includes(creatorType)) {
    return res.status(503).json({ error: "ROBLOX_CREATOR_TYPE harus USER atau GROUP." });
  }
  next();
}
function authorized(req, res, next) {
  if (!safeEqual(req.get("x-upload-access-code"), accessCode)) {
    return res.status(401).json({ error: "Kode akses tidak cocok." });
  }
  next();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, configured: Boolean(apiKey && creatorId && accessCode) });
});

app.post("/api/upload", configured, authorized, upload.single("modelFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Pilih file model terlebih dahulu." });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (![".rbxm", ".rbxmx"].includes(ext)) {
      return res.status(400).json({ error: "Format harus .rbxm atau .rbxmx." });
    }
    const displayName = String(req.body.displayName || "").trim().slice(0, 50);
    const description = String(req.body.description || "").trim().slice(0, 1000);
    if (!displayName) return res.status(400).json({ error: "Nama model wajib diisi." });

    const creator = creatorType === "GROUP" ? { groupId: creatorId } : { userId: creatorId };
    const metadata = {
      assetType: "Model",
      displayName,
      description,
      creationContext: { creator }
    };
    const form = new FormData();
    form.append("request", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("fileContent", new Blob([req.file.buffer], { type: "model/x-rbxm" }), req.file.originalname);

    const roblox = await fetch("https://apis.roblox.com/assets/v1/assets", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: form
    });
    const data = await roblox.json().catch(() => ({}));
    if (!roblox.ok) {
      return res.status(roblox.status >= 500 ? 502 : 400).json({
        error: data.message || data.error || `Roblox menolak upload (HTTP ${roblox.status}).`
      });
    }
    const operationId = String(data.path || "").split("/").filter(Boolean).pop();
    if (!operationId) return res.status(502).json({ error: "Roblox tidak memberikan ID proses." });
    res.json({ ok: true, operationId });
  } catch (error) {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Ukuran file maksimal 20 MB." });
    }
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan server saat upload." });
  }
});

app.get("/api/operation/:id", configured, authorized, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return res.status(400).json({ error: "ID proses tidak valid." });
    const result = await fetch(`https://apis.roblox.com/assets/v1/operations/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": apiKey }
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok) return res.status(502).json({ error: data.message || "Gagal memeriksa status upload." });
    const assetPath = data.response && data.response.path;
    const assetId = assetPath ? assetPath.split("/").filter(Boolean).pop() : null;
    res.json({
      done: Boolean(data.done),
      assetId: assetId || null,
      message: data.error && data.error.message ? data.error.message : null
    });
  } catch (error) {
    console.error("Status error:", error.message);
    res.status(500).json({ error: "Gagal memeriksa status upload." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`ApipStudio berjalan pada port ${PORT}`));
