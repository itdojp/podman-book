// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.book-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebarToggle && sidebar && overlay) {
        // Toggle sidebar
        sidebarToggle.addEventListener('click', function() {
            const isOpen = sidebar.classList.contains('sidebar-open');
            
            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', function() {
            closeSidebar();
        });
        
        // Close sidebar on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('sidebar-open')) {
                closeSidebar();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
    }
    
    function openSidebar() {
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('overlay-visible');
        sidebarToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSidebar() {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('overlay-visible');
        sidebarToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
});