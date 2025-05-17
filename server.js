const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
console.log('Current directory:', __dirname);
console.log('Files in ./schedule:', fs.readdirSync(path.join(__dirname, 'schedule')));
const {
  getSchedule,
  resetSchedule,
  forceRegenerate,
  getFullSchedule
} = require('./schedule/scheduler');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('✅ Schedule server is running. Visit /schedule to see the current schedule.');
});

// WEEK'S  CODE SNIPPET
// Serve current schedule
app.get('/schedule', async (req, res) => {
  try {
    const data = await fs.promises.readFile(schedulePath, 'utf-8');
    res.send(data);
  } catch (err) {
    console.error('Schedule error:', err.message);
    res.status(500).json({ error: 'Could not load schedule.' });
  }
});
app.post('/update-schedule', async (req, res) => {
  try {
    const { date, name } = req.body;
    if (!date || !name) return res.status(400).json({ error: 'Missing date or name' });

    const schedule = await readJSON(schedulePath);
    schedule[date] = name;

    await fs.promises.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
    res.json({ success: true, updated: { date, name } });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});
// Manual route to generate a new schedule
app.post('/generate-schedule', async (req, res) => {
  try {
    await ensureScheduleExists(true); // force regen
    res.json({ success: true, message: 'Schedule regenerated' });
  } catch (err) {
    console.error('Generation error:', err.message);
    res.status(500).json({ error: 'Failed to regenerate schedule' });
  }
});

let users = {}; // in-memory or read from file

app.post('/send-notification', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: { en: message || '🍽️ Food is served!' },
      included_segments: ['All']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
      }
    });

    res.status(200).json({ success: true, response: response.data });
  } catch (error) {
    console.error('Notification failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load from file if exists
const dataFile = "users.json";
if (fs.existsSync(dataFile)) {
  users = JSON.parse(fs.readFileSync(dataFile));
}

app.post("/save-name", (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) return res.status(400).send("Missing data");

  users[userId] = username;
  fs.writeFileSync(dataFile, JSON.stringify(users));
  res.send("OK");
});

// For Unity to fetch all names
app.get("/get-names", (req, res) => {
  res.json(users);
});

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await ensureScheduleExists(false); // Only generate schedule if it doesn't already exist
});