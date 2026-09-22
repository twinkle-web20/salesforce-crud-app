import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import oauthRoutes from './routes/oauth.js';
import sfRoutes from './routes/salesforce.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use('/oauth', oauthRoutes);
app.use('/api', sfRoutes);

app.get('/', (req, res) => res.send('✅ Backend running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server: http://localhost:${PORT}`));