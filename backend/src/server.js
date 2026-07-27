import express from 'express';
import cors from 'cors';
import './db.js';
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

app.use('/api/standorte', standorteRouter);
app.use('/api/voelker', voelkerRouter);
app.use('/api/durchsichten', durchsichtenRouter);
app.use('/api/arzneimittel', arzneimittelRouter);
app.use('/api/behandlungen', behandlungenRouter);
app.use('/api/ernten', erntenRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

app.listen(PORT, () => {
  console.log(`Imkerei-Backend läuft auf http://localhost:${PORT}`);
});
