import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl);

// Default meeting categories to seed for all users
const DEFAULT_MEETING_CATEGORIES = [
  { name: '1:1', color: '#3b82f6', description: 'One-on-one meetings', sortOrder: 0 },
  { name: 'Team Meeting', color: '#10b981', description: 'Team syncs and standups', sortOrder: 1 },
  { name: 'Client Call', color: '#f59e0b', description: 'External client meetings', sortOrder: 2 },
  { name: 'Interview', color: '#8b5cf6', description: 'Hiring interviews', sortOrder: 3 },
  { name: 'Training', color: '#ec4899', description: 'Learning and training sessions', sortOrder: 4 },
  { name: 'Ad-hoc', color: '#6b7280', description: 'Unscheduled discussions', sortOrder: 5 },
];

async function seedMeetingCategories() {
  console.log('Seeding default meeting categories...');

  try {
    // Get all users who don't have any meeting categories yet
    const usersWithoutCategories = await sql`
      SELECT p.id as user_id
      FROM profiles p
      LEFT JOIN meeting_categories mc ON mc.user_id = p.id
      WHERE mc.id IS NULL
    `;

    console.log(`Found ${usersWithoutCategories.length} users without meeting categories`);

    for (const user of usersWithoutCategories) {
      console.log(`Seeding categories for user ${user.user_id}`);

      for (const category of DEFAULT_MEETING_CATEGORIES) {
        await sql`
          INSERT INTO meeting_categories (user_id, name, color, description, is_default, sort_order)
          VALUES (${user.user_id}, ${category.name}, ${category.color}, ${category.description}, true, ${category.sortOrder})
          ON CONFLICT (user_id, name) DO NOTHING
        `;
      }
    }

    // Also seed for demo user if they exist
    const demoUser = await sql`
      SELECT id FROM profiles WHERE email = 'joel@pe-se.com' LIMIT 1
    `;

    if (demoUser.length > 0) {
      console.log('Ensuring demo user has default categories...');
      for (const category of DEFAULT_MEETING_CATEGORIES) {
        await sql`
          INSERT INTO meeting_categories (user_id, name, color, description, is_default, sort_order)
          VALUES (${demoUser[0].id}, ${category.name}, ${category.color}, ${category.description}, true, ${category.sortOrder})
          ON CONFLICT (user_id, name) DO NOTHING
        `;
      }
    }

    console.log('\n✅ Default meeting categories seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedMeetingCategories();
