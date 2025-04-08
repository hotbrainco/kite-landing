document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('.header');
    let isMobileMenuOpen = false;

    // Check if viewport width changes and reset mobile menu if needed
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            resetMobileMenu();
        }
    });

    // Function to reset mobile menu state
    function resetMobileMenu() {
        menuToggle?.classList.remove('active');
        navLinks?.classList.remove('active');
        document.body.classList.remove('menu-open');
        isMobileMenuOpen = false;
        if (navLinks) navLinks.style.display = '';
    }

    menuToggle?.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        isMobileMenuOpen = !isMobileMenuOpen;
        
        // Ensure nav links are visible when toggling
        navLinks.style.display = isMobileMenuOpen ? 'flex' : '';
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) { // Only for mobile view
                resetMobileMenu();
                
                // Add a small delay before scrolling to ensure menu is closed
                setTimeout(() => {
                    const targetId = link.getAttribute('href');
                    if (targetId && targetId.startsWith('#')) {
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }, 100);
            }
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && isMobileMenuOpen) { // Only for mobile view
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                resetMobileMenu();
            }
        }
    });

    // Prevent menu from closing when clicking inside nav links
    navLinks.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Add animation to pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = card.classList.contains('featured') ? 'scale(1.05)' : 'none';
        });
    });

    /**
     * Pricing Toggle Functionality
     * ---------------------------
     * This section handles the monthly/annual pricing toggle and price updates.
     * 
     * How to update prices:
     * 1. In the HTML, each pricing card has two data attributes:
     *    - data-monthly-price: The monthly price (e.g., "49")
     *    - data-annual-price: The annual price (e.g., "39") 
     *      This is the monthly equivalent when paying annually (annual price ÷ 12)
     * 
     * 2. To change prices, simply update these attributes in the HTML.
     *    Example:
     *    <div class="pricing-card" data-monthly-price="49" data-annual-price="39">
     * 
     * 3. For custom/contact us pricing, use "custom" as the value:
     *    <div class="pricing-card" data-monthly-price="custom" data-annual-price="custom">
     * 
     * The script will automatically:
     * - Update prices when the toggle changes
     * - Format numbers correctly
     * - Handle custom pricing text
     * - Always display "/month" regardless of billing period
     */

    // Initialize pricing toggle
    const initPricingToggle = () => {
        const toggle = document.getElementById('pricingToggle');
        if (!toggle) return;

        const updatePrices = (isAnnual) => {
            const cards = document.querySelectorAll('.pricing-card');
            const period = isAnnual ? 'annual' : 'monthly';
            // Always show /month regardless of billing period
            const periodText = '/month';

            cards.forEach(card => {
                const price = card.dataset[`${period}Price`];
                const priceElement = card.querySelector('.price .amount');
                const periodElement = card.querySelector('.price span:last-child');
                
                if (!priceElement) return;

                // Handle custom pricing
                /* if (price === 'custom') {
                    priceElement.textContent = 'Custom';
                    if (periodElement) periodElement.style.display = 'none';
                    return; */
                }

                // Update price and period
                priceElement.textContent = price;
                if (periodElement) {
                    periodElement.textContent = periodText;
                    periodElement.style.display = 'inline';
                }
            });
        };

        // Initial price update
        updatePrices(toggle.checked);

        // Handle toggle changes
        toggle.addEventListener('change', (e) => {
            updatePrices(e.target.checked);
        });
    };

    /**
     * Accordion Functionality
     * ----------------------
     * This section handles the accordion behavior for the FAQ section.
     * 
     * Features:
     * - Smooth open/close animations with cubic-bezier timing
     * - Rainbow gradient background effect on active items
     * - Chevron rotation animation
     * - Keyboard accessibility
     */
    const initAccordions = () => {
        const accordionItems = document.querySelectorAll('.accordion-item');
        
        if (!accordionItems.length) return;
        
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            
            if (!header) return;
            
            // Add click event to toggle accordion
            header.addEventListener('click', () => {
                // Check if this accordion is already open
                const isActive = item.classList.contains('active');
                
                // Optional: Close all other accordions (comment out for multiple open)
                // accordionItems.forEach(otherItem => {
                //     if (otherItem !== item) {
                //         otherItem.classList.remove('active');
                //     }
                // });
                
                // Toggle the active class
                item.classList.toggle('active');
                
                // Add rainbow pulse effect on open
                if (!isActive) {
                    const icon = item.querySelector('.accordion-icon');
                    if (icon) {
                        icon.style.color = 'var(--accent3)';
                        setTimeout(() => {
                            icon.style.color = 'var(--primary)';
                        }, 300);
                    }
                }
            });
            
            // Add keyboard accessibility
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
            
            // Make header focusable
            header.setAttribute('tabindex', '0');
        });
    };

    initPricingToggle();
    initAccordions();

    // Initialize Lucide icons
    lucide.createIcons();
});
