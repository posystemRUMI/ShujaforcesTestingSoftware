# Forces Academy Computerized Testing Software — Backend Architecture & System Blueprint

## 1. Executive Summary & Security Demeanor

The **Forces Academy Computerized Testing Software** backend is engineered as a secure, high-integrity assessment platform deployed on **Supabase** (PostgreSQL 15+, Supabase Auth, Row Level Security, Storage, Realtime, and Database RPC functions).

The architecture adheres to defense-in-depth principles tailored for high-stakes armed forces induction examination environments (Pakistan Army, Pakistan Air Force, and Pakistan Navy):

1. **Deny-by-Default Row Level Security (RLS):** Every exposed database table enforces strict RLS policies. No anonymous or unauthenticated client can read or write data.
2. **Untrusted Client Architecture:** The browser client is strictly non-authoritative for identity roles, permissions, active exam answer keys, time keeping, test publishing, scoring, and retake eligibility.
3. **Information Barrier for Active Exams:** Active candidates must **never** be capable of querying raw question answer keys or explanations during active testing sessions.
4. **Air-Gap Capability:** Designed for local network deployment within institutional CBT laboratories, completely independent of external CDNs or unverified third-party services.
5. **Two-Agent Shared Architecture:**
   - **BACKEND-AGENT-1 (Antigravity):** Platform Foundation, Supabase Auth, Roles & Profiles, Core Entities (Forces, Courses, Subjects), Academic Cadres (Students, Teachers, Batches, Enrollments), Question Bank, Storage Buckets, RLS Policies, Base CRUD RPCs, Audit Logging, and Seed Data.
   - **BACKEND-AGENT-2 (Claude):** Assessment Runtime, Test Blueprints, Question Composition, Delivery Engine, Server-authoritative Timing, Autosave/Submissions, Scoring Engine, Results, Retakes, and Realtime Proctoring.

---

## 2. Platform Infrastructure & Technology Stack

| Layer | Technology | Operational Specification |
| :--- | :--- | :--- |
| **Database Engine** | **PostgreSQL 15+** | Relational data model with UUID primary keys, foreign keys, cascade protections, check constraints, and B-Tree indexes. |
| **Identity Provider** | **Supabase Auth** | Standard JWT authentication, linking authenticated users directly to domain profiles. |
| **Access Control** | **PostgreSQL RLS** | Declarative SQL security policies combined with `SECURITY DEFINER` role lookup helpers. |
| **Compound Transactions** | **PostgreSQL RPC** | Atomic PL/pgSQL stored procedures for multi-table operational tasks (e.g., student enrollment, question authoring). |
| **Object Storage** | **Supabase Storage** | S3-compatible asset management for diagram questions, cadet docket photos, and import files. |
| **Client Adapter** | **@supabase/supabase-js v2** | Typed TypeScript SDK with environment-driven failover to mock adapters during offline/air-gapped local mock runs. |
| **Audit Trail** | **PostgreSQL Audit Log** | Immutable, append-only security and operational event ledger. |

---

## 3. Directory Layout & File Organization

```text
supabase/
├── config.toml                 # Local Supabase CLI configuration
├── migrations/                 # Sequential, immutable SQL migrations
│   ├── 20260906000001_core_schema.sql
│   ├── 20260906000002_rls_policies.sql
│   ├── 20260906000003_storage_setup.sql
│   └── 20260906000004_crud_rpc_audit.sql
├── seed.sql                    # Deterministic development & test seed data
├── functions/                  # Supabase Edge Functions (when required)
└── tests/                      # Database verification scripts & pgTAP tests
```

---

## 4. Identity & Role-Based Access Control (RBAC)

### 4.1. Roles
The application defines three primary institutional roles via the `app_role` enum:
- `ADMIN`: Full administrative control over academy settings, faculty rosters, candidate rosters, courses, batches, question banks, and audit logs.
- `TEACHER`: Faculty officers and invigilators who manage question items, inspect cohort analytics, view assigned batches, and supervise test sessions.
- `STUDENT`: Cadet examinees restricted strictly to their own docket profile, assigned exam batteries, and permitted transcripts.

### 4.2. Secure Role Resolvers
Role resolution avoids trusting browser-supplied JWT claims or mutable metadata alone. Instead, `SECURITY DEFINER` functions query the authoritative `public.profiles` table with fixed `search_path = public`:
- `public.current_app_role() RETURNS app_role`
- `public.is_admin() RETURNS boolean`
- `public.is_teacher() RETURNS boolean`
- `public.is_student() RETURNS boolean`

---

## 5. Storage Subsystem Blueprint

Supabase Storage is partitioned into four distinct buckets:
1. `question-media`: Holds stems and option diagrams (PNG, JPEG, WebP, SVG; max 5MB). Read access granted to authenticated users; write access granted strictly to Admins and Teachers.
2. `profile-images`: Holds cadet and faculty photos (PNG, JPEG, WebP; max 2MB). Users can manage their own avatar; Admins can manage all.
3. `academy-assets`: Official institutional insignia, force crests, and watermarks. Publicly readable; write restricted to Admins.
4. `import-files`: Temporary CSV/Excel candidate roster spreadsheets (max 10MB). Strictly private; accessible only by Admins.

---

## 6. Audit Logging Foundation

Every security-sensitive event (role changes, student creation, batch transfers, question modifications, test releases) is recorded in `public.audit_logs`:
- **Columns:** `id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `ip_address`, `created_at`.
- **Integrity Guarantee:** Table is **append-only**. `UPDATE` and `DELETE` operations are completely revoked from all users including authenticated admins. Only `log_audit_event(...)` can write to the ledger.

---

## 7. Local Development & Operational CLI Commands

### Supabase CLI Operations
```bash
# Start local Supabase Docker containers
npx supabase start

# Stop local Supabase
npx supabase stop

# Check local container status and API URLs
npx supabase status

# Reset database and run all migrations + seed.sql from scratch
npx supabase db reset

# Create a new sequential migration file
npx supabase migration new <migration_name>

# Generate TypeScript types from local database schema
npx supabase gen types typescript --local > src/types/database.types.ts

# Apply pending migrations to remote Supabase project
npx supabase db push
```

---

## 8. Frontend Integration Strategy & Fallback Protocol

To honor the **Frozen Frontend** mandate:
1. All client queries flow through dedicated repository services (`src/services/`) rather than inline JSX calls.
2. If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not configured, the service layer transparently falls back to `mockService` without throwing unhandled exceptions or breaking the UI.
3. Once production Supabase credentials are provided, live Supabase queries activate seamlessly.
