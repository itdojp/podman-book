/**
 * Enhanced Theme Management with Backward Compatibility
 * Handles light/dark theme switching with system preference detection
 * Migrates from legacy 'theme' key to standardized 'book-theme' key
 */

class ThemeManager {
    constructor() {
        this.storageKey = 'book-theme';
        this.legacyKey = 'theme';
        this.init();
    }

    init() {
        this.migrateStorageKey();
        this.setupThemeToggle();
        this.setupSystemThemeListener();
        this.applyInitialTheme();
    }

    migrateStorageKey() {
        // Migrate from legacy 'theme' key to 'book-theme' key for consistency
        const legacyTheme = localStorage.getItem(this.legacyKey);
        const currentTheme = localStorage.getItem(this.storageKey);
        
        if (legacyTheme && !currentTheme) {
            localStorage.setItem(this.storageKey, legacyTheme);
            localStorage.removeItem(this.legacyKey);
        }
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupSystemThemeListener() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only update if user hasn't manually set a preference
                if (!localStorage.getItem(this.storageKey)) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    applyInitialTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme;
        if (savedTheme) {
            theme = savedTheme;
        } else if (systemPrefersDark) {
            theme = 'dark';
        } else {
            theme = 'light';
        }
        
        this.setTheme(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem(this.storageKey, newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggleIcon(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme } 
        }));
    }

    updateThemeToggleIcon(theme) {
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        
        if (lightIcon && darkIcon) {
            if (theme === 'light') {
                lightIcon.style.display = 'block';
                darkIcon.style.display = 'none';
            } else {
                lightIcon.style.display = 'none';
                darkIcon.style.display = 'block';
            }
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme');
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}