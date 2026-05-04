import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config({ path: '.env' });

const SQL_FILES = [
  '01_schema.sql',
  '02_rls.sql',
  '03_storage.sql',
  '04_realtime.sql',
];

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set your DATABASE_URL in .env file');
    console.log('Example: DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    for (const sqlFile of SQL_FILES) {
      const filePath = join(__dirname, '..', 'supabase', sqlFile);
      console.log(`\n📄 Executing ${sqlFile}...`);

      try {
        const sql = readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${sqlFile} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing ${sqlFile}:`, error);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

migrate();
