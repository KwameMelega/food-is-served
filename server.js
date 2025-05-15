const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs'); 
require('dotenv').config();

const app = express();
let users = {}; // in-memory or read from file

// ✅ Use CORS with explicit origin
const allowedOrigins = ['https://food-client-7yql.onrender.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
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