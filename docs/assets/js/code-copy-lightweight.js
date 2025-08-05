/**
 * Lightweight Code Copy Functionality
 * Adds copy buttons to code blocks without MutationObserver
 */

function initCodeCopy() {
    // Add copy buttons to all pre elements
    const preElements = document.querySelectorAll('pre');
    
    preElements.forEach((pre, index) => {
        // Skip if copy button already exists
        if (pre.querySelector('.copy-button')) return;
        
        // Create copy button
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        button.title = 'コードをコピー';
        
        // Position the button
        pre.style.position = 'relative';
        button.style.position = 'absolute';
        button.style.top = '0.5rem';
        button.style.right = '0.5rem';
        button.style.background = 'var(--color-bg-tertiary)';
        button.style.border = '1px solid var(--color-border)';
        button.style.borderRadius = '4px';
        button.style.padding = '0.25rem';
        button.style.cursor = 'pointer';
        button.style.opacity = '0';
        button.style.transition = 'opacity 0.2s ease';
        button.style.zIndex = '10';
        
        // Show button on hover
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        // Copy functionality
        button.addEventListener('click', async () => {
            const code = pre.querySelector('code') || pre;
            const text = code.textContent || code.innerText;
            
            try {
                await navigator.clipboard.writeText(text);
                
                // Show feedback
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                `;
                button.style.color = 'var(--color-success)';
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.style.color = '';
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy code:', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    textArea.remove();
                    
                    // Show feedback
                    const originalHTML = button.innerHTML;
                    button.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    `;
                    button.style.color = 'var(--color-success)';
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.style.color = '';
                    }, 2000);
                    
                } catch (fallbackErr) {
                    console.error('Fallback copy failed:', fallbackErr);
                    textArea.remove();
                }
            }
        });
        
        pre.appendChild(button);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeCopy);
} else {
    initCodeCopy();
}