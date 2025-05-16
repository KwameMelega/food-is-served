const fs = require('fs-extra');
const path = require('path');

const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'schedule.json');
const NAMES_PATH = path.join(__dirname, '..', 'config', 'dishNames.json');

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getUpcomingDates(days = 7) {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(formatDate(d));
    }
    return dates;
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

async function loadJSON(filePath) {
    if (!(await fs.pathExists(filePath))) {
        throw new Error(`Missing file: ${filePath}`);
    }
    return await fs.readJson(filePath);
}

async function loadScheduleAndNames() {
    const schedule = (await fs.pathExists(SCHEDULE_PATH)) ? await fs.readJson(SCHEDULE_PATH) : {};
    const names = await loadJSON(NAMES_PATH);
    return { schedule, names };
}

async function saveSchedule(schedule) {
    await fs.writeJson(SCHEDULE_PATH, schedule, { spaces: 2 });
}

async function getSchedule() {
    const { schedule, names } = await loadScheduleAndNames();
    const upcomingDates = getUpcomingDates(7);
    const usedNames = new Set(Object.values(schedule));
    const unusedNames = names.filter(name => !usedNames.has(name));
    const availableNames = shuffleArray(unusedNames);
    const newSchedule = { ...schedule };

    for (const date of upcomingDates) {
        if (!newSchedule[date]) {
            const name = availableNames.pop();
            if (!name) break;
            newSchedule[date] = name;
        }
    }

    await saveSchedule(newSchedule);

    const result = {};
    for (const date of upcomingDates) {
        result[date] = newSchedule[date] || null;
    }

    return result;
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

