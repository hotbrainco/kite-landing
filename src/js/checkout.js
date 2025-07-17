// src/js/checkout.js

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

  const card = elements.create('card', { style: style });
  card.mount('#card-element');

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
      document.getElementById('selected-plan-name').innerText = planName;
      document.getElementById('selected-plan-price').innerText = planPrice;
      document.getElementById('selected-plan-description').innerText = planDescription;
      
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

      const { token, error } = await stripe.createToken(card);

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
