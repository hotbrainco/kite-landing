// Apply theme immediately to avoid incorrect style flash
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Changed from 'dark' to 'light'
    document.documentElement.classList.toggle('light-theme', savedTheme === 'light');
    document.body.classList.toggle('light-theme', savedTheme === 'light');
})();

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

    // Function to open the menu
    const openMobileMenu = () => {
        menuToggle?.classList.add('active');
        navLinks?.classList.add('active');
        document.body.classList.add('menu-open');
        isMobileMenuOpen = true;
    };
    
    // Function to close the menu
    const closeMobileMenu = () => {
        menuToggle?.classList.remove('active');
        navLinks?.classList.remove('active');
        document.body.classList.remove('menu-open');
        isMobileMenuOpen = false;
    };
    
    // Listener for hamburger menu button
    menuToggle?.addEventListener('click', function(e) {
        e.stopPropagation();
        openMobileMenu();
    });
    
    // Listener for the close button
    const closeMenuBtn = document.querySelector('.close-menu-btn');
    closeMenuBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        closeMobileMenu();
    });
    
    // Close the menu when clicking an internal link
    const mobileMenuLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
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
            const href = this.getAttribute('href');
            
            // Ignore links that are just "#" or empty
            if (!href || href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
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
            const periodText = isAnnual ? '/year' : '/month'; // Update period text dynamically

            cards.forEach(card => {
                const price = card.dataset[`${period}Price`];
                const priceElement = card.querySelector('.price .amount');
                const periodElement = card.querySelector('.price span:last-child');
                
                if (!priceElement) return;

                // Handle custom pricing
                if (price === 'custom') {
                    priceElement.textContent = 'Custom';
                    if (periodElement) periodElement.style.display = 'none';
                    return;
                }

                // Update price and period
                priceElement.textContent = price;
                if (periodElement) {
                    periodElement.textContent = periodText; // Update period text
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
    /**
     * Theme Toggle Functionality
     * ---------------------------
     * This section handles the light/dark theme toggle and theme persistence.
     * 
     * Features:
     * - Toggle between light and dark themes
     * - Saves theme preference to localStorage
     * - Automatically loads saved theme preference
     */
    const initThemeToggle = () => {
        const toggle = document.getElementById('themeToggle');
        const toggleMobile = document.getElementById('themeToggleMobile');
        
        if (!toggle && !toggleMobile) return;
        
        // Check for saved theme preference or use default (light)
        const savedTheme = localStorage.getItem('theme') || 'light'; // Changed from 'dark' to 'light'
        
        // Clean up previous classes to ensure consistent state
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        document.body.classList.remove('light-theme', 'dark-theme');
        
        // Apply the correct theme
        const theme = savedTheme === 'light' ? 'light' : 'dark';
        document.documentElement.classList.add(`${theme}-theme`);
        document.body.classList.add(`${theme}-theme`);
        
        // Update toggle states to match current theme (light = checked)
        if (toggle) toggle.checked = savedTheme === 'light';
        if (toggleMobile) toggleMobile.checked = savedTheme === 'light';
        
        // Function to switch the theme
        const toggleTheme = (isLightTheme) => {
            const newTheme = isLightTheme ? 'light' : 'dark';
            
            // Clean up previous classes to avoid inconsistent states
            document.documentElement.classList.remove('light-theme', 'dark-theme');
            document.body.classList.remove('light-theme', 'dark-theme');
            
            // Apply the correct theme throughout the document
            document.documentElement.classList.add(`${newTheme}-theme`);
            document.body.classList.add(`${newTheme}-theme`);
            
            // Synchronize the two toggles
            if (toggle) toggle.checked = isLightTheme;
            if (toggleMobile) toggleMobile.checked = isLightTheme;
            
            // Save theme preference
            localStorage.setItem('theme', newTheme);
        };
        
        // Toggle theme when main switch is clicked
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                toggleTheme(e.target.checked);
            });
        }
        
        // Toggle theme when mobile switch is clicked
        if (toggleMobile) {
            toggleMobile.addEventListener('change', (e) => {
                toggleTheme(e.target.checked);
            });
        }
        
        // Handle theme toggle via icon click
        const themeIcons = document.querySelectorAll('.theme-toggle .toggle-icon');
        themeIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                // Determine which toggle to use based on context
                const activeToggle = icon.closest('.mobile-bottom-menu') ? toggleMobile : toggle;
                if (!activeToggle) return;
                
                // Toggle the switch and trigger change event
                activeToggle.checked = !activeToggle.checked;
                const event = new Event('change');
                activeToggle.dispatchEvent(event);
            });
        });
    };

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

    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Reapply theme after page load to ensure consistency
    const savedTheme = localStorage.getItem('theme') || 'light'; // Changed from 'dark' to 'light'
    document.documentElement.classList.toggle('light-theme', savedTheme === 'light');
    document.body.classList.toggle('light-theme', savedTheme === 'light');
});
