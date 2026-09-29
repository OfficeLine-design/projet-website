#!/usr/bin/env node
"use strict";
/**
 * Office Line — Distributor API server.
 *
 * Zero external dependencies: runs with plain `node server.js`, no
 * `npm install` required. Provides real authentication (scrypt password
 * hashing + signed session tokens) for the distributor area, and gated
 * access to catalog PDF downloads.
 *
 * ── Quick start ──────────────────────────────────────────────────────────
 *   1. Create your first distributor account:
 *        node create-distributor.js my_distributor "MyPassw0rd!" "Ma Société"
 *   2. Set a real secret (important before going live):
 *        export OL_TOKEN_SECRET="a-long-random-string"
 *   3. Start the server:
 *        node server.js
 *      (listens on port 4000 by default — set PORT to change it)
 *   4. In static/js/form.js, set API_BASE_URL to wherever this server is
 *      reachable (e.g. https://api.officeline-dz.com), then rebuild the
 *      front-end site with `python3 build.py`.
 *   5. Drop your real catalog PDFs into server/catalogs/ named
 *      "bureautique.pdf" and "equipements.pdf".
 *
 * For real production use behind a domain, put this behind Nginx/Caddy
 * with HTTPS, and consider moving distributors.json to a proper database
 * once you have more than a handful of accounts.
 * ────────────────────────────────────────────────────────────────────── */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { verifyPassword, sign, verify } = require("./auth");

const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "distributors.json");
const CATALOGS_DIR = path.join(__dirname, "catalogs");
const ALLOWED_ORIGIN = process.env.OL_ALLOWED_ORIGIN || "*"; // tighten to your domain in production

function loadDistributors() {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8")).distributors || [];
  } catch (e) {
    console.error("Could not read distributors.json:", e.message);
    return [];
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB safety cap
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/* Very small in-memory rate limiter for the login route (per IP). */
const loginAttempts = new Map(); // ip -> { count, resetAt }
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ip = req.socket.remoteAddress || "unknown";

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  // ---- POST /api/login ----
  if (req.method === "POST" && url.pathname === "/api/login") {
    if (isRateLimited(ip)) {
      return sendJson(res, 429, { error: "Trop de tentatives, réessayez dans quelques minutes." });
    }
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (e) {
      return sendJson(res, 400, { error: "Corps de requête invalide." });
    }
    const { username, password } = body || {};
    if (!username || !password) {
      return sendJson(res, 400, { error: "Identifiant et mot de passe requis." });
    }
    const distributors = loadDistributors();
    const account = distributors.find((d) => d.username === username);
    if (!account || !verifyPassword(password, account.passwordHash)) {
      return sendJson(res, 401, { error: "Identifiant ou mot de passe incorrect." });
    }
    const token = sign({ sub: account.username });
    return sendJson(res, 200, {
      token,
      distributor: { username: account.username, company: account.company || account.username }
    });
  }

  // ---- GET /api/me ----
  if (req.method === "GET" && url.pathname === "/api/me") {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const payload = verify(token);
    if (!payload) return sendJson(res, 401, { error: "Session invalide ou expirée." });
    return sendJson(res, 200, { username: payload.sub });
  }

  // ---- GET /api/catalog-download?family=bureautique&token=... ----
  if (req.method === "GET" && url.pathname === "/api/catalog-download") {
    const token = url.searchParams.get("token");
    const payload = verify(token);
    if (!payload) return sendJson(res, 401, { error: "Session invalide ou expirée. Merci de vous reconnecter." });

    const family = (url.searchParams.get("family") || "").replace(/[^a-z0-9_-]/gi, "");
    const filePath = path.join(CATALOGS_DIR, `${family}.pdf`);
    if (!family || !fs.existsSync(filePath)) {
      return sendJson(res, 404, {
        error: `Catalogue "${family}" introuvable. Déposez le PDF dans server/catalogs/${family}.pdf.`
      });
    }
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="office-line-${family}.pdf"`,
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  // ---- Health check ----
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  sendJson(res, 404, { error: "Not found." });
});

server.listen(PORT, () => {
  console.log(`Office Line distributor API listening on http://localhost:${PORT}`);
  if (loadDistributors().length === 0) {
    console.log('No distributor accounts yet — create one with:');
    console.log('  node create-distributor.js <username> <password> "Company name"');
  }
});
