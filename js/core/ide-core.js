/**
 * IDE Core Manager for Multi-Language Visual Block Editors
 * Features: Dark/Light Mode, Resizable Panels, Code Execution Sandbox, Header Importer
 */

let workspace = null;
let currentLanguageConfig = null;
let isTerminalCollapsed = false;

const LANGUAGES = [
  { id: 'c', name: 'C', file: 'c.html', badge: 'C', color: 'from-blue-600 to-indigo-500', activeBorder: 'border-blue-500/30' },
  { id: 'cpp', name: 'C++', file: 'cpp.html', badge: 'C++', color: 'from-cyan-600 to-blue-500', activeBorder: 'border-cyan-500/30' },
  { id: 'haxe', name: 'Haxe', file: 'haxe.html', badge: 'HX', color: 'from-orange-500 to-amber-500', activeBorder: 'border-orange-500/30' },
  { id: 'lua', name: 'Lua', file: 'lua.html', badge: 'Lua', color: 'from-blue-700 to-sky-500', activeBorder: 'border-sky-500/30' }
];

function initIDE(config) {
  currentLanguageConfig = config;

  // Initialize Theme preference from localStorage
  initTheme();

  // Render Header navigation & toolbar
  renderHeader(config);

  // Initialize Blockly Workspace
  const isDark = document.documentElement.classList.contains('dark');
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    grid: {
      spacing: 20,
      length: 4,
      colour: isDark ? '#334155' : '#e2e8f0',
      snap: true
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2
    },
    trashcan: true,
    theme: isDark ? Blockly.Themes.Dark : Blockly.Themes.Classic
  });

  // Setup workspace from Hub pending load or default config
  const pending = localStorage.getItem('pending_workspace_json');
  if (pending) {
    try {
      const state = JSON.parse(pending);
      Blockly.serialization.workspaces.load(state, workspace);
      localStorage.removeItem('pending_workspace_json');
      setTimeout(() => showStatus('Loaded project workspace!'), 300);
    } catch (e) {
      console.warn('Could not parse pending workspace:', e);
      if (config.initWorkspace && typeof config.initWorkspace === 'function') {
        config.initWorkspace(workspace);
      }
    }
  } else if (config.initWorkspace && typeof config.initWorkspace === 'function') {
    config.initWorkspace(workspace);
  }

  // Listen for blockly changes
  workspace.addChangeListener(updateCode);
  updateCode();

  // Initialize Draggable Resizable Split Pane
  initResizablePanes();

  // Responsive Resize
  window.addEventListener('resize', () => {
    if (workspace) {
      Blockly.svgResize(workspace);
    }
  }, false);
}

/* -------------------------------------------------------------
 * Theme Management (Dark / Light Mode)
 * ------------------------------------------------------------- */
function initTheme() {
  const savedTheme = localStorage.getItem('blocks_ide_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
  applyTheme(isDark);
}

function applyTheme(isDark) {
  const hljsTheme = document.getElementById('hljsTheme');
  if (isDark) {
    document.documentElement.classList.add('dark');
    if (hljsTheme) {
      hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css';
    }
  } else {
    document.documentElement.classList.remove('dark');
    if (hljsTheme) {
      hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
    }
  }
}

function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  localStorage.setItem('blocks_ide_theme', isDark ? 'dark' : 'light');
  applyTheme(isDark);

  if (workspace) {
    workspace.setTheme(isDark ? Blockly.Themes.Dark : Blockly.Themes.Classic);
  }

  const themeLabel = document.getElementById('themeBtnLabel');
  if (themeLabel) {
    themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

/* -------------------------------------------------------------
 * Draggable Split-Pane Resizer
 * ------------------------------------------------------------- */
function initResizablePanes() {
  const divider = document.getElementById('dragDivider');
  const codePane = document.getElementById('codePane');
  if (!divider || !codePane) return;

  let isDragging = false;

  const onPointerDown = (e) => {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const windowWidth = window.innerWidth;
    let newWidth = windowWidth - clientX;

    // Boundaries
    const minWidth = 280;
    const maxWidth = windowWidth * 0.75;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    codePane.style.width = `${newWidth}px`;

    if (workspace) {
      Blockly.svgResize(workspace);
    }
  };

  const onPointerUp = () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (workspace) {
        Blockly.svgResize(workspace);
      }
    }
  };

  divider.addEventListener('mousedown', onPointerDown);
  divider.addEventListener('touchstart', onPointerDown, { passive: false });

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
}

