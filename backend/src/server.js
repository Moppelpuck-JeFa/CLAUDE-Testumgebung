import express from 'express';
import cors from 'cors';
import './db.js';
import { requireAuth } from './auth.js';
import { router as authRouter } from './routes/auth.js';
import { router as standorteRouter } from './routes/standorte.js';
import { router as voelkerRouter } from './routes/voelker.js';
import { router as durchsichtenRouter } from './routes/durchsichten.js';
import { router as arzneimittelRouter } from './routes/arzneimittel.js';
import { router as behandlungenRouter } from './routes/behandlungen.js';
import { router as erntenRouter } from './routes/ernten.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);

app.use('/api/standorte', requireAuth, standorteRouter);
app.use('/api/voelker', requireAuth, voelkerRouter);
app.use('/api/durchsichten', requireAuth, durchsichtenRouter);
app.use('/api/arzneimittel', requireAuth, arzneimittelRouter);
app.use('/api/behandlungen', requireAuth, behandlungenRouter);
app.use('/api/ernten', requireAuth, erntenRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

app.listen(PORT, () => {
  console.log(`Imkerei-Backend läuft auf http://localhost:${PORT}`);
});
