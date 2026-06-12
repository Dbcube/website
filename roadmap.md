# 🗺️ Roadmap — Documentación DBCube (my-docs)

> Este archivo se actualiza a medida que avanzan las fases. Marca cada ítem con `[x]` al completarlo y agrega la fecha.
>
> **Última actualización:** 2026-06-10

---

## ✅ Fase 1 — Cobertura completa de características (COMPLETADA 2026-06-10)

Objetivo: que TODO lo que existe en el ecosistema (engines, builders, ORM, CLI, extensiones) esté documentado en el sitio.

- [x] **Arquitectura** — Nueva página `getting-started/architecture`: capas del ecosistema, engines Rust (query-engine, schema-engine, sqlite-engine), protocolo `PROCESS_RESPONSE`, config.db local, mapa de paquetes.
- [x] **ORM (`dbcube`)** — Nueva sección `guides/orm/overview`: instalación, `dbcube.config.js` completo (mysql/postgres/sqlite/mongodb), `init()`, `database()`, singleton, multi-base, compatibilidad Next.js, comparativa ORM vs query-builder.
- [x] **Computed Fields** — Nueva guía `guides/query-builder/computed-fields`: sintaxis `@compute`/`@column`, `useComputes()`, resolución de dependencias, conversión de tipos, ejemplos y buenas prácticas.
- [x] **Runtime Triggers** — Nueva guía `guides/query-builder/runtime-triggers`: ciclo de vida de los 6 hooks, `useTriggers()`, semántica commit/discard, logs, portabilidad entre motores.
- [x] **Alter Tables (`.alter.cube`)** — Nueva guía `guides/schemas/alter-tables`: referencia completa de las 9 directivas (`@changeName`, `@addColumn`, `@deleteColumn`, `@renameColumn`, `@changeType`, `@changeLength`, `@changeDefault`, `@changeOptions`, `@changeEnumValues`), traducción por motor, workflow recomendado.
- [x] **CLI: Seeders y Triggers** — Nueva página `cli/seeders-triggers`: `run seeder:add` (con filtro por nombre), `run trigger:fresh`, logs y troubleshooting.
- [x] **CLI: Binarios** — Nueva página `cli/binaries`: `update`, `run download [engine] [version]`, detección de plataforma, pin de versiones para CI/CD.
- [x] **CLI Overview actualizado** — Agregados `table:alter`, `seeder:add <nombre>`, `download` con versiones, `update`, `database:create:config`, `database:create:physical`.
- [x] **CLI Schema actualizado** — Sección `table:alter` con directivas y comparativa fresh/refresh/alter.
- [x] **Schemas Overview actualizado** — `.alter.cube` agregado como 4° tipo de archivo cube.
- [x] **Extensión Snippets VSCode** — Nueva página `vscode-extension/snippets`: autocompletado inteligente, hover docs, parameter hints, tabla de 18+ snippets, configuración.
- [x] **Extensión Formatter actualizada** — `.alter.cube` en asociaciones de archivos + cross-link a la extensión de snippets.
- [x] **Home (`index.md`) actualizado** — Features nuevos: ORM all-in-one, migraciones declarativas, engines Rust; Computed Fields ahora enlaza a su guía.
- [x] **diagrams.md creado** — 10 diagramas especificados con ubicación exacta y código Mermaid listo para reproducir.

---

## 🔄 Fase 2 — Integración visual (diagramas e imágenes)

Objetivo: insertar los diagramas de `diagrams.md` una vez creados en el sistema de diagramas.

- [ ] Crear los 10 diagramas listados en `diagrams.md` (el usuario los genera en su herramienta de diagramas).
- [ ] Exportarlos a `my-docs/public/diagrams/` (SVG preferido; PNG @2x como alternativa) con los nombres indicados en `diagrams.md`.
- [ ] Reemplazar cada marcador `<!-- DIAGRAM: id -->` por el componente de imagen correspondiente.
- [ ] Agregar diagrama hero en el home (`index.md`) — id `ecosystem-hero`.
- [ ] Verificar modo claro/oscuro: si los SVG no se adaptan, generar variante `-dark`.
- [ ] Capturas de pantalla reales de las extensiones VSCode (resaltado, autocompletado, hover) para `vscode-extension/overview` y `vscode-extension/snippets`.
- [ ] GIF corto del flujo CLI (`table:fresh` con salida de progreso) para `cli/overview`.

## ✅ Fase 2.5 — Documentar la API v2 de la librería (COMPLETADA 2026-06-11)

- [x] **Transacciones + Raw**: página nueva `guides/query-builder/10.transactions-raw.md`; API table de database.md actualizada.
- [x] **Métodos nuevos del builder**: tablas de referencia de `2.table.md`; `paginate()/chunk()/exists()` en data-retrieval; `upsert/increment/decrement/truncate` en data-modification; `whereNotIn` en where-conditions; `offset()/paginate()` en ordering-pagination.
- [x] **Eager loading `with()`**: página nueva `guides/query-builder/11.eager-loading.md`.
- [x] **Daemon mode**: sección "Daemon Mode: Sub-Millisecond Queries" en architecture.md (portfile, transacciones, 0.3ms, `DBCUBE_DAEMON=0`).
- [x] **CLI nuevo**: cli/overview con secciones Project/Migration Commands; cli/schema con confirmación escrita de fresh, refresh no-destructivo, `--dry-run/--all`, migrate:status/rollback.
- [x] **Migraciones**: sección "Migration History, Dry-Run & Rollback" en alter-tables.md.
- [x] **Tipos generados**: página nueva `getting-started/5.typescript-types.md`.
- [x] Tabla comparativa del home actualizada (transacciones, tipos generados, introspección, eager loading, rollback, 0.3ms/query).

