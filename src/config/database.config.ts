import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'andaeiii',
  pass: process.env.DB_PASS || 'password123',
  name: process.env.DB_NAME || 'nksst_api',
  url:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'andaeiii'}:${process.env.DB_PASS || 'password123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'nksst_api'}?schema=public`,
}));
