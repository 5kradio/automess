const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(express.json());

const staticPath = path.join(__dirname, '../static');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// Enable CORS
app.use(cors());

// File path for the messages data
const filePath = path.join(__dirname, 'messages.json');

// Helper function to load messages from the file
function loadMessages() {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(parseErr);
                }
            }
        });
    });
}

// Helper function to save messages to the file
function saveMessages(messages) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify({ messages }, null, 2);
        fs.writeFile(filePath, jsonData, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}



// Get all messages
app.get('/messages', async (req, res) => {
    try {
        const data = await loadMessages();
        res.json(data);
    } catch (err) {
        console.error('Error reading messages:', err);
        res.status(500).json({ error: 'Error reading messages' });
    }
});

// Add a new message
app.post('/messages', async (req, res) => {
    let { message, nickname } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message' });
    }

    // Default nickname to "Untitled" if missing or not a string
    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
        nickname = 'Untitled';
    }

    try {
        const data = await loadMessages();
        const messages = data.messages || [];

        // Ensure no more than 5 messages
        if (messages.length >= 5) {
            console.warn('Warning: message limit');
            messages.shift(); // Remove the oldest message
        }

        // Add new message object
        messages.push({ nickname, message });

        await saveMessages(messages);
        res.json({ messages });
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ error: 'Error adding message' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});