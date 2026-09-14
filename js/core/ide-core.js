/**
 * IDE Core Manager for Multi-Language Visual Block Editors (Enforced Light Mode)
 */

let workspace = null;
let currentLanguageConfig = null;

const LANGUAGES = [
  { id: 'c', name: 'C', file: 'index C.html', badge: 'C', color: 'from-blue-600 to-indigo-500', activeBorder: 'border-blue-500/30' },
  { id: 'cpp', name: 'C++', file: 'index C++.html', badge: 'C++', color: 'from-cyan-600 to-blue-500', activeBorder: 'border-cyan-500/30' },
  { id: 'haxe', name: 'Haxe', file: 'index haxe.html', badge: 'HX', color: 'from-orange-500 to-amber-500', activeBorder: 'border-orange-500/30' },
  { id: 'lua', name: 'Lua', file: 'index lua.html', badge: 'Lua', color: 'from-blue-700 to-sky-500', activeBorder: 'border-sky-500/30' }
];

function initIDE(config) {
  currentLanguageConfig = config;

  // Render Header navigation & toolbar if header element exists
  renderHeader(config);

  // Initialize Blockly Workspace with Light Theme settings
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    grid: {
      spacing: 20,
      length: 4,
      colour: '#e2e8f0',
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
    theme: Blockly.Themes.Classic
  });

  // Setup workspace from Hub pending load or default config
  const pending = localStorage.getItem('pending_workspace_json');
  if (pending) {
    try {
      const state = JSON.parse(pending);
      Blockly.serialization.workspaces.load(state, workspace);
      localStorage.removeItem('pending_workspace_json');
      setTimeout(() => showStatus('Loaded project workspace from Hub!'), 300);
    } catch (e) {
      console.warn('Could not parse pending workspace:', e);
      if (config.initWorkspace && typeof config.initWorkspace === 'function') {
        config.initWorkspace(workspace);
      }
    }
  } else if (config.initWorkspace && typeof config.initWorkspace === 'function') {
    config.initWorkspace(workspace);
  }

  // Listen for changes
  workspace.addChangeListener(updateCode);
  updateCode();

  // Responsive Resize
  window.addEventListener('resize', () => {
    if (workspace) {
      Blockly.svgResize(workspace);
    }
  }, false);
}

function renderHeader(config) {
  const headerContainer = document.getElementById('appHeader');
  if (!headerContainer) return;

  const activeLangId = config.langId || 'c';
  const navTabsHtml = LANGUAGES.map(lang => {
    const isActive = lang.id === activeLangId;
    const activeClass = isActive 
      ? 'bg-blue-50 text-blue-600 font-semibold border-blue-200 shadow-sm' 
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent';
    return `
      <a href="${lang.file}" class="px-2.5 py-1 rounded-md text-xs border transition flex items-center gap-1.5 ${activeClass}">
        <span class="w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-300'}"></span>
        ${lang.name}
      </a>
    `;
  }).join('');

  headerContainer.className = "h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-10 shrink-0 shadow-sm";
  headerContainer.innerHTML = `
    <div class="flex items-center space-x-4">
      <a href="index.html" class="flex items-center space-x-3 group hover:opacity-90 transition" title="Back to Block Studio Hub">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${config.badgeGradient || 'from-blue-600 to-indigo-500'} flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 text-sm">
          ${config.badgeText || 'C'}
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
            ${config.title || 'Block-C'}
            <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-200">Visual IDE</span>
          </h1>
          <p class="text-xs text-slate-500">${config.subtitle || 'Visual Block-Based Development Environment'}</p>
        </div>
      </a>

      <!-- Language Selector Tabs -->
      <nav class="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
        <a href="index.html" class="px-2.5 py-1 rounded-md text-xs border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition flex items-center gap-1.5 font-medium shadow-sm">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Hub Home
        </a>
        ${navTabsHtml}
      </nav>
    </div>

    <!-- Actions & Controls -->
    <div class="flex items-center space-x-2 sm:space-x-3">
      <div id="importStatus" class="text-xs text-emerald-700 font-medium px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 hidden transition">
        Ready
      </div>

      <!-- Hidden file inputs -->
      <input type="file" id="loadFileInput" accept=".json" class="hidden" onchange="handleLoadFile(event)">
      <input type="file" id="moduleFileInput" accept="${config.fileAccept || '.h'}" class="hidden" onchange="handleModuleImport(event)">

      <button onclick="saveWorkspace()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-md text-xs font-medium border border-slate-300 transition flex items-center gap-1.5 shadow-sm">
        <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
        Save JSON
      </button>

      <button onclick="document.getElementById('loadFileInput').click()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-md text-xs font-medium border border-slate-300 transition flex items-center gap-1.5 shadow-sm">
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
  const defaultFilename = currentLanguageConfig ? `block${currentLanguageConfig.langId}_workspace.json` : 'workspace.json';
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

function handleModuleImport(event) {
  const file = event.target.files[0];
  if (!file || !currentLanguageConfig || !currentLanguageConfig.parseImporter) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    currentLanguageConfig.parseImporter(file.name, e.target.result);
  };
  reader.readAsText(file);
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
      if (textEl) textEl.textContent = 'Copy Code';
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
      ? 'bg-rose-50 text-rose-700 border-rose-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }`;
  statusEl.classList.remove('hidden');
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 4000);
}
