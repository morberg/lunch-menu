import { app } from './app';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const shutdown = (signal: string): void => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));