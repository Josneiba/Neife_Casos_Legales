# Supabase Database Migration

This document explains how to migrate the database schema, RLS policies, storage buckets, and realtime configuration to your Supabase database.

## Setup

### 1. Get your Supabase Database URL

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 2. Create a `.env` file

Create a `.env` file in the root of your project (not to be committed to git):

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**Important**: Do not commit the `.env` file to git. It should be in your `.gitignore`.

### 3. Run the migration

Execute the migration script:

```bash
pnpm supabase:migrate
```

This will execute the SQL files in order:
1. `01_schema.sql` - Creates tables, triggers, and functions
2. `02_rls.sql` - Sets up Row Level Security policies
3. `03_storage.sql` - Creates storage buckets and policies
4. `04_realtime.sql` - Configures realtime for messages table

## What gets migrated?

### Schema (01_schema.sql)
- `profiles` table
- `lawyer_profiles` table
- `lawyer_experience` table
- `cases` table
- `case_requests` table
- `case_activities` table
- `case_notes` table
- `next_steps` table
- `documents` table
- `conversations` table
- `messages` table
- `reviews` table
- `client_case_posts` table
- `lawyer_proposals` table
- Triggers for auto-updating timestamps
- Trigger for handling new user creation
- Trigger for updating lawyer ratings

### RLS Policies (02_rls.sql)
- Row Level Security enabled on all tables
- Policies for profile access
- Policies for case management
- Policies for document access
- Policies for messaging
- Policies for reviews
- And more...

### Storage (03_storage.sql)
- `documents` bucket (private)
- `avatars` bucket (public)
- Storage policies for upload and access

### Realtime (04_realtime.sql)
- Enables realtime for the `messages` table

## Troubleshooting

### Error: DATABASE_URL not set
Make sure you created a `.env` file with the `DATABASE_URL` variable set.

### Error: Connection refused
Verify that:
- Your DATABASE_URL is correct
- Your Supabase project is active
- Your password is correct
- You have network access to Supabase

### Error: Relation already exists
If you've already run the migration, you may need to drop the existing tables first or modify the SQL files to use `IF NOT EXISTS` clauses.

## Running migrations in production

For production deployments, you can:
1. Run the migration locally before deploying
2. Add the migration script to your CI/CD pipeline
3. Use Supabase's built-in migration tools if you have the Supabase CLI installed
