const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: [
    'https://dev-flow-red-rho.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down bhai' }
});
app.use(limiter);

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhooks');
const repoRoutes = require('./routes/repos');
const issueRoutes = require('./routes/issues');
const analyticsRoutes = require('./routes/analytics');
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DevFlow server chal raha hai!' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Kuch toh gadbad hai' });
});

app.listen(PORT, () => {
  console.log(`DevFlow server PORT ${PORT} pe chal raha hai`);
});
