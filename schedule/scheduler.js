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
// Main function
function getSchedule() {
  let schedule = {};

  // Load existing if it exists
  if (fs.existsSync(SCHEDULE_FILE)) {
    const raw = fs.readFileSync(SCHEDULE_FILE, 'utf-8');
    schedule = JSON.parse(raw);
  }

  const today = todayStr();

  // If today not in schedule, generate new 7-day schedule starting from today
  if (!schedule[today]) {
    schedule = generateSchedule();
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
  }

  return schedule;
}

async function resetSchedule() {
    await fs.writeJson(SCHEDULE_PATH, {}, { spaces: 2 });
}

async function forceRegenerate() {
    await resetSchedule();
    return await getSchedule();
}

async function getFullSchedule() {
    return await fs.readJson(SCHEDULE_PATH);
}

module.exports = {
    getSchedule,
    resetSchedule,
    forceRegenerate,
    getFullSchedule
};

