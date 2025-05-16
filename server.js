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


app.use(cors());

// WEEK'S MENU CODE SNIPPET
app.get('/schedule', async (req, res) => {
    try {
        const schedule = await getSchedule();
        res.json(schedule);
    } catch (err) {
        console.error('Error in /schedule:', err.message);
        res.status(500).send('Internal server error');
    }
});

// GET /admin/reset - Clears the schedule
app.get('/admin/reset', async (req, res) => {
    try {
        await resetSchedule();
        res.send('Schedule reset.');
    } catch (err) {
        console.error('Reset failed:', err.message);
        res.status(500).send('Reset failed.');
    }
});

// GET /admin/force-generate - Resets and generates fresh schedule
app.get('/admin/force-generate', async (req, res) => {
    try {
        const newSchedule = await forceRegenerate();
        res.json(newSchedule);
    } catch (err) {
        console.error('Force generate failed:', err.message);
        res.status(500).send('Force generate failed.');
    }
});

// GET /admin/raw - Returns raw schedule (all dates)
app.get('/admin/raw', async (req, res) => {
    try {
        const full = await getFullSchedule();
        res.json(full);
    } catch (err) {
        console.error('Raw fetch failed:', err.message);
        res.status(500).send('Raw fetch failed.');
    }
});

let users = {}; // in-memory or read from file

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});