const fs = require('fs-extra');
const path = require('path');

const SCHEDULE_FILE = path.join(__dirname, '../data/schedule.json');
const NAMES_FILE = path.join(__dirname, '../config/names.json');

// Utility to load names
function loadNames() {
  if (!fs.existsSync(NAMES_FILE)) {
    throw new Error('Names config file missing at ' + NAMES_FILE);
  }

  const raw = fs.readFileSync(NAMES_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Utility to read any JSON file
function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// Get today as YYYY-MM-DD
function todayStr(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

// Generate a new 7-day schedule
function generateSchedule() {
  const names = loadNames();
  if (names.length < 7) throw new Error('Need at least 7 names!');

  const shuffled = names.sort(() => Math.random() - 0.5);
  const schedule = {};

  for (let i = 0; i < 7; i++) {
    schedule[todayStr(i)] = shuffled[i];
  }

  return schedule;
}

// Ensure schedule.json exists, and optionally regenerate it
async function ensureScheduleExists(force = false) {
  const dir = path.dirname(SCHEDULE_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(SCHEDULE_FILE) || force) {
    const schedule = generateSchedule();
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
  }
}

module.exports = {
  ensureScheduleExists,
  readJSON
};
