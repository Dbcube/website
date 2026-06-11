# 📐 Diagramas para el sitio de DBCube

> Cada diagrama tiene: **ID**, **ubicación exacta** (archivo + marcador), **propósito**, y el **código Mermaid** como referencia para reproducirlo en tu sistema de diagramas.
>
> En las páginas nuevas dejé marcadores HTML del tipo `<!-- DIAGRAM: id -->` — busca el ID y reemplaza el comentario por la imagen.
>
> **Convención de archivos sugerida:** exportar a `my-docs/public/diagrams/<id>.svg` y embeber con:
> ```md
> ![Texto alternativo](/diagrams/<id>.svg)
> ```
>
> **Paleta sugerida** (coherente con el sitio): fondo transparente, azul `#3B82F6` para capas JS/TS, naranja `#F97316` para Rust, verde `#22C55E` para bases de datos, gris `#64748B` para flechas/texto secundario.

---

## 1. `ecosystem-hero` — Diagrama hero del ecosistema

- **Ubicación:** `content/index.md`, dentro de la sección `#features` (id `features`), idealmente arriba del grid de features o como imagen del hero.
- **Propósito:** que en 5 segundos se entienda qué es DBCube: una capa unificada entre tu app y 4 bases de datos, potenciada por Rust.
- **Estilo:** horizontal, limpio, pocos elementos, logos de las 4 DBs si es posible.

```mermaid
flowchart LR
    APP["🟦 Tu aplicación\nNode.js / TypeScript"] --> DBCUBE["⬛ DBCUBE\nORM · Query Builder · Schemas .cube"]
    DBCUBE --> ENGINES["🦀 Engines Rust\nalto rendimiento"]
    ENGINES --> MYSQL[("MySQL")]
    ENGINES --> PG[("PostgreSQL")]
    ENGINES --> SQLITE[("SQLite")]
    ENGINES --> MONGO[("MongoDB")]
```

---

## 2. `architecture-overview` — Arquitectura por capas

- **Ubicación:** `content/1.getting-started/4.architecture.md` → marcador `<!-- DIAGRAM: architecture-overview -->` (justo después de la introducción, antes de "## The Layers").
- **Propósito:** mostrar las 4 capas completas con todos los paquetes y su responsabilidad.
- **Estilo:** vertical (de arriba: app → abajo: bases de datos), agrupando por capa con contenedores.

```mermaid
flowchart TB
    subgraph L1["Capa 1 · Aplicación"]
        APP["Tu código"]
    end

    subgraph L2["Capa 2 · Builders (TypeScript)"]
        ORM["dbcube\n(ORM)"]
        QB["@dbcube/query-builder\nDML fluido"]
        SB["@dbcube/schema-builder\nprocesa .cube"]
        CLI["@dbcube/cli\ncomandos"]
        CORE["@dbcube/core\nengines · config · processors"]
    end

    subgraph L3["Capa 3 · Engines (Rust, binarios nativos)"]
        QE["query-engine"]
        SE["schema-engine"]
        SQE["sqlite-engine"]
    end

    subgraph L4["Capa 4 · Bases de datos"]
        MY[("MySQL")]
        PG[("PostgreSQL")]
        SL[("SQLite")]
        MG[("MongoDB")]
    end

    APP --> ORM
    APP --> QB
    ORM --> QB
    CLI --> SB
    QB --> CORE
    SB --> CORE
    CORE -->|"spawn + JSON\nPROCESS_RESPONSE"| QE
    CORE --> SE
    CORE --> SQE
    QE --> MY & PG & SL & MG
    SE --> MY & PG & SL & MG
```

---

## 3. `query-flow` — Flujo de una consulta

- **Ubicación:** `content/1.getting-started/4.architecture.md` → marcador `<!-- DIAGRAM: query-flow -->` (sección "## How a Query Flows").
- **Propósito:** secuencia paso a paso de `db.table('users').where(...).get()`.
- **Estilo:** diagrama de secuencia.

```mermaid
sequenceDiagram
    participant App as Tu código
    participant QB as Query Builder
    participant Core as @dbcube/core
    participant QE as query-engine (Rust)
    participant DB as Base de datos

    App->>QB: db.table('users').where('age','>',25).get()
    QB->>QB: arma plan DML JSON<br/>+ dependencias de computed fields
    QB->>Core: engine.run('query_engine', dml)
    Core->>QE: spawn proceso con args de conexión
    QE->>DB: query nativa del dialecto
    DB-->>QE: filas
    QE-->>Core: PROCESS_RESPONSE:{status:200, data:[...]}
    Core-->>QB: respuesta parseada
    QB->>QB: aplica computed fields<br/>y limpia columnas auxiliares
    QB-->>App: objetos JavaScript
```

