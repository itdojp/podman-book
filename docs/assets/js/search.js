/**
 * Search Functionality
 * Provides real-time search through navigation items
 */

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.searchItems = [];
        this.isSearching = false;
        
        this.init();
    }

    init() {
        if (!this.searchInput || !this.searchResults) {
            return;
        }

        this.buildSearchIndex();
        this.setupEventListeners();
    }

    buildSearchIndex() {
        // Get all navigation links from sidebar
        const navLinks = document.querySelectorAll('.book-sidebar .toc-link, .book-sidebar .nav-link');
        
        navLinks.forEach(link => {
            const title = link.textContent.trim();
            const href = link.getAttribute('href');
            
            if (title && href && href !== '#') {
                this.searchItems.push({
                    title: title,
                    href: href,
                    element: link
                });
            }
        });
    }

    setupEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showResults();
            }
        });

        this.searchInput.addEventListener('blur', () => {
            // Delay hiding to allow clicking on results
            setTimeout(() => {
                this.hideResults();
            }, 200);
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    handleSearch(query) {
        query = query.trim().toLowerCase();
        
        if (query.length < 1) {
            this.hideResults();
            return;
        }

        const results = this.searchItems.filter(item => 
            item.title.toLowerCase().includes(query)
        );

        this.displayResults(results, query);
    }

    displayResults(results, query) {
        this.searchResults.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-no-results';
            noResults.textContent = '検索結果が見つかりません';
            this.searchResults.appendChild(noResults);
        } else {
            results.slice(0, 10).forEach(result => { // Limit to 10 results
                const item = document.createElement('a');
                item.className = 'search-result-item';
                item.href = result.href;
                
                // Highlight search term
                const highlightedTitle = this.highlightText(result.title, query);
                item.innerHTML = highlightedTitle;
                
                item.addEventListener('click', () => {
                    this.hideResults();
                    this.searchInput.blur();
                });
                
                this.searchResults.appendChild(item);
            });
        }

        this.showResults();
    }

    highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showResults() {
        this.searchResults.style.display = 'block';
        this.isSearching = true;
    }

    hideResults() {
        this.searchResults.style.display = 'none';
        this.isSearching = false;
    }

    handleKeydown(e) {
        if (!this.isSearching) return;

        const items = this.searchResults.querySelectorAll('.search-result-item');
        const currentIndex = Array.from(items).findIndex(item => 
            item.classList.contains('search-highlighted')
        );

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightNextResult(items, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightPrevResult(items, currentIndex);
                break;
            case 'Enter':
                e.preventDefault();
                this.selectHighlightedResult(items, currentIndex);
                break;
            case 'Escape':
                this.hideResults();
                this.searchInput.blur();
                break;
        }
    }

    highlightNextResult(items, currentIndex) {
        if (items.length === 0) return;

        // Remove current highlight
        if (currentIndex >= 0) {
            items[currentIndex].classList.remove('search-highlighted');
        }

        // Add highlight to next item
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].classList.add('search-highlighted');
    }

    highlightPrevResult(items, currentIndex) {
        if (items.length === 0) return;

        // Remove current highlight
        if (currentIndex >= 0) {
            items[currentIndex].classList.remove('search-highlighted');
        }

        // Add highlight to previous item
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].classList.add('search-highlighted');
    }

    selectHighlightedResult(items, currentIndex) {
        if (currentIndex >= 0 && items[currentIndex]) {
            items[currentIndex].click();
        }
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchManager = new SearchManager();
    });
} else {
    window.searchManager = new SearchManager();
}