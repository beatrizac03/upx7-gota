import express from 'express';
import cors from 'cors';
import { ambiente } from './config/ambiente.js';
import { criarRotas } from './rotas/index.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratadorErros.js';

export function criarApp({ servicos }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: ambiente.corsOrigem }));
  app.use(express.json({ limit: '256kb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const inicio = performance.now();
      res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${(performance.now() - inicio).toFixed(1)}ms`);
      });
      next();
    });
  }

  app.use('/api', criarRotas(servicos));
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