---

## 4. `schema-flow` — Flujo de una migración de schema

- **Ubicación:** `content/1.getting-started/4.architecture.md` → marcador `<!-- DIAGRAM: schema-flow -->` (sección "## How a Schema Migration Flows").
- **Propósito:** qué pasa al ejecutar `dbcube run table:fresh`.
- **Estilo:** flujo vertical con decisión de validación.

```mermaid
flowchart TB
    A["dbcube run table:fresh"] --> B["Escanear dbcube/ por *.table.cube"]
    B --> C["CubeValidator\nsintaxis · tipos · foreign keys · @database"]
    C -->|inválido| ERR["❌ Error con archivo y línea exacta\n(tabla y dependientes se omiten)"]
    C -->|válido| D["DependencyResolver\nordena por foreign keys"]
    D --> E["schema-engine: parse_table"]
    E --> F["schema-engine: generate\nSQL del dialecto"]
    F --> G["schema-engine: execute"]
    G --> H["Guardar CREATE en config.db\n(dbcube_schemas_config)"]
    H --> I["✅ Resumen: procesadas · éxitos · errores"]
```

---

## 5. `package-dependencies` — Mapa de paquetes

- **Ubicación:** `content/1.getting-started/4.architecture.md` → marcador `<!-- DIAGRAM: package-dependencies -->` (sección "## Package Map"; puede reemplazar al árbol ASCII).
- **Propósito:** dependencias reales entre paquetes npm y binarios.

```mermaid
flowchart LR
    DBCUBE["dbcube\n(ORM)"] --> QB["@dbcube/query-builder"]
    DBCUBE --> CORE["@dbcube/core"]
    QB --> CORE
    SB["@dbcube/schema-builder"] --> CORE
    CLI["@dbcube/cli"] --> SB
    CLI --> CORE
    CORE --> QE["🦀 query-engine"]
    CORE --> SE["🦀 schema-engine"]
    CORE --> SQE["🦀 sqlite-engine"]
```

---

## 6. `computed-fields-flow` — Cómo se resuelve un computed field

- **Ubicación:** `content/2.guides/query-builder/8.computed-fields.md` → marcador `<!-- DIAGRAM: computed-fields-flow -->` (tras la introducción).
- **Propósito:** visualizar la magia: pides `full_name`, DBCube trae `name` + `last_name`, ejecuta tu función y te devuelve solo lo pedido.

```mermaid
flowchart LR
    A["select(['id','full_name'])"] --> B["Detecta computed field\nfull_name"]
    B --> C["Extrae dependencias\n@column(name), @column(last_name)"]
    C --> D["Query real:\nSELECT id, name, last_name"]
    D --> E[("Base de datos")]
    E --> F["Por cada fila:\nejecuta @compute(...)"]
    F --> G["Elimina columnas auxiliares"]
    G --> H["Resultado:\n{ id, full_name }"]
```

---

## 7. `trigger-lifecycle` — Ciclo de vida de los triggers

- **Ubicación:** `content/2.guides/query-builder/9.runtime-triggers.md` → marcador `<!-- DIAGRAM: trigger-lifecycle -->` (tras la introducción).
- **Propósito:** mostrar el sandwich before → operación → after, con las rutas de error (throw en before = no se escribe; fallo en DB = discard).

```mermaid
flowchart TB
    A["insert() / update() / delete()"] --> B{"¿before hook\nregistrado?"}
    B -->|sí| C["Ejecutar beforeX\n(interceptor)"]
    C -->|throw| X["❌ Operación cancelada\nnada llega a la DB"]
    C -->|ok| D["Ejecutar operación en DB"]
    B -->|no| D
    D -->|falla| Y["interceptor.discard()\n❌ error con contexto de código"]
    D -->|éxito| E["interceptor.commit()"]
    E --> F{"¿after hook\nregistrado?"}
    F -->|sí| G["Ejecutar afterX\n+ log en dbcube/logs/triggers/"]
    F -->|no| H["✅ Resultado"]
    G --> H
```

---

## 8. `migration-strategies` — Las 3 estrategias de migración

- **Ubicación:** `content/2.guides/schemas/7.alter-tables.md` → marcador `<!-- DIAGRAM: migration-strategies -->` (tras la introducción, complementa la tabla "When to Use Which").
- **Propósito:** árbol de decisión: ¿qué comando uso?

