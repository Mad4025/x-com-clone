require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { execSync } = require('child_process');

try {
    console.log('Running Prisma migrations...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    execSync('npx prisma migrate dev', { stdio: 'inherit', env: { ...process.env } });
    console.log('Migrations completed.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}