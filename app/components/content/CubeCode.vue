<script setup lang="ts">
const props = withDefaults(defineProps<{
  filename?: string;
  code?: string;
}>(), {
  filename: '',
  code: ''
});

const copied = ref(false);

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const highlightCube = (code: string) => {
  if (!code) return '';

  // Escapar HTML primero para contenido del usuario
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Proteger strings temporalmente
  const strings: string[] = [];
  highlighted = highlighted.replace(
    /&quot;([^&quot;]*)&quot;/g,
    (match, content) => {
      strings.push(content);
      return `###STRING_${strings.length - 1}###`;
    }
  );

  // 2. Resaltar annotations (@database, @table, @columns, etc.)
  highlighted = highlighted.replace(
    /@(database|table|meta|columns|fields|dataset|beforeAdd|afterAdd|beforeUpdate|afterUpdate|beforeDelete|afterDelete|compute|column)\b/g,
    '<span class="annotation">@$1</span>'
  );

  // 3. Resaltar propiedades (type, length, options)
  highlighted = highlighted.replace(
    /\b(name|description|type|length|options|value|defaultValue|function|foreign|enumValues)(\s*)(?=:)/g,
    '<span class="property">$1</span>$2'
  );

  // 4. Resaltar nombres de columnas (id, name, email antes de ":")
  highlighted = highlighted.replace(
    /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*)(?=:)/gm,
    '$1<span class="column">$2</span>$3'
  );

  // 5. Resaltar números
  highlighted = highlighted.replace(
    /\b(\d+)\b/g,
    '<span class="number">$1</span>'
  );

  // 6. Restaurar strings con resaltado específico
  highlighted = highlighted.replace(
    /###STRING_(\d+)###/g,
    (match, index) => {
      const content = strings[parseInt(index)];

      // Tipos de datos
      if (/^(varchar|int|string|text|boolean|date|datetime|timestamp|decimal|float|double)$/.test(content)) {
        return `<span class="string type">&quot;${content}&quot;</span>`;
      }
      // Constraints
      if (/^(primary|autoincrement|not null|null|unique|index)$/.test(content)) {
        return `<span class="string constraint">&quot;${content}&quot;</span>`;
      }
      // Strings normales
      return `<span class="string">&quot;${content}&quot;</span>`;
    }
  );

  return highlighted;
};

const processedCode = computed(() => highlightCube(props.code));

const copyCode = () => {
  copy(props.code);
};
</script>

<template>
  <div class="cube-code-wrapper">
    <div class="cube-header">
      <div v-if="filename" class="cube-filename">
        {{ filename }}
      </div>
      <button
        class="cube-copy-btn"
        @click="copyCode"
        :class="{ copied: copied }"
      >
        <UIcon v-if="!copied" name="i-lucide-copy" />
        <UIcon v-else name="i-lucide-check" />
      </button>
    </div>
    <pre class="cube-code"><code v-html="processedCode"></code></pre>
  </div>
</template>

<style scoped>
.cube-code-wrapper {
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.cube-header {
  background: #2d2d2d;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cube-filename {
  color: #51fbde;
  font-size: 0.75rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.cube-copy-btn {
  background: transparent;
  border: none;
  color: #51fbde;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cube-copy-btn:hover {
  background: rgba(81, 251, 222, 0.1);
  color: #51fbde;
}

.cube-copy-btn.copied {
  color: #51fbde;
}

.cube-code {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.25rem;
  margin: 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.cube-code code {
  display: block;
}

/* Annotations - purple/magenta */
:deep(.annotation) {
  color: #c586c0;
  font-weight: 600;
}

/* Column names - cyan */
:deep(.column) {
  color: #9cdcfe;
  font-weight: 500;
}

/* Properties - light blue */
:deep(.property) {
  color: #9cdcfe;
}

/* Strings - orange */
:deep(.string) {
  color: #ce9178;
}

/* Types dentro de strings - teal */
:deep(.string.type) {
  color: #4ec9b0;
}

/* Constraints dentro de strings - purple */
:deep(.string.constraint) {
  color: #c586c0;
}

/* Numbers - light green */
:deep(.number) {
  color: #b5cea8;
}

/* Light mode */
html:not(.dark) .cube-code-wrapper {
  border: 1px solid #e5e7eb;
}

html:not(.dark) .cube-header {
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

html:not(.dark) .cube-filename {
  color: #51fbde;
}

html:not(.dark) .cube-copy-btn {
  color: #51fbde;
}

html:not(.dark) .cube-copy-btn:hover {
  background: rgba(81, 251, 222, 0.1);
  color: #51fbde;
}

html:not(.dark) .cube-copy-btn.copied {
  color: #51fbde;
}

html:not(.dark) .cube-code {
  background: #f5f5f5;
  color: #24292e;
}

html:not(.dark) :deep(.annotation) {
  color: #af00db;
  font-weight: 700;
}

html:not(.dark) :deep(.column) {
  color: #001080;
  font-weight: 600;
}

html:not(.dark) :deep(.property) {
  color: #001080;
}

html:not(.dark) :deep(.string) {
  color: #a31515;
}

html:not(.dark) :deep(.string.type) {
  color: #267f99;
}

html:not(.dark) :deep(.string.constraint) {
  color: #af00db;
}

html:not(.dark) :deep(.number) {
  color: #098658;
}
</style>