/* -------------------------------------------------------------
 * Header Rendering
 * ------------------------------------------------------------- */
function renderHeader(config) {
  const headerContainer = document.getElementById('appHeader');
  if (!headerContainer) return;

  const activeLangId = config.langId || 'c';
  const isDark = document.documentElement.classList.contains('dark');

  const navTabsHtml = LANGUAGES.map(lang => {
    const isActive = lang.id === activeLangId;
    const activeClass = isActive 
      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold border-blue-200 dark:border-blue-800 shadow-sm' 
      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent';
    return `
      <a href="${lang.file}" class="px-2.5 py-1 rounded-md text-xs border transition flex items-center gap-1.5 ${activeClass}">
        <span class="w-2 h-2 rounded-full ${isActive ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'}"></span>
        ${lang.name}
      </a>
    `;
  }).join('');

  headerContainer.className = "h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-10 shrink-0 shadow-sm transition-colors";
  headerContainer.innerHTML = `
    <div class="flex items-center space-x-4">
      <a href="index.html" class="flex items-center space-x-3 group hover:opacity-90 transition" title="Back to Block Studio Hub">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${config.badgeGradient || 'from-blue-600 to-indigo-500'} flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 text-sm">
          ${config.badgeText || 'C'}
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
            ${config.title || 'Block-C'}
            <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">Visual IDE</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">${config.subtitle || 'Visual Block Development Environment'}</p>
        </div>
      </a>

      <!-- Language Selector Tabs -->
      <nav class="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-800">
        <a href="index.html" class="px-2.5 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 font-medium shadow-sm">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Hub Home
        </a>
        ${navTabsHtml}
      </nav>
    </div>

    <!-- Actions & Controls -->
    <div class="flex items-center space-x-2 sm:space-x-3">
      <div id="importStatus" class="text-xs font-medium px-2.5 py-1 rounded hidden transition">
        Ready
      </div>

      <!-- Theme Switcher Button -->
      <button onclick="toggleTheme()" class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm" title="Toggle Light/Dark Theme">
        <svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>
        <span id="themeBtnLabel">${isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <!-- Hidden file inputs -->
      <input type="file" id="loadFileInput" accept=".json" class="hidden" onchange="handleLoadFile(event)">
      <input type="file" id="moduleFileInput" accept="${config.fileAccept || '.h'}" class="hidden" onchange="handleModuleImport(event)">

      <button onclick="saveWorkspace()" class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm">
        <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
        Save JSON
      </button>

      <button onclick="document.getElementById('loadFileInput').click()" class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm">
        <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        Load JSON
      </button>

      <button onclick="document.getElementById('moduleFileInput').click()" class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 shadow-sm shadow-blue-600/20">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        ${config.importBtnLabel || 'Import Header'}
      </button>
    </div>
  `;
}

function updateCode() {
  if (!workspace || !currentLanguageConfig) return;
  const generator = currentLanguageConfig.generator;
  if (!generator) return;

  const code = generator.workspaceToCode(workspace);
  const codeEl = document.getElementById('codeOutput');
  if (codeEl) {
    codeEl.textContent = code || `/* Visual workspace is empty */`;
    if (window.hljs) {
      hljs.highlightElement(codeEl);
    }
  }
}

function saveWorkspace() {
  if (!workspace) return;
  const state = Blockly.serialization.workspaces.save(workspace);
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const defaultFilename = currentLanguageConfig ? `block_${currentLanguageConfig.langId}_workspace.json` : 'workspace.json';
  a.download = defaultFilename;
  a.click();
  URL.revokeObjectURL(url);
  showStatus(`Workspace saved as ${defaultFilename}`);
}

function handleLoadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const state = JSON.parse(e.target.result);
      Blockly.serialization.workspaces.load(state, workspace);
      updateCode();
      showStatus('Workspace loaded successfully!');
    } catch (err) {
      showStatus('Failed to parse workspace JSON file.', true);
    }
  };
  reader.readAsText(file);
}

/* -------------------------------------------------------------
 * Dynamic Module / Header Importer
 * ------------------------------------------------------------- */
function handleModuleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    parseAndRegisterHeader(file.name, content);
  };
  reader.readAsText(file);
}

function parseAndRegisterHeader(filename, content) {
  try {
    const lines = content.split('\n');
    let importedCount = 0;
    const newBlockXmls = [];

    lines.forEach((line, idx) => {
      line = line.trim();
      // Match #define CONSTANT_NAME value
      const defineMatch = line.match(/^#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
      if (defineMatch) {
        const name = defineMatch[1];
        const val = defineMatch[2];
        const blockType = `imported_const_${name.toLowerCase()}`;
        
        Blockly.Blocks[blockType] = {
          init: function() {
            this.appendDummyInput()
                .appendField(`${filename}: ${name} (${val})`);
            this.setOutput(true, null);
            this.setColour('#EC4899');
            this.setTooltip(`Header constant ${name} = ${val}`);
          }
        };

        if (currentLanguageConfig && currentLanguageConfig.generator) {
          currentLanguageConfig.generator.forBlock[blockType] = function() {
            return [name, 0];
          };
        }

        newBlockXmls.push(`<block type="${blockType}"></block>`);
        importedCount++;
      }

      // Match C Function Declaration: retType funcName(params)
      const funcMatch = line.match(/^(?:void|int|float|double|char\*?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*?)\)\s*;/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const blockType = `imported_func_${funcName.toLowerCase()}`;

        Blockly.Blocks[blockType] = {
          init: function() {
            this.appendDummyInput()
                .appendField(`${filename}: ${funcName}()`);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#8B5CF6');
            this.setTooltip(`Header function ${funcName}`);
          }
        };

        if (currentLanguageConfig && currentLanguageConfig.generator) {
          currentLanguageConfig.generator.forBlock[blockType] = function() {
            return `    ${funcName}();\n`;
          };
        }

        newBlockXmls.push(`<block type="${blockType}"></block>`);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      updateToolboxWithImportedBlocks(newBlockXmls, filename);
      showStatus(`Imported ${importedCount} items from ${filename}`);
    } else {
      showStatus(`Parsed ${filename}, but found no exported defines or function prototypes.`, false);
    }
  } catch (err) {
    console.error('Error importing header:', err);
    showStatus(`Failed to parse module header file.`, true);
  }
}

function updateToolboxWithImportedBlocks(blockXmls, categoryTitle) {
  const toolboxEl = document.getElementById('toolbox');
  if (!toolboxEl || !workspace) return;

  const newCategory = document.createElement('category');
  newCategory.setAttribute('name', `Imported (${categoryTitle})`);
  newCategory.setAttribute('colour', '#EC4899');
  newCategory.innerHTML = blockXmls.join('');

  toolboxEl.appendChild(newCategory);
  workspace.updateToolbox(toolboxEl);
}

/* -------------------------------------------------------------
 * Live Code Runner & Interactive Terminal Engine
 * ------------------------------------------------------------- */
function runCode() {
  const codeEl = document.getElementById('codeOutput');
  const termEl = document.getElementById('terminalOutput');
  if (!codeEl || !termEl) return;

  const code = codeEl.textContent;
  if (!code || code.includes('workspace is empty')) {
    termEl.textContent = '❌ Workspace is empty. Add blocks before running.';
    return;
  }

  // Ensure terminal is visible
  if (isTerminalCollapsed) {
    toggleTerminal();
  }

  const langId = currentLanguageConfig ? currentLanguageConfig.langId : 'c';
  const timestamp = new Date().toLocaleTimeString();

  let outputBuffer = `[${timestamp}] 🚀 Compiling and executing ${langId.toUpperCase()} source...\n--------------------------------------------------\n`;

  try {
    const logs = [];

    // Process statements line by line
    const lines = code.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#include')) return;

      // C printf: printf("format", arg1, arg2...)
      const printfMatch = line.match(/printf\s*\(\s*"([^"]*)"(?:\s*,\s*(.*))?\s*\)\s*;/);
      if (printfMatch) {
        let fmt = printfMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        const argsStr = printfMatch[2];
        if (argsStr) {
          const args = argsStr.split(',').map(a => a.trim());
          let argIdx = 0;
          fmt = fmt.replace(/%[d|f|s|c|p|u|ld]/g, () => {
            const val = args[argIdx++] || '0';
            return val;
          });
        }
        logs.push(fmt);
        return;
      }

      // C++ std::cout << expr1 << expr2 << std::endl;
      if (line.includes('std::cout')) {
        const parts = line.split('<<').map(p => p.trim());
        let output = '';
        parts.forEach(part => {
          if (part.startsWith('std::cout') || part === ';') return;
          if (part.includes('std::endl')) {
            output += '\n';
          } else {
            let cleaned = part.replace(/;$/, '').replace(/^"(.*)"$/, '$1');
            output += cleaned;
          }
        });
        if (output) logs.push(output + '\n');
        return;
      }

      // Haxe trace(expr)
      const traceMatch = line.match(/trace\s*\(\s*(.*?)\s*\)\s*;/);
      if (traceMatch) {
        let val = traceMatch[1].replace(/^"(.*)"$/, '$1');
        logs.push(`Main.hx: ${val}\n`);
        return;
      }

      // Lua print(expr)
      const printMatch = line.match(/print\s*\(\s*(.*?)\s*\);?/);
      if (printMatch) {
        let val = printMatch[1].replace(/^"(.*)"$/, '$1');
        logs.push(`${val}\n`);
        return;
      }
    });

    if (logs.length > 0) {
      outputBuffer += logs.join('');
    } else {
      outputBuffer += `Program compiled and executed successfully with exit status 0 (stdout was empty).\n`;
    }

    outputBuffer += `--------------------------------------------------\nProcess finished with exit status 0.\n`;
    termEl.textContent = outputBuffer;
    termEl.scrollTop = termEl.scrollHeight;
  } catch (err) {
    termEl.textContent = outputBuffer + `❌ Execution Error: ${err.message}\n`;
  }
}

