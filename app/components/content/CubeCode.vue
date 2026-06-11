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

  // Escapar HTML primero
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Proteger contenido temporal
  const protectedContent: { [key: string]: string } = {};
  let protectIndex = 0;

  const protect = (content: string): string => {
    const placeholder = `###PROTECTED_${protectIndex++}###`;
    protectedContent[placeholder] = content;
    return placeholder;
  };

  const restore = (text: string): string => {
    return text.replace(/###PROTECTED_(\d+)###/g, (match) => {
      return protectedContent[match] || match;
    });
  };

  // 1. Proteger y resaltar comentarios primero
  highlighted = highlighted.replace(
    /\/\/(.*)$/gm,
    (match, content) => protect(`<span class="comment">//${content}</span>`)
  );

  // 2. Proteger y resaltar strings (comillas dobles, simples y template literals)
  highlighted = highlighted.replace(
    /`([^`]*(?:\\.[^`]*)*)`/g,
    (match, content) => protect(`<span class="string template">\`${content}\`</span>`)
  );

  highlighted = highlighted.replace(
    /&quot;([^&quot;\\]*(?:\\.[^&quot;\\]*)*)&quot;/g,
    (match, content) => {
      // Tipos de datos
      if (/^(varchar|int|string|text|boolean|date|datetime|timestamp|decimal|float|double)$/.test(content)) {
        return protect(`<span class="string type">&quot;${content}&quot;</span>`);
      }
      // Constraints
      if (/^(primary|autoincrement|not null|null|unique|index)$/.test(content)) {
        return protect(`<span class="string constraint">&quot;${content}&quot;</span>`);
      }
      // Strings normales
      return protect(`<span class="string">&quot;${content}&quot;</span>`);
    }
  );

  highlighted = highlighted.replace(
    /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (match, content) => protect(`<span class="string">'${content}'</span>`)
  );

  // 3. Resaltar annotations (@database, @table, etc.) - PROTEGER
  highlighted = highlighted.replace(
    /@(database|table|meta|columns|fields|dataset|beforeAdd|afterAdd|beforeUpdate|afterUpdate|beforeDelete|afterDelete|compute|column)\b/g,
    (match) => protect(`<span class="annotation">${match}</span>`)
  );

  // 4. Resaltar keywords de JavaScript - PROTEGER
  highlighted = highlighted.replace(
    /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|async|await|new|this|typeof|instanceof|in|of|class|extends|static|yield|import|export|default|from|as)\b/g,
    (match) => protect(`<span class="keyword">${match}</span>`)
  );

  // 5. Resaltar constantes de JavaScript - PROTEGER
  highlighted = highlighted.replace(
    /\b(true|false|null|undefined|NaN|Infinity)\b/g,
    (match) => protect(`<span class="constant">${match}</span>`)
  );

  // 6. Resaltar objetos y funciones built-in - PROTEGER
  highlighted = highlighted.replace(
    /\b(console|require|process|global|Array|Object|String|Number|Boolean|Date|RegExp|Error|Promise|Map|Set|JSON|Math)\b/g,
    (match) => protect(`<span class="support-class">${match}</span>`)
  );

  // 7. Resaltar variables especiales de trigger (db, gdb, oldData, newData) - PROTEGER
  highlighted = highlighted.replace(
    /\b(db|gdb|oldData|newData)\b/g,
    (match) => protect(`<span class="variable-special">${match}</span>`)
  );

  // 8. Resaltar métodos de base de datos - PROTEGER
  highlighted = highlighted.replace(
    /\.(database|table|where|first|get|find|insert|update|delete|count|sum|avg|min|max|select|join|leftJoin|rightJoin|orderBy|groupBy|limit|page|distinct|whereBetween|whereIn|whereNull|whereNotNull|whereGroup|or|and)\b/g,
    (match) => protect(`.<span class="db-method">${match.substring(1)}</span>`)
  );

  // 9. Resaltar métodos comunes de JavaScript - PROTEGER
  highlighted = highlighted.replace(
    /\.(log|error|warn|info|forEach|map|filter|reduce|find|findIndex|some|every|includes|push|pop|shift|unshift|slice|splice|concat|join|toString|toLowerCase|toUpperCase|trim|replace|split|match|length)\b/g,
    (match) => protect(`.<span class="method">${match.substring(1)}</span>`)
  );

  // 10. Resaltar propiedades de objetos (type, length, options, etc.) - PROTEGER
  highlighted = highlighted.replace(
    /\b(name|description|type|length|options|value|defaultValue|function|foreign|enumValues)(\s*)(?=:)/g,
    (match, prop, space) => protect(`<span class="property">${prop}</span>${space}`)
  );

  // 11. Resaltar nombres de columnas (antes de ":") - PROTEGER
  highlighted = highlighted.replace(
    /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*)(?=:\s*\{)/gm,
    (match, space1, colName, space2) => `${space1}${protect(`<span class="column">${colName}</span>`)}${space2}`
  );

  // 12. Resaltar operadores
  highlighted = highlighted.replace(
    /(===|!==|==|!=|&lt;=|&gt;=|&lt;|&gt;|&amp;&amp;|\|\||!(?!=)|=>|\?(?!\?))/g,
    '<span class="operator">$1</span>'
  );

  // 13. Resaltar números (enteros, decimales, hex, binary)
  highlighted = highlighted.replace(
    /\b(0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g,
    '<span class="number">$1</span>'
  );

  // Restaurar contenido protegido
  return restore(highlighted);
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

/* Template strings - orange */
:deep(.string.template) {
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

/* Comments - green */
:deep(.comment) {
  color: #6a9955;
  font-style: italic;
}

/* Keywords - pink/purple */
:deep(.keyword) {
  color: #c586c0;
  font-weight: 600;
}

/* Constants - light blue */
:deep(.constant) {
  color: #4fc1ff;
}

/* Support classes (console, require, etc.) - teal */
:deep(.support-class) {
  color: #4ec9b0;
}

/* Variables especiales (db, gdb, oldData, newData) - light blue */
:deep(.variable-special) {
  color: #9cdcfe;
  font-weight: 600;
}

/* Métodos de base de datos - yellow */
:deep(.db-method) {
  color: #dcdcaa;
}

/* Métodos de JavaScript - yellow */
:deep(.method) {
  color: #dcdcaa;
}

/* Llamadas a funciones - yellow */
:deep(.function-call) {
  color: #dcdcaa;
}

/* Operadores - white */
:deep(.operator) {
  color: #d4d4d4;
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

html:not(.dark) :deep(.string.template) {
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

html:not(.dark) :deep(.comment) {
  color: #008000;
  font-style: italic;
}

html:not(.dark) :deep(.keyword) {
  color: #0000ff;
  font-weight: 600;
}

html:not(.dark) :deep(.constant) {
  color: #0000ff;
}

html:not(.dark) :deep(.support-class) {
  color: #267f99;
}

html:not(.dark) :deep(.variable-special) {
  color: #001080;
  font-weight: 600;
}

html:not(.dark) :deep(.db-method) {
  color: #795e26;
}

html:not(.dark) :deep(.method) {
  color: #795e26;
}

html:not(.dark) :deep(.function-call) {
  color: #795e26;
}

html:not(.dark) :deep(.operator) {
  color: #000000;
}
</style>
