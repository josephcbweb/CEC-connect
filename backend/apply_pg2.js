const { Client } = require("pg");

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        console.log("Running direct SQL migration...");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;");
        await client.query("CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);");
        await client.query("CREATE INDEX IF NOT EXISTS idx_users_otp_expiry ON users(otp_expiry);");
        console.log("Migration successfully applied directly via PG driver.");
    } catch(err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
