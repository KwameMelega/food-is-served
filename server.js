// server.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const ONESIGNAL_APP_ID = '0d5ffd40-4afb-44f2-b5f2-5f916e1bd16c';
const ONESIGNAL_API_KEY = 'imjxipxnneaznwruw6wy6ow5z';

app.post('/send-notification', async (req, res) => {
    try {
        await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            headings: { en: "Button Pressed!" },
            contents: { en: "Someone pressed the button in the Unity app!" },
        }, {
            headers: {
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.send('Notification sent!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to send notification.');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
