/**
 * ACTIVE CHECKOUT IMPLEMENTATION
 * 
 * This file handles the custom slide-in checkout form on launch.njk
 * It processes payments through netlify/functions/process-payment.cjs
 * 
 * Last updated: July 2025
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if we have a valid Stripe key
  if (!window.STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE_KEY === "") {
    console.error("Stripe publishable key is missing or empty!");
    return; // Exit early to prevent errors
  }
  
  // Display test mode indicator if applicable
  if (window.STRIPE_TEST_MODE) {
    const testBanner = document.createElement('div');
    testBanner.style.background = '#f0ad4e';
    testBanner.style.color = 'black';
    testBanner.style.padding = '5px 10px';
    testBanner.style.textAlign = 'center';
    testBanner.style.fontWeight = 'bold';
    testBanner.textContent = '⚠️ TEST MODE - No real charges will be made ⚠️';
    
    // Add to the top of the checkout panel
    const checkoutPanel = document.querySelector('.checkout-panel');
    if (checkoutPanel) {
      checkoutPanel.insertBefore(testBanner, checkoutPanel.firstChild);
    }
  }
  
  const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY); // Use the global variable
  const elements = stripe.elements();

  const style = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  // Create card element with additional options to handle both US and Canadian postal codes
  const cardOptions = {
    style: style,
    hidePostalCode: false, // Show the postal code field
    zipCode: true, // Enable zip code validation
    iconStyle: 'solid',
  };

  const card = elements.create('card', cardOptions);
  card.mount('#card-element');

  // Listen for changes in the card element
  card.addEventListener('change', (event) => {
    if (event.error) {
      formError.textContent = event.error.message;
    } else {
      formError.textContent = '';
    }
    
    // Check if the event contains country info (when user selects a country)
    if (event.country) {
      console.log(`Country selected: ${event.country}`);
      // You could adjust UI based on country if needed
    }
  });

  const checkoutPanel = document.getElementById('checkout-panel');
  const closeCheckout = document.getElementById('close-checkout');
  const checkoutForm = document.getElementById('checkout-form');
  const planInput = document.getElementById('plan-input');
  const discountCodeInput = document.getElementById('discount-code-input');
  const discountCode = document.getElementById('discount-code');
  const applyDiscountButton = document.getElementById('apply-discount');
  const discountMessage = document.getElementById('discount-message');
  const formError = document.getElementById('card-errors');

  const openCheckoutButtons = document.querySelectorAll('.open-checkout');

  openCheckoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = button.dataset.plan;
      const planName = button.dataset.planName || (plan === 'annual' ? 'Annual Plan' : 'Monthly Plan');
      const planPrice = button.dataset.planPrice || '$XX/mo';
      const planDescription = button.dataset.planDescription || 'Kite website and communications platform';
      
      // Update the hidden input
      planInput.value = plan;
      
      // Update the displayed plan information
      document.getElementById('selected-plan-name').innerText = plan === 'annual' ? 'Kite Setup Fee' : planName;
      document.getElementById('selected-plan-price').innerText = planPrice;
      document.getElementById('selected-plan-description').innerText = planDescription;
      
      // For annual plan, fetch and show the promo code
      if (plan === 'annual') {
        // Show loading state
        document.getElementById('discount-message').textContent = 'Loading promotion...';
        document.getElementById('discount-message').style.color = '#28a745';
        document.querySelector('.discount').classList.remove('hidden');
        document.getElementById('discount-amount').innerText = 'Checking...';
        
        // Fetch the actual promo code from Stripe
        fetch('/.netlify/functions/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'getPromoCode',
            promoId: 'promo_1RkwoPFBc7hwldVN1kqmowdG',
            plan: 'annual'
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            document.getElementById('discount-message').textContent = 'Promotion available';
            document.getElementById('discount-amount').innerText = 'Promotional discount will be applied';
          } else {
            // Show the actual promo code name
            document.getElementById('discount-message').textContent = `Promo code "${data.code}" is automatically applied`;
            document.getElementById('discount-amount').innerText = data.percentOff > 0 ? 
              `${data.percentOff}% discount` : 
              `$${(data.amountOff/100).toFixed(2)} discount`;
          }
        })
        .catch(error => {
          console.error('Error fetching promo code:', error);
          document.getElementById('discount-message').textContent = 'Promotion available';
          document.getElementById('discount-amount').innerText = 'Promotional discount will be applied';
        });
      } else {
        document.getElementById('discount-message').textContent = '';
        document.querySelector('.discount').classList.add('hidden');
      }
      
      // Update the totals
      document.getElementById('subtotal-amount').innerText = planPrice;
      document.getElementById('total-amount').innerText = planPrice;
      
      // Open the checkout panel
      checkoutPanel.classList.add('open');
    });
  });

  if (closeCheckout) {
    closeCheckout.addEventListener('click', () => {
      checkoutPanel.classList.remove('open');
    });
  }
  
  // Handle discount code application
  if (applyDiscountButton) {
    applyDiscountButton.addEventListener('click', async () => {
      const code = discountCode.value.trim();
      if (!code) {
        discountMessage.textContent = 'Please enter a discount code';
        discountMessage.style.color = '#fa755a';
        return;
      }
      
      applyDiscountButton.disabled = true;
      applyDiscountButton.textContent = 'Checking...';
      
      try {
        // This would be a real API call to validate the discount code
        // For now, we'll simulate with a timeout
        setTimeout(() => {
          // Demo: Accept "LAUNCH" as a valid 20% discount
          if (code.toUpperCase() === 'LAUNCH') {
            const subtotalElement = document.getElementById('subtotal-amount');
            const subtotalText = subtotalElement.innerText;
            const subtotal = parseFloat(subtotalText.replace(/[^0-9.-]+/g, ''));
            
            if (!isNaN(subtotal)) {
              const discountAmount = subtotal * 0.2; // 20% discount
              const newTotal = subtotal - discountAmount;
              
              // Update discount display
              document.getElementById('discount-amount').innerText = 
                `-$${discountAmount.toFixed(2)}/mo`;
              document.getElementById('total-amount').innerText = 
                `$${newTotal.toFixed(2)}/mo`;
              
              // Show the discount row
              document.querySelector('.discount').classList.remove('hidden');
              
              // Update hidden input
              discountCodeInput.value = code;
              
              // Show success message
              discountMessage.textContent = 'Discount applied: 20% off';
              discountMessage.style.color = '#28a745';
            }
          } else {
            discountMessage.textContent = 'Invalid discount code';
            discountMessage.style.color = '#fa755a';
            discountCodeInput.value = '';
          }
          
          applyDiscountButton.disabled = false;
          applyDiscountButton.textContent = 'Apply';
        }, 1000);
      } catch (error) {
        discountMessage.textContent = 'Error checking discount code';
        discountMessage.style.color = '#fa755a';
        applyDiscountButton.disabled = false;
        applyDiscountButton.textContent = 'Apply';
      }
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = event.target.querySelector('button');
      submitButton.disabled = true;

      // Get customer information
      const customerName = document.getElementById('customer-name').value;
      const customerEmail = document.getElementById('customer-email').value;
      const customerPhone = document.getElementById('customer-phone').value;
      
      // Prepare billing details for Stripe
      const billingDetails = {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      };

      // Create token with billing details
      const { token, error } = await stripe.createToken(card, { 
        name: customerName, 
        // The card Element automatically collects postal code
      });

      if (error) {
        formError.textContent = error.message;
        submitButton.disabled = false;
      } else {
        formError.textContent = '';
        
        // Gather customer information
        const customerData = {
          name: document.getElementById('customer-name').value,
          churchName: document.getElementById('church-name').value,
          email: document.getElementById('customer-email').value,
          phone: document.getElementById('customer-phone').value,
          discountCode: discountCodeInput.value
        };
        
        // Send token, plan, and customer data to your server
        const response = await fetch('/.netlify/functions/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token: token.id, 
            plan: planInput.value,
            customer: customerData
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Handle successful payment
          alert('Payment successful!');
          checkoutPanel.classList.remove('open');
          // maybe redirect to a thank you page
          // window.location.href = '/thank-you';
        } else {
          // Handle payment failure
          formError.textContent = result.error || 'An unknown error occurred.';
        }
        submitButton.disabled = false;
      }
    });
  }
});
