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
  const formError = document.getElementById('card-errors');

  const openCheckoutButtons = document.querySelectorAll('.open-checkout');

  openCheckoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = button.dataset.plan;
      planInput.value = plan;
      // You can update the panel to show which plan is selected
      document.getElementById('selected-plan').innerText = plan === 'annual' ? 'Annual Plan' : 'Monthly Plan';
      checkoutPanel.classList.add('open');
    });
  });

  if (closeCheckout) {
    closeCheckout.addEventListener('click', () => {
      checkoutPanel.classList.remove('open');
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
        // Send token and plan to your server
        const response = await fetch('/.netlify/functions/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: token.id, plan: planInput.value }),
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
