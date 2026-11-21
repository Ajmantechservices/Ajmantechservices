import dotenv from 'dotenv';
import { seedAdminUser, DEFAULT_ADMIN_EMAIL } from '../src/lib/adminSeeder';

// Load environment variables
dotenv.config();

async function runSeed() {
  console.log('====================================================');
  console.log('⚡ AjmanTech Services - Admin Account Seeder Script');
  console.log('====================================================');

  const cliKey = process.argv[2];
  const cliPassword = process.argv[3];
  const serviceRoleKey = cliKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const adminPassword = cliPassword || process.env.ADMIN_SEED_PASSWORD;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  console.log(`Target Email:    ${DEFAULT_ADMIN_EMAIL}`);
  console.log(`Supabase URL:    ${supabaseUrl || '(Not set)'}`);
  console.log(`Service Key:     ${serviceRoleKey ? 'Configured (' + serviceRoleKey.slice(0, 10) + '...)' : 'MISSING'}`);
  console.log('----------------------------------------------------');

  if (!serviceRoleKey) {
    console.error('❌ ERROR: Supabase Service Role Key is required!');
    console.log('\nYou can provide it either:');
    console.log('1. As arguments:');
    console.log('   npx tsx scripts/seed-admin.ts <YOUR_SUPABASE_SERVICE_ROLE_KEY> <ADMIN_PASSWORD>');
    console.log('2. In your environment:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY="your-key" ADMIN_SEED_PASSWORD="your-password" npm run seed:admin');
    console.log('3. Via the Admin Portal UI on /admin/login');
    process.exit(1);
  }

  if (!adminPassword || adminPassword.length < 6) {
    console.error('❌ ERROR: Admin password (min 6 chars) is required via ADMIN_SEED_PASSWORD or 2nd CLI arg!');
    process.exit(1);
  }

  console.log('🚀 Executing admin seeding / update on Supabase Auth...');
  const result = await seedAdminUser({
    supabaseUrl,
    serviceRoleKey,
    email: DEFAULT_ADMIN_EMAIL,
    password: adminPassword,
    fullName: 'Joshua Ajayi',
  });

  if (result.success) {
    console.log('✅ SUCCESS:');
    console.log(`- ${result.message}`);
    console.log(`- User ID: ${result.userId}`);
    console.log(`- Action: ${result.action}`);
    console.log(`\nYou can now log in at /admin/login with ${DEFAULT_ADMIN_EMAIL}.`);
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('❌ SEEDING FAILED:');
    console.error(`- ${result.message}`);
    if (result.error) console.error(`- Error Code: ${result.error}`);
    process.exit(1);
  }
}

runSeed();
