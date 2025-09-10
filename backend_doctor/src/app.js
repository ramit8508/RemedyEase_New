import express from 'express';
import cookierParser from 'cookie-parser';
import cors from 'cors';

const app = express();
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
))
app.use(express.json({limit: '50mb'}));

export { app };