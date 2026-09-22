---
name: database
description: Design or modify the PostgreSQL database, including schema, migrations, relations, constraints and indexes.
---

# Database

Before changing the database:

1. Inspect the existing schema and migrations.
2. Understand how the affected data is used.
3. Reuse existing database conventions.

When making changes:

- Use PostgreSQL-compatible features.
- Always create migrations for schema changes.
- Use appropriate primary and foreign keys.
- Add constraints when they protect data integrity.
- Add indexes only when justified by access patterns.
- Avoid unnecessary duplicated or derived data.
- Consider deletion and cascade behavior explicitly.
- Preserve existing data when modifying schemas.

After changes:

1. Run the migration.
2. Run relevant tests.
3. Verify affected queries.
4. Report schema changes and important design decisions.

Never modify the database manually without representing the change in migrations.
