import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: "supabase",
  },
});