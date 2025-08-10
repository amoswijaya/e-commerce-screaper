import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

export function applySecurity(app) {
  app.use(helmet());
  app.use(cors({ origin: process.env.ORIGIN || '*' }));
  app.use(morgan('dev'));
}
