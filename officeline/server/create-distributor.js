#!/usr/bin/env node
"use strict";
/**
 * Create or update a distributor account.
 *
 * Usage:
 *   node create-distributor.js <username> <password> ["Company name"]
 *
 * Example:
 *   node create-distributor.js papeterie_alger "S3cur3-Pass!" "Papeterie El Djazair"
 */
const fs = require("fs");
const path = require("path");
const { hashPassword } = require("./auth");

const DB_PATH = path.join(__dirname, "distributors.json");

function loadDb() {
  if (!fs.existsSync(DB_PATH)) return { distributors: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

const [, , username, password, company] = process.argv;

if (!username || !password) {
  console.error("Usage: node create-distributor.js <username> <password> [\"Company name\"]");
  process.exit(1);
}

const db = loadDb();
const existing = db.distributors.find((d) => d.username === username);
const passwordHash = hashPassword(password);

if (existing) {
  existing.passwordHash = passwordHash;
  if (company) existing.company = company;
  console.log(`Updated password for existing distributor "${username}".`);
} else {
  db.distributors.push({
    username,
    passwordHash,
    company: company || username,
    createdAt: new Date().toISOString()
  });
  console.log(`Created distributor "${username}".`);
}

saveDb(db);