```mermaid
flowchart TB
    A{"¿Qué necesitas\ncambiar?"} --> B{"¿Importa conservar\nlos datos?"}
    B -->|no| FRESH["table:fresh\n🔄 recrea todo desde .table.cube"]
    B -->|sí| C{"¿Es un cambio aditivo\n(columnas/tablas nuevas)?"}
    C -->|sí| REFRESH["table:refresh\n➕ diff automático, sin drops"]
    C -->|"no: renombrar,\ncambiar tipo, eliminar"| ALTER["table:alter\n🔧 directivas explícitas .alter.cube"]

    style FRESH fill:#FECACA
    style REFRESH fill:#BBF7D0
    style ALTER fill:#BFDBFE
```

---

## 9. `cube-file-types` — Los 4 tipos de archivo .cube

- **Ubicación:** `content/2.guides/schemas/1.overview.md`, al inicio de la sección "## Types of .cube Files" (no dejé marcador; insertarlo justo bajo ese título).
- **Propósito:** mapa mental de los 4 tipos y qué comando CLI consume cada uno.

```mermaid
flowchart LR
    subgraph FILES["Archivos .cube"]
        T["📋 *.table.cube\nestructura de tablas"]
        AL["🔧 *.alter.cube\nmigraciones"]
        S["🌱 *.seeder.cube\ndatos iniciales"]
        TR["⚡ *.trigger.cube\nlógica de negocio"]
    end

    T -->|"table:fresh\ntable:refresh"| DB[("Base de datos")]
    AL -->|"table:alter"| DB
    S -->|"seeder:add"| DB
    TR -->|"trigger:fresh"| RT["Runtime\nuseTriggers()"]
    RT --> DB
```

---

## 10. `config-db-state` — Estado local (.dbcube/config.db)

- **Ubicación:** `content/1.getting-started/4.architecture.md`, sección "## Local State: the `config.db`" (no dejé marcador; insertarlo bajo el título, antes de la tabla).
- **Propósito:** aclarar qué se guarda localmente y qué comando alimenta cada tabla.

```mermaid
flowchart LR
    FRESH["table:fresh / refresh"] -->|"CREATE aplicado"| SCHEMAS["dbcube_schemas_config"]
    CUBE["columnas @compute\nen .table.cube"] --> COMPUTES["dbcube_computes_config"]
    TRIG["trigger:fresh"] --> TRIGGERS["dbcube_triggers_config"]

    subgraph CONFIGDB["📦 .dbcube/config.db (SQLite local · va en .gitignore)"]
        SCHEMAS
        COMPUTES
        TRIGGERS
    end

    SCHEMAS -->|"base para diffs\nde table:refresh"| OUT1["ALTER automáticos"]
    COMPUTES -->|"useComputes()"| OUT2["campos virtuales"]
    TRIGGERS -->|"useTriggers()"| OUT3["hooks runtime"]
```

---

## Resumen de inserción

| # | ID | Archivo destino | Marcador existente |
|---|----|-----------------|--------------------|
| 1 | `ecosystem-hero` | `content/index.md` | No (insertar en hero/features) |
| 2 | `architecture-overview` | `content/1.getting-started/4.architecture.md` | ✅ `<!-- DIAGRAM: architecture-overview -->` |
| 3 | `query-flow` | `content/1.getting-started/4.architecture.md` | ✅ `<!-- DIAGRAM: query-flow -->` |
| 4 | `schema-flow` | `content/1.getting-started/4.architecture.md` | ✅ `<!-- DIAGRAM: schema-flow -->` |
| 5 | `package-dependencies` | `content/1.getting-started/4.architecture.md` | ✅ `<!-- DIAGRAM: package-dependencies -->` |
| 6 | `computed-fields-flow` | `content/2.guides/query-builder/8.computed-fields.md` | ✅ `<!-- DIAGRAM: computed-fields-flow -->` |
| 7 | `trigger-lifecycle` | `content/2.guides/query-builder/9.runtime-triggers.md` | ✅ `<!-- DIAGRAM: trigger-lifecycle -->` |
| 8 | `migration-strategies` | `content/2.guides/schemas/7.alter-tables.md` | ✅ `<!-- DIAGRAM: migration-strategies -->` |
| 9 | `cube-file-types` | `content/2.guides/schemas/1.overview.md` | No (insertar bajo "Types of .cube Files") |
| 10 | `config-db-state` | `content/1.getting-started/4.architecture.md` | No (insertar bajo "Local State") |

Cuando tengas un diagrama exportado, avísame y lo integro en la página con el componente de imagen del sitio.
