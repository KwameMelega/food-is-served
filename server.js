const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // ✅ Enable CORS for all origins
app.use(bodyParser.json());

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
