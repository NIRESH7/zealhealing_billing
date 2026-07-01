const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let qrData = null;
let clientStatus = 'INITIALIZING'; 

// Helper to find Chrome/Chromium on Linux environments if not specified
const getChromePath = () => {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const commonPaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/opt/google/chrome/chrome'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            console.log(`Auto-detected Chrome/Chromium binary at: ${p}`);
            return p;
        }
    }
    return undefined;
};

const chromePath = getChromePath();

const client = new Client({
    authTimeoutMs: 1200000,
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
            '--disable-blink-features=AutomationControlled'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    clientStatus = 'QR_READY';
    qrData = await qrcode.toDataURL(qr); 
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
    client.initialize().catch(err => console.error('Re-initialization error on disconnect:', err)); 
});

const path = require('path');
const sessionDir = path.join(__dirname, '.wwebjs_auth', 'session');
['SingletonLock', 'SingletonSocket'].forEach(file => {
    const filePath = path.join(sessionDir, file);
    try {
        fs.unlinkSync(filePath);
        console.log(`Removed stale ${file} file to allow initialization.`);
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error(`Failed to remove ${file} file:`, e);
        }
    }
});

console.log('Initializing WhatsApp Client...');
client.initialize().catch(err => {
    console.error('Initial client initialization error:', err);
    clientStatus = 'INIT_ERROR';
});

// Routes
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: clientStatus });
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        console.log('Disconnecting/Logging out WhatsApp client...');
        await client.logout();
        res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
        console.error('Disconnect error, forcing client re-initialization:', error);
        try {
            await client.destroy();
        } catch (destroyErr) {
            console.error('Destroy error:', destroyErr);
        }
        clientStatus = 'DISCONNECTED';
        qrData = null;
        client.initialize().catch(err => console.error('Re-initialization error during disconnect:', err));
        res.json({ success: true, message: 'Disconnected and re-initialized' });
    }
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
        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone; 
        }
        
        // --- SAFE SENDING LOGIC ---
        // 1. Verify if number exists on WhatsApp first (Forces LID retrieval)
        const numberId = await client.getNumberId(cleanPhone);
        
        if (!numberId) {
            return res.status(404).json({ error: 'Number is not registered on WhatsApp' });
        }

        const chatId = numberId._serialized;
        console.log(`Sending message to ${chatId}...`);

        let media = null;
        if (filePath && fs.existsSync(filePath)) {
             try {
                 media = MessageMedia.fromFilePath(filePath);
             } catch(err) {
                 console.error('File Read Error:', err);
             }
        }

        const textMessage = message || "Please find your attached invoice.";

        // 2. Add extra small delay for stability
        await new Promise(r => setTimeout(r, 1500));

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
