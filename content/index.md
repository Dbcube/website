---
seo:
  title: Dbcube - Lightweight Query Builder for Node.js
  description: A lightweight, type-safe query builder for multiple databases. Build queries with a fluent API across MySQL, PostgreSQL, SQLite, and MongoDB.
---

::u-page-hero
#title
Dbcube Query Builder

#description
A lightweight, type-safe query builder for Node.js with a fluent API for building queries across MySQL, PostgreSQL, SQLite, and MongoDB.

Write once, run anywhere. Same API across all database engines.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons-github
  size: xl
  to: https://github.com/Dbcube/query-builder
  variant: outline
  ---
  Star on GitHub
  :::
::

::u-page-section
---
id: features
---

#title
Why Choose Dbcube?

#description
A modern approach to database management with powerful features that boost productivity.

#features
  :::u-page-feature
  ---
  icon: i-lucide-database
  to: /guides/query-builder/database
  ---
  #title
  Multi-Database Support

  #description
  Works seamlessly with MySQL, PostgreSQL, SQLite, and MongoDB. Same API across all engines with native capabilities.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code
  to: /guides/query-builder/select-queries
  ---
  #title
  Fluent Query Builder

  #description
  Build complex queries with an intuitive chainable API. Type-safe with full TypeScript support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-text
  to: /guides/schemas/overview
  ---
  #title
  Schema Definition with .cube Files

  #description
  Define database schemas, seeders, and triggers using declarative .cube files with a clean syntax.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-terminal
  to: /cli/overview
  ---
  #title
  Powerful CLI

  #description
  Manage databases, tables, seeders, and triggers from the command line. Fast table migrations and refreshes.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-zap
  to: /guides/schemas/triggers
  ---
  #title
  Database Triggers

  #description
  Before/After hooks for Add, Update, and Delete operations. Full control over data lifecycle.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  Computed Fields

  #description
  Define virtual columns calculated on-the-fly based on other field values with typescript functions.
  :::
::

::u-page-section
---
id: code-example
---

#title
Clean, Intuitive API

#description
Write elegant database queries with a fluent, chainable interface.

#default
::cube-code-group
---
files:
  - filename: "Query Builder"
    language: "typescript"
    code: |
      import Database from '@dbcube/query-builder';

      const db = new Database('myapp');

      // Complex queries made simple
      const premiumUsers = await db.table('users')
        .select(['id', 'name', 'email', 'total_orders'])
        .join('orders', 'users.id', '=', 'orders.user_id')
        .whereGroup(query => {
          query.where('subscription', '=', 'premium')
            .orWhere('total_orders', '>', 100)
        })
        .where('status', '=', 'active')
        .orderBy('total_orders', 'DESC')
        .limit(50)
        .get();
  - filename: "CRUD Operations"
    language: "typescript"
    code: |
      // Insert data
      await db.table('users').insert([
        { name: 'John Doe', email: 'john@example.com' }
      ]);

      // Update with conditions
      await db.table('users')
        .where('id', '=', 1)
        .update({ status: 'verified' });

      // Delete safely
      await db.table('users')
        .where('status', '=', 'deleted')
        .where('created_at', '<', '2023-01-01')
        .delete();
  - filename: "Aggregations"
    language: "typescript"
    code: |
      // Count users
      const total = await db.table('users').count().first();

      // Group by and aggregate
      const stats = await db.table('orders')
        .select(['user_id', 'country'])
        .sum('amount')
        .where('status', '=', 'completed')
        .groupBy('country')
        .orderBy('sum', 'DESC')
        .get();
  - filename: "Advanced Features"
    language: "typescript"
    code: |
      // Enable computed fields
      const db = await new Database('myapp').useComputes();

      // Users with computed full_name field
      const users = await db.table('users')
        .select(['id', 'full_name']) // computed from first + last
        .get();

      // Enable triggers for business logic
      await db.useTriggers();

      // Triggers execute automatically on operations
      await db.table('orders').insert([
        { user_id: 1, amount: 99.99 }
      ]);
      // beforeAdd and afterAdd triggers execute
---
::
::

::u-page-section
---
id: cube-files
---

#title
Declarative Schema Definitions

#description
Define your database structure with readable `.cube` files instead of complex migrations.

