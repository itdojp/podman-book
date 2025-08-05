/**
 * Search Functionality
 * Provides real-time search across book content with highlighting and keyboard navigation
 */

class SearchManager {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.searchData = [];
        this.isLoading = false;
        this.currentResultIndex = -1;
        this.searchTimeout = null;
        
        // Search configuration constants
        this.SEARCH_CONFIG = {
            MIN_SEARCH_LENGTH: 1,
            DEBOUNCE_DELAY: 150,
            MAX_RESULTS: 10,
            MIN_PARAGRAPH_LENGTH: 20,
            CONTENT_PREVIEW_LENGTH: 150,
            TITLE_PREVIEW_LENGTH: 50
        };
        
        // Scoring constants
        this.SCORES = {
            TITLE_START_MATCH: 20,
            TITLE_EXACT_MATCH: 10,
            TITLE_PARTIAL_MATCH: 7,
            CONTENT_MATCH: 3,
            CONTENT_START_BONUS: 2,
            TYPE_CHAPTER: 5,
            TYPE_HEADING: 3,
            TYPE_KEYWORD: 4,
            TYPE_DEFAULT: 1
        };
        
        // Localization strings
        this.i18n = {
            noResults: document.documentElement.lang === 'ja' ? 
                '「{query}」の検索結果はありません' : 
                'No results found for "{query}"',
            chapter: document.documentElement.lang === 'ja' ? '章' : 'Chapter',
            section: document.documentElement.lang === 'ja' ? '節' : 'Section'
        };
        
