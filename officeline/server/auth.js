"use strict";
/**
 * Minimal, dependency-free auth helpers for the Office Line distributor API.
 * Uses Node's built-in `crypto` module only — no npm install required.
 *
 * Password hashing: scrypt (salted) — same primitive bcrypt/argon2 alternatives
 * rely on; suitable for a small distributor directory.
 *
 * Tokens: a minimal HMAC-signed, base64url JSON token (same shape/spirit as a
 * JWT: header.payload.signature) so sessions survive without server memory.
 * For heavier production needs you can later swap this file for a real
 * `jsonwebtoken` + `bcrypt` setup without touching the rest of the API.
 */
const crypto = require("crypto");

const TOKEN_SECRET = process.env.OL_TOKEN_SECRET || "change-this-secret-before-deploying-to-production";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString("utf8");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(attempt, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(payloadObj) {
  const header = { alg: "HS256", typ: "OL-TOKEN" };
  const payload = { ...payloadObj, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const head64 = base64url(JSON.stringify(header));
  const body64 = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(`${head64}.${body64}`).digest("hex");
  return `${head64}.${body64}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head64, body64, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", TOKEN_SECRET).update(`${head64}.${body64}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(body64));
  } catch (e) {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

module.exports = { hashPassword, verifyPassword, sign, verify };
