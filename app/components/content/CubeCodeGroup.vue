<script setup lang="ts">
interface CodeFile {
  filename: string;
  code: string;
  language?: string;
}

const props = withDefaults(defineProps<{
  files?: CodeFile[];
}>(), {
  files: () => []
});

const activeTab = ref(0);
const copied = ref(false);

const setActiveTab = (index: number) => {
  activeTab.value = index;
};

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

const copyCurrentTab = () => {
  const currentFile = props.files[activeTab.value];
  if (currentFile) {
    copy(currentFile.code);
  }
};

const highlightBash = (code: string) => {
  if (!code) return '';

  // Escapar HTML
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Sistema de protección
  const protectedContent: { [key: string]: string } = {};
  let protectIndex = 0;

  const protect = (content: string): string => {
    const placeholder = `###BASH_PROTECTED_${protectIndex++}###`;
    protectedContent[placeholder] = content;
    return placeholder;
  };

  const restore = (text: string): string => {
    return text.replace(/###BASH_PROTECTED_(\d+)###/g, (match) => {
      return protectedContent[match] || match;
    });
  };

  // 1. Proteger comentarios primero
  highlighted = highlighted.replace(
    /#(.*)$/gm,
    (match) => protect(`<span class="bash-comment">${match}</span>`)
  );

  // 2. Proteger strings con comillas
  highlighted = highlighted.replace(
    /"([^"]*)"/g,
    (match) => protect(`<span class="bash-string">${match}</span>`)
  );

  highlighted = highlighted.replace(
    /'([^']*)'/g,
    (match) => protect(`<span class="bash-string">${match}</span>`)
  );

  // 3. Proteger flags
  highlighted = highlighted.replace(
    /--[a-zA-Z0-9-]+/g,
    (match) => protect(`<span class="bash-flag">${match}</span>`)
  );

  // 4. Proteger comandos principales
  highlighted = highlighted.replace(
    /\b(dbcube|npm|yarn|pnpm|npx|node|git|docker|curl|wget)\b/g,
    (match) => protect(`<span class="bash-command">${match}</span>`)
  );

  // 5. Proteger subcomandos
  highlighted = highlighted.replace(
    /\b(run|install|add|remove|update|create|delete|fresh|refresh|download|database|table|seeder|trigger|query-engine)\b/g,
    (match) => protect(`<span class="bash-subcommand">${match}</span>`)
  );

  // Restaurar contenido protegido
  return restore(highlighted);
};