> Nota: publicar los paquetes npm + binarios antes de desplegar el sitio para que docs y realidad coincidan.

## 📚 Fase 3 — Profundidad de contenido

Objetivo: pasar de "todo documentado" a "la mejor documentación que existe".

- [ ] **Tutorial end-to-end**: "De cero a API REST con DBCube" (proyecto completo: config → cubes → seeders → triggers → queries → deploy).
- [ ] **Recetario (cookbook)**: autenticación, paginación con cursor, soft deletes con triggers, auditoría, multi-tenant con multi-database.
- [ ] **Página de referencia API completa** del query builder (tabla de todos los métodos con firma exacta, generada desde el código TS).
- [ ] **Guía MongoDB específica**: cómo se traduce la API fluida a operaciones nativas, estructura jerárquica de `columns()`.
- [ ] **Guía de manejo de errores**: códigos 200/500/600, formato `[error]`/`[help]`/`[code]`, troubleshooting por motor.
- [ ] **Guía de testing**: cómo testear con SQLite local + seeders + `table:fresh` en CI.
- [ ] Revisar y corregir la numeración duplicada en `2.guides/query-builder/` (`2.select-queries.md` y `2.table.md` comparten prefijo).
- [ ] Unificar enlaces del sitio: varios apuntan a repos distintos (`Dbcube/query-builder`); decidir repo canónico u organización GitHub.

## 🌐 Fase 4 — Experiencia del sitio

- [ ] Versión en español del sitio (i18n ya está disponible en el stack Nuxt).
- [ ] Playground interactivo de archivos `.cube` (editor con validación en vivo).
- [ ] Búsqueda mejorada con índice completo del contenido nuevo.
- [ ] Página de changelog/releases sincronizada con las versiones de los paquetes npm.
- [ ] SEO: og:images por sección, sitemap, metadescripciones revisadas.
- [ ] Página de comparativa dedicada (vs Prisma/Drizzle/Knex) con benchmarks reproducibles.

## 🚀 Fase 5 — Comunidad y adopción

- [ ] Guía de contribución del ecosistema (cómo compilar los engines Rust, estructura de monorepo).
- [ ] Plantillas de ejemplo descargables (starter Next.js, starter Express, starter CLI-only).
- [ ] Sección FAQ alimentada con preguntas reales de GitHub Discussions.
- [ ] Videos cortos embebidos por guía (opcional).

---

## ✅ Fase 1.5 — Auditoría de veracidad (COMPLETADA 2026-06-10)

Se detectó que páginas antiguas documentaban APIs y comandos **que no existen en el código**. Auditoría completa contra el código fuente real:

- [x] **Query Builder (8 páginas reescritas)** — Se eliminaron 169 referencias a métodos inexistentes: `raw()`, `transaction()`, `chunk()`, `stream()`, `findMany()`, `exists()`, `whereNotIn()`, `offset()`, `upsert()`, `having()`. API real documentada desde `query-builder/src/lib/Database.ts`.
- [x] **Agregaciones corregidas** — `count()/sum()/avg()/max()/min()` se ejecutan directamente y devuelven número; se eliminaron cadenas inválidas tipo `.count().first()` (incluido el home).
- [x] **Configuración corregida (3 páginas + home + CLI overview)** — Todo el sitio usaba `config.addDatabase({host, port…})`, **que no existe**. Formato real: `config.set({ databases: { nombre: { type, config: { HOST, USER, PASSWORD, DATABASE, PORT } } } })` (verificado contra `core/src/lib/Config.ts`, `Engine.ts` y el generador del CLI `ConfigFileUtils.js`).
- [x] **CLI database:create reescrito** — Documentado el flujo interactivo real en 2 fases (config + creación física) con variables `.env` `DBCUBE_<NOMBRE>_*`.
- [x] **Comandos inexistentes eliminados** — `dbcube init`, `dbcube create`, `dbcube run --help`, `run upgrade` (el real es `dbcube update`).
- [x] **Sintaxis .cube corregida** — `foreign: "users.id"` (string, no soportado) → `foreign: { table; column; }`; ejemplo de introducción con `@table()+@columns` → `@meta()+@columns`.
- [x] **`insert()` y `where()`** — `insert({})` → `insert([{}])` (requiere array); `where('col', valor)` de 2 args → forma con operador.
- [x] **Enlaces rotos** — 19 enlaces `/en/...` y `/api/...` corregidos en 6 páginas.
- [x] **Verificado como correcto (sin cambios)** — tipos y opciones de columnas (contra `table_processor.rs`), anotaciones de triggers/seeders (las 6 reales), directivas alter (contra `alter_processor.rs`), sintaxis foreign en relationships.md, propiedad `description` (contra `CubeValidator.ts`).

> Nota: `cli/src/commands/help.js` (código del CLI, no el sitio) todavía muestra el formato `config.addDatabase` — corregirlo en el repo del CLI.

---

### Registro de cambios del roadmap

| Fecha | Cambio |
|-------|--------|
| 2026-06-10 | Roadmap creado. Fase 1 completada: 8 páginas nuevas + 6 actualizadas + diagrams.md. |
| 2026-06-10 | Fase 1.5: auditoría de veracidad contra el código fuente — 8 páginas reescritas, 7 corregidas, 169 métodos falsos eliminados. |