        this.init();
    }

    async init() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        
        if (!this.searchInput || !this.searchResults) {
            return;
        }

        await this.loadSearchData();
        this.setupEventListeners();
    }

    async loadSearchData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Get base URL for the site
            const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
            
            // Try to load search data from a JSON file (if available)
            try {
                const response = await fetch(`${baseUrl}search-data.json`);
                if (response.ok) {
                    this.searchData = await response.json();
                    return;
                }
            } catch (e) {
                // Fall back to extracting from current page content
            }
            
            // Fallback: Create search data from navigation
            this.createSearchDataFromNavigation();
            
        } catch (error) {
            console.warn('Failed to load search data:', error);
            this.createSearchDataFromNavigation();
        } finally {
            this.isLoading = false;
        }
    }

    createSearchDataFromNavigation() {
        // Extract searchable content from sidebar navigation
        const navLinks = document.querySelectorAll('.toc-link, .toc-sublink');
        const searchData = [];
        
        navLinks.forEach(link => {
            const title = link.textContent.trim();
            const url = link.getAttribute('href');
            
            if (title && url) {
                searchData.push({
                    title: title,
                    url: url,
                    content: title, // Use title as content for basic search
                    type: link.classList.contains('toc-sublink') ? 'subsection' : 'chapter'
                });
            }
        });

        // Also extract content from current page if available
        this.addCurrentPageContent(searchData);
        
        // Add common search terms for competitive programming
        this.addCommonTerms(searchData);
        
        this.searchData = searchData;
        this.debugLog('Search data loaded:', this.searchData.length, 'items');
    }

    addCurrentPageContent(searchData) {
        // Extract content from the main page content
        const pageContent = document.querySelector('.page-content, .book-content, main');
        if (pageContent) {
            // Extract headings and their content
            const headings = pageContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                const headingText = heading.textContent.trim();
                const nextElement = heading.nextElementSibling;
                let contentText = headingText;
                
                // Try to get some content after the heading
                if (nextElement && nextElement.tagName === 'P') {
                    contentText += ' ' + nextElement.textContent.substring(0, this.SEARCH_CONFIG.CONTENT_PREVIEW_LENGTH);
                }
                
                searchData.push({
                    title: headingText,
                    url: window.location.pathname + '#' + (heading.id || ''),
                    content: contentText,
                    type: 'heading'
                });
            });

            // Extract paragraphs for full-text search
            const paragraphs = pageContent.querySelectorAll('p');
            paragraphs.forEach((p, index) => {
                const text = p.textContent.trim();
                if (text.length > this.SEARCH_CONFIG.MIN_PARAGRAPH_LENGTH) {
                    searchData.push({
                        title: text.substring(0, this.SEARCH_CONFIG.TITLE_PREVIEW_LENGTH) + 
                               (text.length > this.SEARCH_CONFIG.TITLE_PREVIEW_LENGTH ? '...' : ''),
                        url: window.location.pathname,
                        content: text,
                        type: 'content'
                    });
                }
            });
        }
    }

    addCommonTerms(searchData) {
        // Add common competitive programming terms
        const commonTerms = [
            {
                title: 'Python',
                url: '/src/chapter-programming-environment/',
                content: 'Python プログラミング言語 環境設定 インストール',
                type: 'keyword'
            },
            {
                title: 'AtCoder',
                url: '/src/chapter-contest-participation/',
                content: 'AtCoder 競技プログラミング コンテスト 参加',
                type: 'keyword'
            },
            {
                title: 'アルゴリズム',
                url: '/src/chapter-basic-algorithms/',
                content: 'アルゴリズム 基本 データ構造 計算量',
                type: 'keyword'
            },
            {
                title: 'デバッグ',
                url: '/src/chapter-debugging/',
                content: 'デバッグ エラー 修正 テスト',
                type: 'keyword'
            },
            {
                title: '入出力',
                url: '/src/chapter-input-output/',
                content: '入力 出力 標準入力 print input',
                type: 'keyword'
            }
        ];
        
        searchData.push(...commonTerms);
    }

    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.handleSearchInput(query);
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Focus management
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showResults();
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
                this.searchInput.blur();
            }
        });
    }

    handleSearchInput(query) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, this.SEARCH_CONFIG.DEBOUNCE_DELAY);
    }

    performSearch(query) {
        if (!query || query.length < this.SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
            this.hideResults();
            return;
        }

        const results = this.searchInData(query);
        this.displayResults(results, query);
    }

    searchInData(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        this.searchData.forEach(item => {
            const titleLower = item.title.toLowerCase();
            const contentLower = item.content ? item.content.toLowerCase() : '';
            
            const titleMatch = titleLower.includes(lowerQuery);
            const contentMatch = contentLower.includes(lowerQuery);
            
            // Also try partial matching for Japanese
            const titleWords = titleLower.split(/[\s　]+/);
            const queryWords = lowerQuery.split(/[\s　]+/);
            const partialTitleMatch = queryWords.some(qWord => 
                titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
            );
            
            if (titleMatch || contentMatch || partialTitleMatch) {
                // Calculate relevance score
                let score = 0;
                
                // Exact title start match (highest priority)
                if (titleLower.startsWith(lowerQuery)) {
                    score += this.SCORES.TITLE_START_MATCH;
                }
                // Exact title match
                else if (titleMatch) {
                    score += this.SCORES.TITLE_EXACT_MATCH;
                }
                // Partial title match
                else if (partialTitleMatch) {
                    score += this.SCORES.TITLE_PARTIAL_MATCH;
                }
                
                // Content match bonus
                if (contentMatch) {
                    score += this.SCORES.CONTENT_MATCH;
                    // Bonus for content that starts with query
                    if (contentLower.startsWith(lowerQuery)) {
                        score += this.SCORES.CONTENT_START_BONUS;
                    }
                }
                
                // Type-based scoring
                switch (item.type) {
                    case 'chapter':
                        score += this.SCORES.TYPE_CHAPTER;
                        break;
                    case 'heading':
                        score += this.SCORES.TYPE_HEADING;
                        break;
                    case 'keyword':
                        score += this.SCORES.TYPE_KEYWORD;
                        break;
                    default:
                        score += this.SCORES.TYPE_DEFAULT;
                }

                results.push({
                    ...item,
                    score: score,
                    highlightedTitle: this.highlightText(item.title, query),
                    highlightedContent: item.content ? this.highlightText(item.content.substring(0, this.SEARCH_CONFIG.CONTENT_PREVIEW_LENGTH), query) : null
                });
            }
        });

        // Sort by relevance score and then alphabetically
        return results.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.title.localeCompare(b.title);
        }).slice(0, this.SEARCH_CONFIG.MAX_RESULTS);
    }

    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegex(string) {
        // Escape special regex characters for safe string matching
        const specialChars = /[.*+?^${}()|[\]\\]/g;
        return string.replace(specialChars, '\\$&');
    }

    displayResults(results, query) {
        this.debugLog('Displaying search results:', results.length, 'for query:', query);
        
        if (!results.length) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    ${this.i18n.noResults.replace('{query}', this.escapeHtml(query))}
                    <div style="font-size: 0.75rem; margin-top: 0.5rem; color: var(--text-muted);">
                        検索対象: ${this.searchData.length}項目
                    </div>
                </div>
            `;
            this.showResults();
            return;
        }

        const resultHtml = results.map((result, index) => `
            <a href="${result.url}" 
               class="search-result-item" 
               data-index="${index}"
               onclick="this.closest('.search-container').querySelector('.search-input').blur()">
                <div class="search-result-title">${result.highlightedTitle}</div>
                ${result.highlightedContent && result.highlightedContent !== result.highlightedTitle ? 
                    `<div class="search-result-content">${result.highlightedContent}...</div>` : ''}
                <div class="search-result-type">${result.type === 'chapter' ? this.i18n.chapter : this.i18n.section}</div>
            </a>
        `).join('');

        this.searchResults.innerHTML = resultHtml;
        this.currentResultIndex = -1;
        this.showResults();
    }

    showResults() {
        this.searchResults.style.display = 'block';
    }

    hideResults() {
        this.searchResults.style.display = 'none';
        this.currentResultIndex = -1;
        this.clearHighlight();
    }

    handleKeyboardNavigation(e) {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        if (!resultItems.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentResultIndex = Math.min(this.currentResultIndex + 1, resultItems.length - 1);
                this.highlightResult();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.currentResultIndex = Math.max(this.currentResultIndex - 1, -1);
                this.highlightResult();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.currentResultIndex >= 0 && resultItems[this.currentResultIndex]) {
                    resultItems[this.currentResultIndex].click();
                }
                break;
        }
    }

    highlightResult() {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        // Clear previous highlights
        this.clearHighlight();
        
        // Highlight current result
        if (this.currentResultIndex >= 0 && resultItems[this.currentResultIndex]) {
            resultItems[this.currentResultIndex].classList.add('search-highlighted');
            resultItems[this.currentResultIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    clearHighlight() {
        const highlighted = this.searchResults.querySelectorAll('.search-highlighted');
        highlighted.forEach(item => item.classList.remove('search-highlighted'));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debugLog(...args) {
        // Only log in development mode (when console is available and hostname is localhost)
        if (typeof console !== 'undefined' && console.log && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('[SearchManager]', ...args);
        }
    }

    // Public API
    clear() {
        this.searchInput.value = '';
        this.hideResults();
    }

    focus() {
        this.searchInput.focus();
    }
}

// Load search CSS if not already present
if (!document.querySelector('link[href*="search.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = document.querySelector('link[href*="main.css"]')?.href.replace('main.css', 'search.css') || 
                '/assets/css/search.css';
    document.head.appendChild(link);
}

// Initialize search manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchManager = new SearchManager();
    });
} else {
    window.searchManager = new SearchManager();
}

// Add keyboard shortcut (Ctrl+K or Cmd+K) to focus search
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (window.searchManager) {
            window.searchManager.focus();
        }
    }
});