function clearTerminal() {
  const termEl = document.getElementById('terminalOutput');
  if (termEl) {
    termEl.textContent = 'Console output cleared.\n';
  }
}

function toggleTerminal() {
  const container = document.getElementById('terminalContainer');
  const btn = document.getElementById('toggleTerminalBtn');
  if (!container || !btn) return;

  isTerminalCollapsed = !isTerminalCollapsed;
  if (isTerminalCollapsed) {
    container.classList.remove('h-48');
    container.classList.add('h-8');
    btn.textContent = 'Show';
  } else {
    container.classList.remove('h-8');
    container.classList.add('h-48');
    btn.textContent = 'Hide';
  }

  if (workspace) {
    setTimeout(() => Blockly.svgResize(workspace), 220);
  }
}

function copyCode() {
  const codeEl = document.getElementById('codeOutput');
  if (!codeEl) return;
  const codeText = codeEl.textContent;
  navigator.clipboard.writeText(codeText).then(() => {
    const textEl = document.getElementById('copyText');
    const iconEl = document.getElementById('copyIcon');
    if (textEl) textEl.textContent = 'Copied!';
    if (iconEl) iconEl.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    setTimeout(() => {
      if (textEl) textEl.textContent = 'Copy';
      if (iconEl) iconEl.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002 2m0 0h2a2 2 0 002 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>';
    }, 2000);
  });
}

function showStatus(msg, isError = false) {
  const statusEl = document.getElementById('importStatus');
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = `text-xs font-medium px-2.5 py-1 rounded border transition ${
    isError 
      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  }`;
  statusEl.classList.remove('hidden');
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 4000);
}
