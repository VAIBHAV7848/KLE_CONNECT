const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Load from environment variables
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

if (!APP_ID || !APP_CERTIFICATE) {
    console.error("Error: APP_ID and APP_CERTIFICATE must be set in .env file");
}

app.post('/token', (req, res) => {
    const { channel, uid } = req.body;

    if (!channel) {
        return res.status(400).json({ error: 'channel is required' });
    }

    // Use the provided UID or request 0 for Agora to assign one (but we prefer explicit)
    // If uid is 0 or null, we can default to 0.
    let uidVal = uid;
    if (uidVal === undefined || uidVal === null) {
        uidVal = 0;
    }

    // RtcRole.PUBLISHER = 1, SUBSCRIBER = 2
    const role = RtcRole.PUBLISHER;

    // Token expiration time in seconds (e.g., 1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channel,
            uidVal,
            role,
            privilegeExpiredTs
        );

        console.log(`Token generated for channel: ${channel}, uid: ${uidVal}`);
        res.json({ token, uid: uidVal });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

app.get('/', (req, res) => {
    res.send('Agora Token Server is running');
});

app.listen(PORT, () => {
    console.log(`Token server running on port ${PORT}`);
});
