// Paste Handler Optimization
document.addEventListener('DOMContentLoaded', function() {
    
    // Optimize paste events
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        
        // Get clipboard data
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedData = clipboardData.getData('text');
        
        if (pastedData && pastedData.length > 5000) {
            // Large paste - show loading
            showToast('Pasting large content...');
            
            // Use setTimeout to prevent UI freeze
            setTimeout(() => {
                if (editor) {
                    const position = editor.getPosition();
                    editor.executeEdits('paste', [{
                        range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            position.lineNumber,
                            position.column
                        ),
                        text: pastedData
                    }]);
                    showToast('Content pasted successfully!');
                }
            }, 100);
        } else if (editor) {
            // Small paste - direct insert
            const position = editor.getPosition();
            editor.executeEdits('paste', [{
                range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                ),
                text: pastedData
            }]);
        }
    });
    
    // Toast notification function
    function showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: #007acc;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
        `;
        document.body.appendChild(toast);
        
        // Remove after 2 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 2000);
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
});// Monaco Editor Configuration
require.config({ 
    paths: { 
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
    } 
});

// File System Management
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
}`,
            'script.js': `document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized!');
    
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
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'py': 'python',
            'php': 'php',
            'sql': 'sql'
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
            console.error('Failed to load files from storage:', e);
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
            console.error('Failed to save files to storage:', e);
        }
    }

    createFile(name, content = '') {
        if (this.files.has(name)) {
            throw new Error('File already exists');
        }
        const file = {
            name,
            content,
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

// Editor Manager
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
        
        // Open first file
        const files = this.fileSystem.getAllFiles();
        if (files.length > 0) {
            this.openFile(files[0].name);
        }
    }

    initMonaco() {
        return new Promise((resolve) => {
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
                    autoIndent: 'full',
                    formatOnPaste: true,
                    formatOnType: true,
                });

                // Track cursor position
                this.editor.onDidChangeCursorPosition((e) => {
                    document.getElementById('cursorPosition').textContent = 
                        `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
                });

                // Track content changes
                this.editor.onDidChangeModelContent(() => {
                    if (this.currentFile) {
                        this.fileSystem.updateFile(this.currentFile, this.editor.getValue());
                        this.updateFileSize();
                    }
                });

                resolve();
            });
        });
    }

    setupEventListeners() {
        // Menu button
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // New file
        document.getElementById('newFileBtn').addEventListener('click', () => {
            this.createNewFile();
        });

        // Run button
        document.getElementById('runBtn').addEventListener('click', () => {
            this.togglePreview();
        });

        // Close preview
        document.getElementById('closePreview').addEventListener('click', () => {
            this.hidePreview();
        });

        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveCurrentFile();
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.toggleSettings();
        });
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.toggleSettings();
        });
        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Settings changes
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            monaco.editor.setTheme(e.target.value);
            this.saveSettings();
        });
        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.editor.updateOptions({ fontSize: parseInt(e.target.value) });
            this.saveSettings();
        });
        document.getElementById('tabSize').addEventListener('change', (e) => {
            this.editor.updateOptions({ tabSize: parseInt(e.target.value) });
            this.saveSettings();
        });
        document.getElementById('wordWrap').addEventListener('change', (e) => {
            this.editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
            this.saveSettings();
        });

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importFiles();
        });
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportProject();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCurrentFile();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewFile();
                        break;
                }
            }
        });
    }

    openFile(filename) {
        const file = this.fileSystem.files.get(filename);
        if (!file) return;

        this.currentFile = filename;
        
        // Update model
        const model = this.editor.getModel();
        if (model) {
            model.setValue(file.content);
            monaco.editor.setModelLanguage(model, file.language);
        }

        // Update UI
        document.getElementById('currentFile').textContent = filename;
        document.getElementById('languageMode').textContent = file.language.toUpperCase();
        this.updateFileSize();
        this.renderTabs();
        this.renderFileList();
        this.hidePreview();
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        const files = this.fileSystem.getAllFiles();
        files.sort((a, b) => a.name.localeCompare(b.name));

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = `file-item ${file.name === this.currentFile ? 'active' : ''}`;
            fileItem.innerHTML = `
                <span class="file-icon">${this.getFileIcon(file.name)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-actions">
                    <button class="icon-btn-small rename-btn" title="Rename">✎</button>
                    <button class="icon-btn-small delete-btn" title="Delete">🗑</button>
                </span>
            `;

            fileItem.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) {
                    this.openFile(file.name);
                }
            });

            fileItem.querySelector('.rename-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameFile(file.name);
            });

            fileItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFile(file.name);
            });

            fileList.appendChild(fileItem);
        });

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    renderTabs() {
        const tabBar = document.getElementById('tabBar');
        tabBar.innerHTML = '';

        this.openTabs.forEach(filename => {
            const tab = document.createElement('div');
            tab.className = `tab ${filename === this.currentFile ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-name">${filename}</span>
                <span class="tab-close">×</span>
            `;

            tab.addEventListener('click', () => {
                this.openFile(filename);
            });

            tab.querySelector('.tab-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(filename);
            });

            tabBar.appendChild(tab);
        });
    }

    closeTab(filename) {
        this.openTabs.delete(filename);
        if (this.currentFile === filename) {
            const remaining = Array.from(this.openTabs);
            if (remaining.length > 0) {
                this.openFile(remaining[0]);
            }
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
        } catch (e) {
            alert(e.message);
        }
    }

    renameFile(oldName) {
        const newName = prompt('Enter new name:', oldName);
        if (!newName || newName === oldName) return;

        try {
            this.fileSystem.renameFile(oldName, newName);
            if (this.currentFile === oldName) {
                this.openFile(newName);
            }
            this.renderFileList();
            this.renderTabs();
        } catch (e) {
            alert(e.message);
        }
    }

    deleteFile(filename) {
        if (!confirm(`Delete ${filename}?`)) return;

        this.fileSystem.deleteFile(filename);
        this.closeTab(filename);
        this.renderFileList();
    }

    saveCurrentFile() {
        if (this.currentFile) {
            const content = this.editor.getValue();
            this.fileSystem.updateFile(this.currentFile, content);
            
            // Show brief feedback
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = '✓';
            setTimeout(() => {
                saveBtn.textContent = '💾';
            }, 1000);
        }
    }

    togglePreview() {
        const preview = document.getElementById('preview');
        const editor = document.getElementById('editor');
        
        if (preview.style.display === 'none') {
            this.showPreview();
        } else {
            this.hidePreview();
        }
    }

    showPreview() {
        const preview = document.getElementById('preview');
        const editor = document.getElementById('editor');
        const frame = document.getElementById('previewFrame');
        
        // Generate preview content
        const htmlContent = this.generatePreviewContent();
        
        frame.srcdoc = htmlContent;
        preview.style.display = 'block';
        editor.style.display = 'none';
    }

    hidePreview() {
        document.getElementById('preview').style.display = 'none';
        document.getElementById('editor').style.display = 'block';
    }

    generatePreviewContent() {
        const files = this.fileSystem.files;
        let html = files.get('index.html')?.content || '';
        let css = files.get('style.css')?.content || '';
        let js = files.get('script.js')?.content || '';

        // Inject CSS
        if (css) {
            html = html.replace('</head>', `<style>${css}</style></head>`);
        }

        // Inject JS
        if (js) {
            html = html.replace('</body>', `<script>${js}</script></body>`);
        }

        return html;
    }

    toggleSettings() {
        document.getElementById('settingsModal').classList.toggle('active');
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('faraz-editor-settings') || '{}');
        
        if (settings.theme) {
            document.getElementById('themeSelect').value = settings.theme;
            monaco.editor.setTheme(settings.theme);
        }
        if (settings.fontSize) {
            document.getElementById('fontSize').value = settings.fontSize;
            this.editor.updateOptions({ fontSize: settings.fontSize });
        }
        if (settings.tabSize) {
            document.getElementById('tabSize').value = settings.tabSize;
            this.editor.updateOptions({ tabSize: settings.tabSize });
        }
        if (settings.wordWrap !== undefined) {
            document.getElementById('wordWrap').checked = settings.wordWrap;
            this.editor.updateOptions({ wordWrap: settings.wordWrap ? 'on' : 'off' });
        }
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect').value,
            fontSize: parseInt(document.getElementById('fontSize').value),
            tabSize: parseInt(document.getElementById('tabSize').value),
            wordWrap: document.getElementById('wordWrap').checked
        };
        localStorage.setItem('faraz-editor-settings', JSON.stringify(settings));
    }

    resetSettings() {
        const defaults = {
            theme: 'vs-dark',
            fontSize: 14,
            tabSize: 2,
            wordWrap: true
        };
        localStorage.setItem('faraz-editor-settings', JSON.stringify(defaults));
        this.loadSettings();
    }

    importFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.html,.css,.js,.json,.xml,.md,.txt,.py,.php,.sql';
        
        input.onchange = async (e) => {
            const files = e.target.files;
            for (let file of files) {
                const content = await file.text();
                try {
                    this.fileSystem.createFile(file.name, content);
                } catch (e) {
                    // File exists, update it
                    this.fileSystem.updateFile(file.name, content);
                }
            }
            this.renderFileList();
            if (files.length > 0) {
                this.openFile(files[0].name);
            }
        };
        
        input.click();
    }

    exportProject() {
        const files = this.fileSystem.getAllFiles();
        files.forEach(file => {
            const blob = new Blob([file.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'html': '🌐',
            'htm': '🌐',
            'css': '🎨',
            'js': '📜',
            'json': '📋',
            'xml': '📰',
            'md': '📝',
            'py': '🐍',
            'php': '🐘',
            'sql': '🗄'
        };
        return icons[ext] || '📄';
    }

    updateFileSize() {
        if (this.currentFile && this.editor) {
            const size = new Blob([this.editor.getValue()]).size;
            document.getElementById('fileSize').textContent = this.formatBytes(size);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const fileSystem = new FileSystem();
    const editorManager = new EditorManager(fileSystem);
    
    // Handle window resize for responsive layout
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });

    // Handle back button to close sidebar on mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            e.target !== menuBtn) {
            sidebar.classList.remove('open');
        }
    });
});