const highlightTypeScript = (code: string) => {
  if (!code) return '';

  // Escapar HTML
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Sistema de protección
  const protectedItems: string[] = [];

  const protect = (html: string): string => {
    const index = protectedItems.length;
    protectedItems.push(html);
    return `___PROTECTED_${index}___`;
  };

  const restore = (text: string): string => {
    let result = text;
    for (let i = 0; i < protectedItems.length; i++) {
      result = result.replace(`___PROTECTED_${i}___`, protectedItems[i]);
    }
    return result;
  };

  // 1. Proteger comentarios
  highlighted = highlighted.replace(
    /\/\/(.*)$/gm,
    (match) => protect(`<span class="ts-comment">${match}</span>`)
  );

  // 2. Proteger strings
  highlighted = highlighted.replace(
    /"([^"\\]*(?:\\.[^"\\]*)*)"/g,
    (match) => protect(`<span class="ts-string">${match}</span>`)
  );

  highlighted = highlighted.replace(
    /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (match) => protect(`<span class="ts-string">${match}</span>`)
  );

  highlighted = highlighted.replace(
    /`([^`]*(?:\\.[^`]*)*)`/g,
    (match) => protect(`<span class="ts-string">${match}</span>`)
  );

  // 3. Proteger keywords
  highlighted = highlighted.replace(
    /\b(import|from|export|default|const|let|var|function|async|await|return|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|new|typeof|instanceof|class|extends|interface|type|enum|namespace|module|declare|public|private|protected|static|readonly)\b/g,
    (match) => protect(`<span class="ts-keyword">${match}</span>`)
  );

  // 4. Proteger constantes
  highlighted = highlighted.replace(
    /\b(true|false|null|undefined|NaN|Infinity)\b/g,
    (match) => protect(`<span class="ts-constant">${match}</span>`)
  );

  // 5. Proteger clases
  highlighted = highlighted.replace(
    /\b([A-Z][a-zA-Z0-9_]*)\b/g,
    (match) => protect(`<span class="ts-class">${match}</span>`)
  );

  // 6. Proteger métodos
  highlighted = highlighted.replace(
    /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
    (match, method) => protect(`.<span class="ts-method">${method}</span>`)
  );

  // 7. Proteger propiedades
  highlighted = highlighted.replace(
    /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?!\s*\()/g,
    (match, prop) => protect(`.<span class="ts-property">${prop}</span>`)
  );

  // 8. Proteger números
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    (match) => protect(`<span class="ts-number">${match}</span>`)
  );

  // Restaurar todo el contenido protegido
  return restore(highlighted);
};
</script>

<template>
  <div class="cube-code-group">
    <div class="tabs-container">
      <div class="tabs">
        <button
          v-for="(file, index) in files"
          :key="index"
          class="tab"
          :class="{ active: activeTab === index }"
          @click="setActiveTab(index)"
        >
          {{ file.filename }}
        </button>
      </div>
      <button
        class="copy-btn"
        @click="copyCurrentTab"
        :class="{ copied: copied }"
      >
        <UIcon v-if="!copied" name="i-lucide-copy" />
        <UIcon v-else name="i-lucide-check" />
      </button>
    </div>

    <div class="tab-content">
      <div
        v-for="(file, index) in files"
        :key="index"
        v-show="activeTab === index"
        class="tab-panel"
      >
        <CubeCode
          v-if="file.language === 'cube' || !file.language"
          :code="file.code"
          :filename="file.filename"
        />
        <div v-else-if="file.language === 'bash'" class="bash-code">
          <pre><code v-html="highlightBash(file.code)"></code></pre>
        </div>
        <div v-else-if="file.language === 'typescript' || file.language === 'javascript'" class="ts-code">
          <pre><code v-html="highlightTypeScript(file.code)"></code></pre>
        </div>
        <div v-else class="other-code">
          <pre><code>{{ file.code }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cube-code-group {
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tabs-container {
  background: #1e1e1e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  flex: 1;
}

.tabs::-webkit-scrollbar {
  height: 4px;
}

.tabs::-webkit-scrollbar-track {
  background: transparent;
}

.tabs::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.tab {
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  position: relative;
}

.tab:hover {
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  color: #51fbde;
  border-bottom-color: #51fbde;
  background: rgba(81, 251, 222, 0.05);
}

.copy-btn {
  background: transparent;
  border: none;
  color: #51fbde;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 0.5rem;
}

.copy-btn:hover {
  background: rgba(81, 251, 222, 0.1);
  color: #51fbde;
}

.copy-btn.copied {
  color: #51fbde;
}

.tab-content {
  background: #1e1e1e;
}

.tab-panel {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.bash-code,
.ts-code,
.other-code {
  padding: 1.25rem;
  background: #1e1e1e;
}

.bash-code pre,
.ts-code pre,
.other-code pre {
  margin: 0;
  background: transparent;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.bash-code code,
.ts-code code,
.other-code code {
  background: transparent;
}

/* Bash syntax highlighting */
:deep(.bash-comment) {
  color: #6a9955;
  font-style: italic;
}

:deep(.bash-command) {
  color: #dcdcaa;
  font-weight: 600;
}

:deep(.bash-subcommand) {
  color: #4ec9b0;
}

:deep(.bash-flag) {
  color: #9cdcfe;
}

:deep(.bash-string) {
  color: #ce9178;
}

/* TypeScript syntax highlighting */
:deep(.ts-comment) {
  color: #6a9955;
  font-style: italic;
}

:deep(.ts-string) {
  color: #ce9178;
}

:deep(.ts-number) {
  color: #b5cea8;
}

:deep(.ts-keyword) {
  color: #c586c0;
  font-weight: 600;
}

:deep(.ts-constant) {
  color: #4fc1ff;
}

:deep(.ts-class) {
  color: #4ec9b0;
}

:deep(.ts-method) {
  color: #dcdcaa;
}

:deep(.ts-property) {
  color: #9cdcfe;
}

/* Light mode */
html:not(.dark) .cube-code-group {
  border: 1px solid #e5e7eb;
}

html:not(.dark) .tabs-container {
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

html:not(.dark) .tab {
  color: #6b7280;
}

html:not(.dark) .tab:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.05);
}

html:not(.dark) .tab.active {
  color: #0ea5e9;
  border-bottom-color: #0ea5e9;
  background: rgba(14, 165, 233, 0.05);
}

html:not(.dark) .copy-btn {
  color: #51fbde;
}

html:not(.dark) .copy-btn:hover {
  background: rgba(81, 251, 222, 0.1);
  color: #51fbde;
}

html:not(.dark) .copy-btn.copied {
  color: #51fbde;
}

html:not(.dark) .tab-content {
  background: #ffffff;
}

html:not(.dark) .bash-code,
html:not(.dark) .ts-code,
html:not(.dark) .other-code {
  background: #f5f5f5;
}

html:not(.dark) .bash-code pre,
html:not(.dark) .ts-code pre,
html:not(.dark) .other-code pre {
  color: #24292e;
}

/* Bash syntax highlighting - light mode */
html:not(.dark) :deep(.bash-comment) {
  color: #008000;
}

html:not(.dark) :deep(.bash-command) {
  color: #795e26;
  font-weight: 600;
}

html:not(.dark) :deep(.bash-subcommand) {
  color: #267f99;
}

html:not(.dark) :deep(.bash-flag) {
  color: #001080;
}

html:not(.dark) :deep(.bash-string) {
  color: #a31515;
}

/* TypeScript syntax highlighting - light mode */
html:not(.dark) :deep(.ts-comment) {
  color: #008000;
}

html:not(.dark) :deep(.ts-string) {
  color: #a31515;
}

html:not(.dark) :deep(.ts-number) {
  color: #098658;
}

html:not(.dark) :deep(.ts-keyword) {
  color: #0000ff;
  font-weight: 600;
}

html:not(.dark) :deep(.ts-constant) {
  color: #0000ff;
}

html:not(.dark) :deep(.ts-class) {
  color: #267f99;
}

html:not(.dark) :deep(.ts-method) {
  color: #795e26;
}

html:not(.dark) :deep(.ts-property) {
  color: #001080;
}

/* Ocultar el header del CubeCode cuando está dentro del grupo */
.cube-code-group :deep(.cube-header) {
  display: none;
}

.cube-code-group :deep(.cube-code-wrapper) {
  margin: 0;
  border: none;
  border-radius: 0;
}
</style>
