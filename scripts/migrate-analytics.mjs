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

async function migrate() {
  console.log('Starting migration...');

  try {
    // Create detected_projects table
    await sql`
      CREATE TABLE IF NOT EXISTS "detected_projects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "normalized_name" text NOT NULL,
        "color" text DEFAULT '#6366f1',
        "power_goal_id" uuid,
        "total_minutes" integer DEFAULT 0,
        "event_count" integer DEFAULT 0,
        "is_archived" boolean DEFAULT false,
        "merged_into_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;
    console.log('✓ Created detected_projects table');

    // Create meeting_categories table
    await sql`
      CREATE TABLE IF NOT EXISTS "meeting_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "color" text DEFAULT '#ec4899',
        "description" text,
        "is_default" boolean DEFAULT false,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;
    console.log('✓ Created meeting_categories table');

    // Create time_block_meeting_details table
    await sql`
      CREATE TABLE IF NOT EXISTS "time_block_meeting_details" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "time_block_id" uuid NOT NULL,
        "meeting_category_id" uuid,
        "attendee_count" integer,
        "is_recurring" boolean DEFAULT false,
        "is_external" boolean DEFAULT false,
        "organizer" text,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "time_block_meeting_details_time_block_id_unique" UNIQUE("time_block_id")
      )
    `;
    console.log('✓ Created time_block_meeting_details table');

    // Add columns to time_blocks (using raw query for IF NOT EXISTS syntax)
    const columns = [
      { name: 'activity_type', type: 'text' },
      { name: 'detected_project_id', type: 'uuid' },
      { name: 'ai_classification_confidence', type: 'numeric(3, 2)' },
      { name: 'ai_classified_at', type: 'timestamp' },
    ];

    for (const col of columns) {
      try {
        await sql.unsafe(`ALTER TABLE "time_blocks" ADD COLUMN "${col.name}" ${col.type}`);
        console.log(`✓ Added column time_blocks.${col.name}`);
      } catch (e) {
        if (e.code === '42701') {
          console.log(`✓ Column time_blocks.${col.name} already exists`);
        } else {
          throw e;
        }
      }
    }

    // Add foreign keys
    try {
      await sql`
        ALTER TABLE "detected_projects"
        ADD CONSTRAINT "detected_projects_user_id_profiles_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade
      `;
      console.log('✓ Added FK detected_projects.user_id -> profiles.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK detected_projects.user_id already exists');
      else throw e;
    }

    try {
      await sql`
        ALTER TABLE "detected_projects"
        ADD CONSTRAINT "detected_projects_power_goal_id_power_goals_id_fk"
        FOREIGN KEY ("power_goal_id") REFERENCES "power_goals"("id") ON DELETE set null
      `;
      console.log('✓ Added FK detected_projects.power_goal_id -> power_goals.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK detected_projects.power_goal_id already exists');
      else throw e;
    }

    try {
      await sql`
        ALTER TABLE "meeting_categories"
        ADD CONSTRAINT "meeting_categories_user_id_profiles_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade
      `;
      console.log('✓ Added FK meeting_categories.user_id -> profiles.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK meeting_categories.user_id already exists');
      else throw e;
    }

    try {
      await sql`
        ALTER TABLE "time_block_meeting_details"
        ADD CONSTRAINT "time_block_meeting_details_time_block_id_time_blocks_id_fk"
        FOREIGN KEY ("time_block_id") REFERENCES "time_blocks"("id") ON DELETE cascade
      `;
      console.log('✓ Added FK time_block_meeting_details.time_block_id -> time_blocks.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK time_block_meeting_details.time_block_id already exists');
      else throw e;
    }

    try {
      await sql`
        ALTER TABLE "time_block_meeting_details"
        ADD CONSTRAINT "time_block_meeting_details_meeting_category_id_meeting_categories_id_fk"
        FOREIGN KEY ("meeting_category_id") REFERENCES "meeting_categories"("id") ON DELETE set null
      `;
      console.log('✓ Added FK time_block_meeting_details.meeting_category_id -> meeting_categories.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK time_block_meeting_details.meeting_category_id already exists');
      else throw e;
    }

    try {
      await sql`
        ALTER TABLE "time_blocks"
        ADD CONSTRAINT "time_blocks_detected_project_id_detected_projects_id_fk"
        FOREIGN KEY ("detected_project_id") REFERENCES "detected_projects"("id") ON DELETE set null
      `;
      console.log('✓ Added FK time_blocks.detected_project_id -> detected_projects.id');
    } catch (e) {
      if (e.code === '42710') console.log('✓ FK time_blocks.detected_project_id already exists');
      else throw e;
    }

    // Add indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS "detected_projects_user_idx" ON "detected_projects" ("user_id")`;
      console.log('✓ Created index detected_projects_user_idx');
    } catch (e) {
      console.log('✓ Index detected_projects_user_idx already exists');
    }

    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS "detected_projects_normalized_name_idx" ON "detected_projects" ("user_id", "normalized_name")`;
      console.log('✓ Created index detected_projects_normalized_name_idx');
    } catch (e) {
      console.log('✓ Index detected_projects_normalized_name_idx already exists');
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS "meeting_categories_user_idx" ON "meeting_categories" ("user_id")`;
      console.log('✓ Created index meeting_categories_user_idx');
    } catch (e) {
      console.log('✓ Index meeting_categories_user_idx already exists');
    }

    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS "meeting_categories_user_name_idx" ON "meeting_categories" ("user_id", "name")`;
      console.log('✓ Created index meeting_categories_user_name_idx');
    } catch (e) {
      console.log('✓ Index meeting_categories_user_name_idx already exists');
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS "time_blocks_activity_type_idx" ON "time_blocks" ("user_id", "activity_type")`;
      console.log('✓ Created index time_blocks_activity_type_idx');
    } catch (e) {
      console.log('✓ Index time_blocks_activity_type_idx already exists');
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS "time_blocks_detected_project_idx" ON "time_blocks" ("detected_project_id")`;
      console.log('✓ Created index time_blocks_detected_project_idx');
    } catch (e) {
      console.log('✓ Index time_blocks_detected_project_idx already exists');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
