/**
 * Hamburger Menu Enhancement
 * Adds keyboard support and accessibility to CSS-only hamburger menu
 */

(function() {
    'use strict';

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const hamburgerButton = document.querySelector('.sidebar-toggle');
        const sidebarCheckbox = document.getElementById('sidebar-toggle-checkbox');
        const overlay = document.querySelector('.book-sidebar-overlay');

        if (!hamburgerButton || !sidebarCheckbox || !overlay) {
            return;
        }

        // Add keyboard support for hamburger button
        hamburgerButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sidebarCheckbox.checked = !sidebarCheckbox.checked;
                updateAriaExpanded();
            }
        });

        // Update ARIA attributes when checkbox state changes
        sidebarCheckbox.addEventListener('change', updateAriaExpanded);

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', function() {
            sidebarCheckbox.checked = false;
            updateAriaExpanded();
        });

        // Close sidebar with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebarCheckbox.checked) {
                sidebarCheckbox.checked = false;
                updateAriaExpanded();
                hamburgerButton.focus();
            }
        });

        // Close sidebar when clicking on sidebar links (mobile navigation)
        document.addEventListener('click', function(e) {
            if (e.target.matches('.book-sidebar .toc-link') && window.innerWidth <= 1024) {
                setTimeout(() => {
                    sidebarCheckbox.checked = false;
                    updateAriaExpanded();
                }, 150);
            }
        });

        // Initial ARIA state
        updateAriaExpanded();

        function updateAriaExpanded() {
            hamburgerButton.setAttribute('aria-expanded', sidebarCheckbox.checked);
        }
    }
})();