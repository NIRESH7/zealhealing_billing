const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let qrData = null;
let clientStatus = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTED

// Define Chrome args for reliability
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-accelerated-2d-canvas', 
            '--no-first-run', 
            '--no-zygote', 
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    clientStatus = 'QR_READY';
    qrData = await qrcode.toDataURL(qr); // generate base64 image
});

client.on('ready', () => {
    console.log('CLIENT READY: CONNECTED');
    clientStatus = 'CONNECTED';
    qrData = null;
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED: SYSTEM CONNECTED');
    clientStatus = 'CONNECTED';
    qrData = null;
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    clientStatus = 'DISCONNECTED';
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    clientStatus = 'DISCONNECTED';
    client.initialize(); // Reboot client automatically
});

console.log('Initializing WhatsApp Client...');
client.initialize();

// Routes
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: clientStatus });
});

app.get('/api/whatsapp/qr', (req, res) => {
    if (clientStatus === 'CONNECTED') {
        return res.json({ error: 'Already connected', status: clientStatus });
    }
    if (!qrData) {
        return res.json({ error: 'QR not ready yet', status: clientStatus });
    }
    res.json({ qr: qrData, status: clientStatus });
});

app.post('/api/whatsapp/send', async (req, res) => {
    const { phone, filePath, message } = req.body;
    
    if (clientStatus !== 'CONNECTED') {
        return res.status(400).json({ error: 'WhatsApp is not connected' });
    }

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        // Format phone number
        // Clean all non-digits. Ensure India +91 defaults if passed as 10 digits
        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone; 
        }
        
        const chatId = cleanPhone + '@c.us';

        let media = null;
        // Verify file absolute path access
        if (filePath && fs.existsSync(filePath)) {
             try {
                 media = MessageMedia.fromFilePath(filePath);
             } catch(err) {
                 console.error('File Read Error:', err);
             }
        } else if (filePath) {
             console.log("File requested but not found at:", filePath);
        }

        const textMessage = message || "Please find your attached invoice.";

        if (media) {
             await client.sendMessage(chatId, media, { caption: textMessage });
        } else {
             await client.sendMessage(chatId, textMessage);
        }

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Microservice running on port ${PORT}`);
});
