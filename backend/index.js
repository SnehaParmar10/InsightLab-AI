import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


app.use('/api', apiRoutes)

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
}

export default app;




