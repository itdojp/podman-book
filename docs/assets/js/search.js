/**
 * Simple Search Functionality
 * Provides basic search capability for book content
 */

class BookSearch {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.navigationItems = [];
        this.init();
    }

    init() {
        if (!this.searchInput || !this.searchResults) return;
        
        this.collectNavigationItems();
        this.setupEventListeners();
    }

    collectNavigationItems() {
        // Collect all navigation links for search
        const navLinks = document.querySelectorAll('.toc-link, .toc-sublink');
        this.navigationItems = Array.from(navLinks).map(link => ({
            title: link.textContent.trim(),
            url: link.href,
            element: link
        }));
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            this.searchResults.style.display = 'block';
        });

        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.style.display = 'none';
            }
        });
    }

    handleSearch(query) {
        if (!query || query.length < 2) {
            this.searchResults.innerHTML = '';
            this.searchResults.style.display = 'none';
            return;
        }

        const results = this.navigationItems.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        );

        this.displayResults(results, query);
    }

    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">検索結果が見つかりません</div>';
            this.searchResults.style.display = 'block';
            return;
        }

        const html = results.slice(0, 8).map(result => {
            const highlightedTitle = this.highlightText(result.title, query);
            return `<a href="${result.url}" class="search-result-item">${highlightedTitle}</a>`;
        }).join('');

        this.searchResults.innerHTML = html;
        this.searchResults.style.display = 'block';
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bookSearch = new BookSearch();
    });
} else {
    window.bookSearch = new BookSearch();
}