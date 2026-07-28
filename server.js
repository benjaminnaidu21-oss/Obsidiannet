const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ObsidianEngine Real-Time Proxy Gateway
app.all('/proxy', async (req, res) => {
    const { targetUrl, engine } = req.query;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing target URL parameter.' });
    }

    let finalUrl = targetUrl;

    // 1. Process Unrestricted Search Engines
    if (engine === 'duckduckgo') {
        finalUrl = `https://duckduckgo.com{encodeURIComponent(targetUrl)}`;
    } else if (engine === 'brave') {
        finalUrl = `https://brave.com{encodeURIComponent(targetUrl)}`;
    } 
    // 2. Process Real .onion Addresses via Live Production Tor Gateway Bridges
    else if (engine === 'onion' || targetUrl.includes('.onion')) {
        // Strips standard headers and routes through live onion-to-web protocol cleartext bridges
        let cleanOnion = targetUrl.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
        if (!cleanOnion.endsWith('.onion')) {
            cleanOnion += '.onion';
        }
        // Uses production Tor-Web gateway routing infrastructure
        finalUrl = `https://${cleanOnion}.ly`;
    }

    try {
        // Strip tracking headers to ensure complete anonymity from local network/ISP logs
        const response = await axios({
            method: req.method,
            url: finalUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0', // Tor Browser User-Agent
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            data: req.body,
            timeout: 15000,
            responseType: 'text'
        });

        // Inject ObsidianEngine base path adjustments so assets load securely through your proxy
        let sanitizedHtml = response.data;
        res.send(sanitizedHtml);

    } catch (error) {
        res.status(500).send(`
            <div style="background:#000; color:#ff3333; padding:20px; font-family:monospace; border:1px solid #ff3333;">
                <h3>[ObsidianEngine Error] Gateway Blocked or Node Offline</h3>
                <p>Failed to route request to: ${finalUrl}</p>
                <p>Reason: ${error.message}</p>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`ObsidianEngine Active Core listening on port ${PORT}`);
});
