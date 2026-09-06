# Forces Academy Computerized Testing Software — Environment, Backup & Recovery Manual

## 1. Environment Variables Specification

The platform strictly separates client-accessible public credentials from server-only operational secrets.

### 1.1. Frontend Client Environment (`.env` / `.env.local`)
These variables are bundled by Vite into client code. **Only public, RLS-protected values belong here:**

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | YES | `https://xyzcompany.supabase.co` (or `http://localhost:54321`) | Supabase project API Gateway URL. |
| `VITE_SUPABASE_ANON_KEY` | YES | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public anonymous JWT key (governed by PostgreSQL RLS). |
| `VITE_APP_TITLE` | NO | `Forces Academy CBT System` | Institutional browser tab title. |

### 1.2. Server-Only Operational Environment (Secrets)
These keys **MUST NEVER** be placed in `.env.local` or committed to source control:

| Variable Name | Required | Operational Role |
| :--- | :---: | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER ONLY | Bypasses PostgreSQL Row Level Security. Strictly restricted to administrative backend scripts or trusted Edge Functions. |
| `POSTGRES_PASSWORD` | SERVER ONLY | Master database password for direct PostgreSQL pool connection. |
| `DATABASE_URL` | SERVER ONLY | Direct connection string for migrations (`postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres`). |

---

## 2. Local Environment Setup & Migration Promotion

### 2.1. Local Container Initialization
```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Start local container stack (PostgreSQL, PostgREST, Auth, Storage)
npx supabase start

# 3. Apply all migrations and execute seed.sql
npx supabase db reset

# 4. View Studio UI
# Access http://localhost:54323
```

### 2.2. Remote Migration Promotion Workflow
```bash
# 1. Link to Supabase project
npx supabase link --project-ref <project-id>

# 2. Push pending migrations to staging/production
npx supabase db push

# 3. Regenerate TypeScript types
npx supabase gen types typescript --linked > src/types/database.types.ts
```

---

## 3. Disaster Recovery & Backup Protocol

### 3.1. Database Backups
1. **Automated Managed Backups:**
   - Production projects on Supabase Pro benefit from daily automated physical backups and 7-day Point-in-Time Recovery (PITR) WAL archiving.
2. **Logical Database Dumps (`pg_dump`):**
   - Scheduled nightly export run via automated GitHub Action or maintenance cron:
   ```bash
   pg_dump --clean --if-exists --no-owner --no-privileges \
     --format=custom \
     --file=forces_academy_backup_$(date +%Y%m%d_%H%M%S).dump \
     "$DATABASE_URL"
   ```

### 3.2. Storage Asset Backups
- Media stored in buckets (`question-media`, `profile-images`, `academy-assets`) is synchronized to cold S3/Blob storage mirrors weekly using `aws s3 sync` or Supabase CLI object mirroring.

### 3.3. Restoration Procedure (Runbook)
In the event of database corruption or hardware failure:
1. **Provision Clean Database:** Initialize a new Supabase project or reset local database:
   ```bash
   npx supabase db reset
   ```
2. **Restore Custom Dump:**
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges \
     --dbname="$NEW_DATABASE_URL" \
     forces_academy_backup_YYYYMMDD_HHMMSS.dump
   ```
3. **Verify Integrity:** Run the verification test suite in `supabase/tests/01_security_validation.sql` to confirm RLS policies and table constraints are active.
