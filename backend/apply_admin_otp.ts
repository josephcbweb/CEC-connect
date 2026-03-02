import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Running raw SQL...');
  await prisma.\(\
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
    CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);
    CREATE INDEX IF NOT EXISTS idx_users_otp_expiry ON users(otp_expiry);
  \);
  console.log('Successfully executed raw SQL.');
}
main().catch(console.error).finally(() => prisma.\());

