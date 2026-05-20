/**
 * AIDE PAGE - Professional JavaScript
 * Handles category switching and FAQ accordion functionality
 */

class AideManager {
    constructor() {
        this.init();
    }

    init() {
        // Use event delegation for better reliability
        this.attachDelegatedListeners();
        this.preventDragAndDrop();
    }

    /**
     * Attach delegated event listeners (works even if elements don't exist yet)
     */
    attachDelegatedListeners() {
        // Category button clicks
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-btn');
            if (btn) {
                e.preventDefault();
                const category = btn.dataset.category;
                this.switchCategory(category, btn);
            }
        });

        // FAQ header clicks
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.faq-header');
            if (header) {
                e.preventDefault();
                this.toggleFAQ(header);
            }
        });

        // Image toggle buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.show-image-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleImage(btn);
            }
        });
    }

    /**
     * Switch active category and content
     */
    switchCategory(categoryId, clickedBtn) {
        // Remove active class from all buttons
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        
        // Remove active class from all content sections
        document.querySelectorAll('.category-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
        
        // Add active class to matching content section
        const contentSection = document.querySelector(`.category-content[data-category="${categoryId}"]`);
        if (contentSection) {
            contentSection.classList.add('active');
        }
    }

    /**
     * Toggle FAQ item open/closed
     */
    toggleFAQ(header) {
        const faqItem = header.closest('.faq-item');
        if (!faqItem) return;
        
        const faqList = faqItem.closest('.faq-list');
        
        // Close other FAQ items in the same list
        if (faqList) {
            faqList.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem && item.classList.contains('active')) {
                    item.classList.remove('active');
                }
            });
        }
        
        // Toggle current FAQ item
        faqItem.classList.toggle('active');
    }

    /**
     * Toggle image/guide visibility
     */
    toggleImage(button) {
        const container = button.closest('.faq-image-container');
        if (!container) return;
        
        const toggleType = button.dataset.toggle;
        let targetElement = null;
        
        if (toggleType === 'image') {
            targetElement = container.querySelector('.faq-image');
        } else if (toggleType === 'guide') {
            targetElement = container.querySelector('.faq-image-guide');
        }
        
        if (!targetElement) return;
        
        const isHidden = targetElement.style.display === 'none';
        targetElement.style.display = isHidden ? 'block' : 'none';
    }

    /**
     * Prevent drag and drop
     */
    preventDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }
}

// Initialize immediately and also on DOMContentLoaded for safety
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AideManager();
    });
} else {
    new AideManager();
}
