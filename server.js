// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const {
  ensureScheduleExists,
  readJSON
} = require('./schedule/scheduler');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Define schedule path here
const schedulePath = path.join(__dirname, 'data/schedule.json');

app.use(express.json());
app.use(cors());

// Root endpoint
app.get('/', (req, res) => {
  res.send('✅ Schedule server is running. Visit /schedule to see the current schedule.');
});

// ✅ Serve current schedule
app.get('/schedule', async (req, res) => {
  try {
    const data = await fs.promises.readFile(schedulePath, 'utf-8');
    res.send(data);
  } catch (err) {
    console.error('Schedule error:', err.message);
    res.status(500).json({ error: 'Could not load schedule.' });
  }
});

// ✅ Update a name for a specific date
app.post('/update-schedule', async (req, res) => {
  try {
    const { date, name } = req.body;
    if (!date || !name) {
      return res.status(400).json({ error: 'Missing date or name' });
    }

    const schedule = await readJSON(schedulePath);
    schedule[date] = name;

    await fs.promises.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
    res.json({ success: true, updated: { date, name } });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// ✅ Manual route to regenerate schedule
app.post('/generate-schedule', async (req, res) => {
  try {
    await ensureScheduleExists(true); // force regeneration
    res.json({ success: true, message: 'Schedule regenerated' });
  } catch (err) {
    console.error('Generation error:', err.message);
    res.status(500).json({ error: 'Failed to regenerate schedule' });
  }
});

// ✅ OneSignal push notification support
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

// ✅ Start the server and conditionally generate schedule
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await ensureScheduleExists(false); // only generates schedule if it doesn't exist
});
