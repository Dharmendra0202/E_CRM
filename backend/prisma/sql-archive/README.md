# Archived raw SQL

These `.sql` files were applied **manually** to the Supabase Postgres database
before Prisma Migrate was set up. They used to live in `prisma/migrations/`,
where Prisma tried (and failed) to interpret them as migrations.

They are kept here for historical reference only. **Do not run them again** —
their effects are already present in the live schema and are captured by
`prisma/migrations/00000000000000_baseline/migration.sql`.

## Why the migration history was rebuilt

The previous state was inconsistent:

- `schema.prisma` declared `provider = "postgresql"` (Supabase)
- `migrations/migration_lock.toml` declared `provider = "sqlite"`
- the only Prisma migration (`20260716074613_init`) contained **SQLite** SQL for
  an older, much smaller schema that no longer matched the app
- a leftover `prisma/dev.db` SQLite file was still on disk
- the live Postgres database had no `_prisma_migrations` table at all

As a result every `prisma migrate` command failed with **P3019**
(*datasource provider does not match migration_lock.toml*).

## What was done

1. Moved these raw `.sql` files out of `migrations/` into this archive.
2. Deleted the stale SQLite `20260716074613_init` migration and `dev.db`.
3. Set `migration_lock.toml` to `postgresql`.
4. Generated `00000000000000_baseline` from the current `schema.prisma`
   (`prisma migrate diff --from-empty`), which reproduces all 34 tables.
5. Marked that baseline as already applied (`prisma migrate resolve --applied`),
   since the live database already contained the schema.

Verified afterwards:

- `prisma migrate status` → *Database schema is up to date!*
- `prisma migrate diff` (live DB vs schema) → *No difference detected.*

## Going forward

Use the normal Prisma workflow. Schema changes should be made in
`schema.prisma` and applied with:

```bash
npx prisma migrate dev --name <describe_change>   # development
npx prisma migrate deploy                          # production / CI
```

Do not hand-write SQL into `prisma/migrations/` again.

`enable-rls.sql` (in `prisma/`, not archived) is a separate, intentionally
manual Supabase Row Level Security script.
