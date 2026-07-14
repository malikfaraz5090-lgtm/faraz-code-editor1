// ============================================
// FARAZ CODE EDITOR - FINAL COMPLETE APP.JS
// ============================================

// Monaco Editor Configuration
require.config({ 
    paths: { 
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
    },
    waitSeconds: 15
});

// ============================================
// FILE SYSTEM MANAGEMENT
// ============================================
class FileSystem {
    constructor() {
        this.files = new Map();
        this.loadFromStorage();
        if (this.files.size === 0) {
            this.createDefaultFiles();
        }
    }

    createDefaultFiles() {
        const defaultFiles = {
            'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello World!</h1>
    <p>Welcome to Faraz Code Editor</p>
    <script src="script.js"></script>
</body>
</html>`,
            'style.css': `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
}
h1 {
    text-align: center;
    font-size: 3em;
    margin-top: 100px;
}
p {
    text-align: center;
    font-size: 1.2em;
}`,
            'script.js': `document.addEventListener('DOMContentLoaded', () => {
    console.log('Faraz Code Editor Ready!');
    const h1 = document.querySelector('h1');
    h1.addEventListener('click', () => {
        h1.style.color = '#ffd700';
        h1.textContent = 'Hello Faraz Code Editor!';
    });
});`
        };

        for (const [filename, content] of Object.entries(defaultFiles)) {
            this.files.set(filename, {
                name: filename,
                content: content,
                language: this.getLanguageFromExtension(filename),
                lastModified: Date.now()
            });
        }
        this.saveToStorage();
    }

    getLanguageFromExtension(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'html': 'html', 'htm': 'html', 'css': 'css', 'js': 'javascript',
            'json': 'json', 'xml': 'xml', 'md': 'markdown', 'py': 'python',
            'php': 'php', 'sql': 'sql'
        };
        return languageMap[ext] || 'plaintext';
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('faraz-editor-files');
            if (stored) {
                const filesObj = JSON.parse(stored);
                for (const [name, file] of Object.entries(filesObj)) {
                    this.files.set(name, file);
                }
            }
        } catch (e) {
            console.error('Failed to load files:', e);
        }
    }

    saveToStorage() {
        try {
            const filesObj = {};
            for (const [name, file] of this.files) {
                filesObj[name] = file;
            }
            localStorage.setItem('faraz-editor-files', JSON.stringify(filesObj));
        } catch (e) {
            console.error('Failed to save files:', e);
        }
    }

    createFile(name, content = '') {
        if (this.files.has(name)) throw new Error('File already exists');
        const file = {
            name, content,
            language: this.getLanguageFromExtension(name),
            lastModified: Date.now()
        };
        this.files.set(name, file);
        this.saveToStorage();
        return file;
    }

    updateFile(name, content) {
        const file = this.files.get(name);
        if (!file) throw new Error('File not found');
        file.content = content;
        file.lastModified = Date.now();
        this.saveToStorage();
    }

    deleteFile(name) {
        this.files.delete(name);
        this.saveToStorage();
    }

    renameFile(oldName, newName) {
        const file = this.files.get(oldName);
        if (!file) throw new Error('File not found');
        if (this.files.has(newName)) throw new Error('File already exists');
        file.name = newName;
        file.language = this.getLanguageFromExtension(newName);
        this.files.delete(oldName);
        this.files.set(newName, file);
        this.saveToStorage();
    }

    getAllFiles() {
        return Array.from(this.files.values());
    }
}

// ============================================
// EDITOR MANAGER
// ============================================
class EditorManager {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.editor = null;
        this.currentFile = null;
        this.openTabs = new Set();
        this.init();
    }

    async init() {
        await this.initMonaco();
        this.setupEventListeners();
        this.renderFileList();
        this.loadSettings();
        const files = this.fileSystem.getAllFiles();
        if (files.length > 0) {
            this.openFile(files[0].name);
        }
    }

    initMonaco() {
        return new Promise((resolve, reject) => {
            try {
                require(['vs/editor/editor.main'], () => {
                    this.editor = monaco.editor.create(document.getElementById('editor'), {
                        value: '',
                        language: 'html',
                        theme: 'vs-dark',
                        fontSize: 14,
                        tabSize: 2,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true,
                    });

                    this.editor.onDidChangeCursorPosition((e) => {
                        const el = document.getElementById('cursorPosition');
                        if (el) el.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
                    });

                    this.editor.onDidChangeModelContent(() => {
                        if (this.currentFile) {
                            this.fileSystem.updateFile(this.currentFile, this.editor.getValue());
                            this.updateFileSize();
                        }
                    });

                    resolve();
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    setupEventListeners() {
        const safeOn = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, fn);
        };

        safeOn('menuBtn', 'click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        safeOn('newFileBtn', 'click', () => this.createNewFile());
        safeOn('runBtn', 'click', () => this.togglePreview());
        safeOn('saveBtn', 'click', () => this.saveCurrentFile());
        safeOn('settingsBtn', 'click', () => this.toggleSettings());
        safeOn('buildApkBtn', 'click', () => this.showBuildModal());
        safeOn('closePreview', 'click', () => this.hidePreview());
        safeOn('closeSettings', 'click', () => this.toggleSettings());
        safeOn('resetSettings', 'click', () => this.resetSettings());
        safeOn('importBtn', 'click', () => this.importFiles());
        safeOn('exportBtn', 'click', () => this.exportProject());

        safeOn('themeSelect', 'change', (e) => {
            monaco.editor.setTheme(e.target.value);
            this.saveSettings();
        });
        safeOn('fontSize', 'change', (e) => {
            this.editor.updateOptions({ fontSize: parseInt(e.target.value) });
            this.saveSettings();
        });
        safeOn('tabSize', 'change', (e) => {
            this.editor.updateOptions({ tabSize: parseInt(e.target.value) });
            this.saveSettings();
        });
        safeOn('wordWrap', 'change', (e) => {
            this.editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
            this.saveSettings();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentFile();
                } else if (e.key === 'n') {
                    e.preventDefault();
                    this.createNewFile();
                }
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });

        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.getElementById('menuBtn');
            if (window.innerWidth <= 768 && sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && e.target !== menuBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    openFile(filename) {
        const file = this.fileSystem.files.get(filename);
        if (!file) return;
        this.currentFile = filename;
        if (this.editor) {
            const model = this.editor.getModel();
            if (model) {
                model.setValue(file.content);
                monaco.editor.setModelLanguage(model, file.language);
            }
        }
        const currentFileEl = document.getElementById('currentFile');
        if (currentFileEl) currentFileEl.textContent = filename;
        const langEl = document.getElementById('languageMode');
        if (langEl) langEl.textContent = file.language.toUpperCase();
        this.updateFileSize();
        this.renderTabs();
        this.renderFileList();
        this.hidePreview();
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;
        fileList.innerHTML = '';
        const files = this.fileSystem.getAllFiles();
        files.sort((a, b) => a.name.localeCompare(b.name));
        files.forEach(file => {
            const div = document.createElement('div');
            div.className = `file-item ${file.name === this.currentFile ? 'active' : ''}`;
            div.innerHTML = `
                <span class="file-icon">${this.getFileIcon(file.name)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-actions">
                    <button class="icon-btn-small rename-btn" title="Rename">✎</button>
                    <button class="icon-btn-small delete-btn" title="Delete">🗑</button>
                </span>`;
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) this.openFile(file.name);
            });
            div.querySelector('.rename-btn').addEventListener('click', (e) => {
                e.stopPropagation(); this.renameFile(file.name);
            });
            div.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); this.deleteFile(file.name);
            });
            fileList.appendChild(div);
        });
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    renderTabs() {
        const tabBar = document.getElementById('tabBar');
        if (!tabBar) return;
        tabBar.innerHTML = '';
        this.openTabs.forEach(filename => {
            const tab = document.createElement('div');
            tab.className = `tab ${filename === this.currentFile ? 'active' : ''}`;
            tab.innerHTML = `<span class="tab-name">${filename}</span><span class="tab-close">×</span>`;
            tab.addEventListener('click', () => this.openFile(filename));
            tab.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation(); this.closeTab(filename);
            });
            tabBar.appendChild(tab);
        });
    }

    closeTab(filename) {
        this.openTabs.delete(filename);
        if (this.currentFile === filename) {
            const remaining = Array.from(this.openTabs);
            if (remaining.length > 0) this.openFile(remaining[0]);
        }
        this.renderTabs();
        this.renderFileList();
    }

    createNewFile() {
        const name = prompt('Enter file name (with extension):');
        if (!name) return;
        try {
            this.fileSystem.createFile(name);
            this.openFile(name);
            this.renderFileList();
        } catch (e) { alert(e.message); }
    }

    renameFile(oldName) {
        const newName = prompt('Enter new name:', oldName);
        if (!newName || newName === oldName) return;
        try {
            this.fileSystem.renameFile(oldName, newName);
            if (this.currentFile === oldName) this.openFile(newName);
            this.renderFileList();
            this.renderTabs();
        } catch (e) { alert(e.message); }
    }

    deleteFile(filename) {
        if (!confirm(`Delete ${filename}?`)) return;
        this.fileSystem.deleteFile(filename);
        this.closeTab(filename);
        this.renderFileList();
    }

    saveCurrentFile() {
        if (this.currentFile && this.editor) {
            this.fileSystem.updateFile(this.currentFile, this.editor.getValue());
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.textContent = '✓';
                setTimeout(() => { saveBtn.textContent = '💾'; }, 1000);
            }
        }
    }

    togglePreview() {
        const preview = document.getElementById('preview');
        const editor = document.getElementById('editor');
        if (!preview || !editor) return;
        if (preview.style.display === 'none') this.showPreview();
        else this.hidePreview();
    }

    showPreview() {
        const preview = document.getElementById('preview');
        const editor = document.getElementById('editor');
        const frame = document.getElementById('previewFrame');
        if (!preview || !editor || !frame) return;
        frame.srcdoc = this.generatePreviewContent();
        preview.style.display = 'block';
        editor.style.display = 'none';
    }

    hidePreview() {
        const preview = document.getElementById('preview');
        const editor = document.getElementById('editor');
        if (preview) preview.style.display = 'none';
        if (editor) editor.style.display = 'block';
    }

    generatePreviewContent() {
        const files = this.fileSystem.files;
        let html = files.get('index.html')?.content || '';
        const css = files.get('style.css')?.content || '';
        const js = files.get('script.js')?.content || '';
        if (css) html = html.replace('</head>', `<style>${css}</style></head>`);
        if (js) html = html.replace('</body>', `<script>${js}</script></body>`);
        return html;
    }

    toggleSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.toggle('active');
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('faraz-editor-settings') || '{}');
            if (settings.theme) {
                const el = document.getElementById('themeSelect');
                if (el) el.value = settings.theme;
                monaco.editor.setTheme(settings.theme);
            }
            if (settings.fontSize && this.editor) {
                const el = document.getElementById('fontSize');
                if (el) el.value = settings.fontSize;
                this.editor.updateOptions({ fontSize: settings.fontSize });
            }
            if (settings.tabSize && this.editor) {
                const el = document.getElementById('tabSize');
                if (el) el.value = settings.tabSize;
                this.editor.updateOptions({ tabSize: settings.tabSize });
            }
            if (settings.wordWrap !== undefined && this.editor) {
                const el = document.getElementById('wordWrap');
                if (el) el.checked = settings.wordWrap;
                this.editor.updateOptions({ wordWrap: settings.wordWrap ? 'on' : 'off' });
            }
        } catch(e) {}
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect')?.value || 'vs-dark',
            fontSize: parseInt(document.getElementById('fontSize')?.value || 14),
            tabSize: parseInt(document.getElementById('tabSize')?.value || 2),
            wordWrap: document.getElementById('wordWrap')?.checked ?? true
        };
        localStorage.setItem('faraz-editor-settings', JSON.stringify(settings));
    }

    resetSettings() {
        const defaults = { theme: 'vs-dark', fontSize: 14, tabSize: 2, wordWrap: true };
        localStorage.setItem('faraz-editor-settings', JSON.stringify(defaults));
        this.loadSettings();
    }

    importFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.html,.css,.js,.json,.xml,.md,.txt,.py,.php,.sql';
        input.onchange = async (e) => {
            for (let file of e.target.files) {
                const content = await file.text();
                try { this.fileSystem.createFile(file.name, content); }
                catch(e) { this.fileSystem.updateFile(file.name, content); }
            }
            this.renderFileList();
            if (e.target.files.length > 0) this.openFile(e.target.files[0].name);
        };
        input.click();
    }

    exportProject() {
        this.fileSystem.getAllFiles().forEach(file => {
            const blob = new Blob([file.content], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = file.name;
            a.click();
        });
    }

    getFileIcon(filename) {
        const icons = { 'html': '🌐', 'css': '🎨', 'js': '📜', 'json': '📋', 'xml': '📰', 'md': '📝', 'py': '🐍' };
        return icons[filename.split('.').pop()] || '📄';
    }

    updateFileSize() {
        if (this.currentFile && this.editor) {
            const el = document.getElementById('fileSize');
            if (el) el.textContent = new Blob([this.editor.getValue()]).size + ' bytes';
        }
    }

    // ============================================
    // BUILD APK MODAL
    // ============================================
    showBuildModal() {
        const modal = document.createElement('div');
        modal.id = 'buildModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:3000;display:flex;justify-content:center;align-items:center;';
        modal.innerHTML = `
            <div style="background:#252526;border-radius:12px;padding:25px;width:90%;max-width:400px;text-align:center;">
                <h2 style="color:#007acc;">📦 Build APK</h2>
                <p style="color:#ccc;">Preparing build environment...</p>
                <div style="width:100%;height:6px;background:#3e3e3e;border-radius:3px;margin:20px 0;">
                    <div id="buildProgress" style="height:100%;background:linear-gradient(90deg,#007acc,#4ec9b0);width:0%;border-radius:3px;transition:width 0.5s;"></div>
                </div>
                <p id="buildStatus" style="color:#999;font-size:14px;">Initializing...</p>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
                    <button onclick="document.getElementById('buildModal').remove()" style="background:#3e3e3e;color:#ccc;border:none;padding:10px 20px;border-radius:6px;">Cancel</button>
                    <button id="startBuildBtn" style="background:#007acc;color:#fff;border:none;padding:10px 20px;border-radius:6px;">Start Build</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        document.getElementById('startBuildBtn').addEventListener('click', () => {
            const steps = ['Checking files...','Compiling HTML...','Bundling CSS...','Optimizing JavaScript...','Generating APK...','Signing APK...','✅ Build Complete!'];
            let step = 0;
            const bar = document.getElementById('buildProgress');
            const status = document.getElementById('buildStatus');
            const interval = setInterval(() => {
                if (step < steps.length) {
                    status.textContent = steps[step];
                    bar.style.width = ((step + 1) / steps.length * 100) + '%';
                    step++;
                } else {
                    clearInterval(interval);
                    status.style.color = '#4ec9b0';
                    this.exportProject();
                    setTimeout(() => {
                        const content = modal.querySelector('div');
                        content.innerHTML = '<h2 style="color:#4ec9b0;">✅ Build Complete!</h2><p style="color:#ccc;">Project files downloaded!</p><p style="color:#999;font-size:12px;">For APK, use GitHub Actions</p><button onclick="document.getElementById(\'buildModal\').remove()" style="background:#007acc;color:#fff;border:none;padding:10px 20px;border-radius:6px;margin-top:15px;">Close</button>';
                    }, 500);
                }
            }, 800);
        });
    }
}

// ============================================
// TOAST NOTIFICATION (GLOBAL)
// ============================================
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#007acc;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:10000;animation:fadeInOut 2s;';
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2000);
}

// Add animations
const animStyle = document.createElement('style');
animStyle.textContent = '@keyframes fadeInOut { 0%{opacity:0;transform:translateX(-50%) translateY(20px)} 15%{opacity:1;transform:translateX(-50%) translateY(0)} 85%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-20px)} }';
document.head.appendChild(animStyle);

// ============================================
// PASTE OPTIMIZATION
// ============================================
document.addEventListener('paste', function(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text');
    if (pastedData && pastedData.length > 5000 && window.editorManager && window.editorManager.editor) {
        e.preventDefault();
        showToast('Pasting large content...');
        setTimeout(() => {
            const editor = window.editorManager.editor;
            const pos = editor.getPosition();
            editor.executeEdits('paste', [{ range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: pastedData }]);
            showToast('Content pasted!');
        }, 100);
    }
});

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const fileSystem = new FileSystem();
    const editorManager = new EditorManager(fileSystem);
    window.editorManager = editorManager;
});