#default
::cube-code-group
---
files:
  - filename: "users.table.cube"
    language: "cube"
    code: |
      @database("myapp");

      @meta({
        name: "users";
        description: "User accounts and authentication";
      });

      @columns({
        id: {
          type: "int";
          options: ["primary", "autoincrement"];
        };
        email: {
          type: "varchar";
          length: "255";
          options: ["not null", "unique"];
        };
        password: {
          type: "varchar";
          length: "255";
          options: ["not null"];
        };
        full_name: {
          type: "string";
          value: @compute(() => {
            return @column(first_name) + " " + @column(last_name);
          });
        };
        created_at: {
          type: "timestamp";
          options: ["default current_timestamp"];
        };
      });
  - filename: "users.seeder.cube"
    language: "cube"
    code: |
      @database("myapp");
      @table("users");

      @fields("email", "password", "first_name", "last_name");

      @dataset(
        ("admin@example.com", "hashed_pw_1", "Admin", "User"),
        ("john@example.com", "hashed_pw_2", "John", "Doe"),
        ("jane@example.com", "hashed_pw_3", "Jane", "Smith")
      );
  - filename: "users.trigger.cube"
    language: "cube"
    code: |
      @database("myapp");
      @table("users");

      @beforeAdd({
        name: "validate_email";
        description: "Ensure email is valid before insert";
        function: ({db, newData}) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(newData.email)) {
            throw new Error('Invalid email format');
          }
        };
      });

      @afterAdd({
        name: "send_welcome_email";
        description: "Send welcome email to new users";
        function: async ({db, newData}) => {
          console.log(`Welcome email sent to ${newData.email}`);
          // Your email logic here
        };
      });
  - filename: "CLI Commands"
    language: "bash"
    code: |
      # Create database
      dbcube run database:create

      # Create all tables from .cube files
      dbcube run table:fresh

      # Update table structures (safe)
      dbcube run table:refresh

      # Load seed data
      dbcube run seeder:add

      # Install triggers
      dbcube run trigger:fresh

      # Download database engines
      dbcube run download query-engine
---
::

::callout{type="info"}
**VS Code Extension Available**: Get syntax highlighting, IntelliSense, and validation for `.cube` files by installing the [Cube Language Support](https://marketplace.visualstudio.com/items?itemName=Dbcube.cube-lang) extension.
::
::

::u-page-section
---
id: comparison
---

#title
Dbcube vs Traditional ORMs

#description
See how Dbcube compares to other popular solutions.

#default
| Feature | Dbcube | Sequelize | Prisma | TypeORM |
|---------|--------|-----------|--------|---------|
| Multi-database support | ✓ MySQL, PostgreSQL, SQLite, MongoDB | ✓ MySQL, PostgreSQL, SQLite | ✓ MySQL, PostgreSQL, SQLite | ✓ MySQL, PostgreSQL, SQLite |
| Fluent query builder | ✓ | ✓ | ✗ (uses custom syntax) | ✓ |
| TypeScript support | ✓ Native | ✓ Via @types | ✓ Native | ✓ Native |
| Declarative schemas | ✓ .cube files | ✗ Code-based | ✓ Prisma schema | ✗ Decorators |
| Built-in triggers | ✓ | ✗ | ✗ | ✗ |
| Computed fields | ✓ | ✗ | ✗ | ✗ |
| CLI tools | ✓ Powerful | ✓ Basic | ✓ Powerful | ✓ Basic |
| Learning curve | Low | Medium | Medium | High |
| Bundle size | ~50KB | ~1.2MB | Client-only | ~800KB |
| Performance | High (Rust engine) | Medium | High | Medium |

::callout{type="success"}
**Unique to Dbcube**: `.cube` file format, database triggers, computed fields, and unified API across SQL and NoSQL databases.
::
::

::u-page-section
---
id: use-cases
---

#title
Perfect For

#features
  :::u-page-feature
  ---
  icon: i-lucide-rocket
  ---
  #title
  Rapid Prototyping

  #description
  Get your database up and running in minutes. Define schemas with `.cube` files, run migrations, and seed data with simple CLI commands.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-building
  ---
  #title
  Enterprise Applications

  #description
  Scale confidently with multi-database support, triggers for business logic, and type-safe queries. Perfect for microservices architectures.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-git-branch
  ---
  #title
  Team Collaboration

  #description
  Version control your schemas with readable `.cube` files. Easy code reviews and conflict resolution. No more SQL migration hell.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  API Development

  #description
  Build REST or GraphQL APIs faster with intuitive query methods, automatic validation, and triggers for data transformation.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Data Validation

  #description
  Use triggers to validate data before it hits the database. Implement complex business rules without compromising performance.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-workflow
  ---
  #title
  Migration from Legacy Systems

  #description
  Gradually migrate from existing databases. Dbcube works alongside your current setup without requiring a full rewrite.
  :::
::

::u-page-section
---
id: getting-started-cta
---

#title
Ready to Get Started?

#description
Install Dbcube and build your first query in under 5 minutes.

#default
:::code-group
```bash [npm]
npm install @dbcube/query-builder
```

```bash [yarn]
yarn add @dbcube/query-builder
```

```bash [pnpm]
pnpm add @dbcube/query-builder
```
:::

::card-grid
  ::card
  ---
  icon: i-lucide-book-open
  to: /getting-started/installation
  ---
  #title
  Read the Docs

  #description
  Complete guides and API reference
  ::

  ::card
  ---
  icon: i-lucide-github
  to: https://github.com/Dbcube/query-builder
  target: _blank
  ---
  #title
  View on GitHub

  #description
  Star us and contribute
  ::

  ::card
  ---
  icon: i-lucide-message-circle
  to: https://github.com/Dbcube/query-builder/discussions
  target: _blank
  ---
  #title
  Join Community

  #description
  Ask questions and share ideas
  ::
::
::
