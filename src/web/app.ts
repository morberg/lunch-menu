import express from 'express';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';
import menusRouter from './routes/menus';
import { menuService } from '../services/menu-service';
import { SWEDISH_DAYS } from '../utils/swedish-days';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views'), { index: false }));

app.use('/api', menusRouter);

app.get('/api/docs', (req, res) => {
    try {
        // Try dist location first (production), then source location (dev)
        let apiDocPath = path.join(__dirname, '..', 'API.md');
        if (!fs.existsSync(apiDocPath)) {
            apiDocPath = path.join(__dirname, '..', '..', 'API.md');
        }

        const markdown = fs.readFileSync(apiDocPath, 'utf-8');
        const html = marked(markdown);

        const fullPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lunch Menu API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #2c3e50;
            margin-top: 30px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        h3 {
            color: #34495e;
            margin-top: 20px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        pre code {
            background: none;
            padding: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 10px 20px;
            background: #f8f9fa;
            color: #666;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            margin-bottom: 20px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Menus</a>
        ${html}
    </div>
</body>
</html>`;

        res.send(fullPage);
    } catch (error) {
        console.error('Error serving API documentation:', error);
        res.status(500).send('Error loading API documentation');
    }
});

app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, 'views', 'index.html');
        const html = fs.readFileSync(indexPath, 'utf-8');
        const daysScript = `<script>window.SWEDISH_DAYS = ${JSON.stringify(SWEDISH_DAYS)};</script>`;
        res.send(html.replace('</head>', `    ${daysScript}\n</head>`));
    } catch (error) {
        console.error('Error serving index page:', error);
        res.status(500).send('Error loading index page');
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    menuService.stopBackgroundRefresh();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    menuService.stopBackgroundRefresh();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});