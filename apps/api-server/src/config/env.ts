import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ksheeraam_db'),
  JWT_SECRET: z.string().default('ksheeraam_super_secure_jwt_secret_dev_key_2026!'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('ksheeraam_super_secure_refresh_secret_dev_key_2026!'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  WHATSAPP_VERIFY_TOKEN: z.string().default('ksheeraam_wa_verify_token_secure_2026'),
  WHATSAPP_API_TOKEN: z.string().default('mock_meta_cloud_api_token'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default('10892049812903'),
  WEBHOOK_SECRET: z.string().default('ksheeraam_webhook_secret_hmac_sha256'),
  ORDER_CUTOFF_TIME: z.string().default('20:00'), // 8:00 PM IST
  MIN_WALLET_BALANCE_PAISE: z.string().default('15000').transform((val) => parseInt(val, 10)), // ₹150
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables detected on startup:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
