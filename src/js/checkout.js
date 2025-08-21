/**
 * ACTIVE CHECKOUT IMPLEMENTATION
 * * This file handles the custom slide-in checkout form on launch.njk
 * It processes payments through netlify/functions/process-payment.cjs
 * * Last updated: August 2025
 */

document.addEventListener('DOMContentLoaded', () => {
  const checkoutPanel = document.getElementById('checkout-panel');
  const openCheckoutButtons = document.querySelectorAll('.open-checkout');
  const closeCheckoutButton = document.getElementById('close-checkout');
  const planInput = document.getElementById('plan-input');
  const orderLineItems = document.getElementById('order-line-items');
  const planDescription = document.getElementById('selected-plan-description');
  const subtotalAmount = document.getElementById('subtotal-amount');
  const totalAmount = document.getElementById('total-amount');
  const discountSection = document.querySelector('.discount');
  const discountAmountEl = document.getElementById('discount-amount');
  const discountMessage = document.getElementById('discount-message');
  const form = document.getElementById('checkout-form');
  const checkoutContent = document.getElementById('checkout-content');
  const checkoutSuccess = document.getElementById('checkout-success');

  // Helper to format currency
  const formatCurrency = (amount, currency = 'usd', interval = null) => {
    const value = amount / 100;
    const options = { style: 'currency', currency };
    // show fractions for cents only if non-zero
    if (value % 1 !== 0) {
      options.minimumFractionDigits = 2;
    }
    const formatted = new Intl.NumberFormat('en-US', options).format(value);
    return interval ? `${formatted}/${interval}` : formatted;
  };

  // Renders the entire order summary based on data from the server
  const renderOrderSummary = (lineItems, promo) => {
    if (!lineItems || lineItems.length === 0) {
      orderLineItems.innerHTML = `<div class='product-name-price'><span>Product information unavailable</span><span></span></div>`;
      planDescription.innerText = 'Unable to fetch product details. Please try again later.';
      subtotalAmount.innerText = 'N/A';
      totalAmount.innerText = 'N/A';
      return;
    }

    let html = '';
    let subtotal = 0;
    let total = 0;
    const descriptions = [];

    lineItems.forEach(item => {
      subtotal += item.unitAmount;
      descriptions.push(item.description);

      let finalPrice = item.unitAmount;
      const originalPriceFormatted = formatCurrency(item.unitAmount, item.currency, item.interval);
      let priceHtml = `<span>${originalPriceFormatted}</span>`;

      // Only apply discount to recurring plan price (not setup fee)
      if (promo && promo.coupon && item.interval) {
        const coupon = promo.coupon;
        let originalPrice = item.unitAmount;
        if (coupon.percent_off) {
          finalPrice = originalPrice * (1 - coupon.percent_off / 100);
        } else if (coupon.amount_off) {
          finalPrice = Math.max(0, originalPrice - coupon.amount_off);
        }
        if (finalPrice < originalPrice) {
          const originalPriceNoInterval = formatCurrency(originalPrice, item.currency);
          const newPriceNoInterval = formatCurrency(finalPrice, item.currency);
          priceHtml = `<span><s>${originalPriceNoInterval}</s> <span class="discounted-price">${newPriceNoInterval}</span>/${item.interval}</span>`;
        }
      }

      total += finalPrice;
      html += `<div class="product-name-price"><span>${item.name}</span>${priceHtml}</div>`;
    });

    orderLineItems.innerHTML = html;
    planDescription.innerText = descriptions.filter(Boolean).join(' ');
    subtotalAmount.innerText = formatCurrency(subtotal);
    totalAmount.innerText = formatCurrency(total);

    if (promo && promo.coupon) {
      const discountApplied = subtotal - total;
      discountSection.classList.remove('hidden');
      // Format the discount value as a negative currency amount
      discountAmountEl.innerText = `-${formatCurrency(discountApplied)}`;

      const coupon = promo.coupon;
      // Build the new dynamic message
      const discountValue = `<strong>${coupon.percent_off}%</strong>`;
      let durationText = '';
      if (coupon.duration === 'once') {
        durationText = 'the first <strong>year</strong>'; // Assuming 'once' on an annual plan means first year
      } else if (coupon.duration === 'repeating' && coupon.duration_in_months) {
        durationText = `the first <strong>${coupon.duration_in_months} months</strong>`;
      }
      
      discountMessage.innerHTML = `Promo code <strong>${promo.code}</strong> (${discountValue} off ${durationText}) applied!`;
      discountMessage.classList.add('applied');
    } else {
      discountSection.classList.add('hidden');
      discountMessage.textContent = '';
      discountMessage.classList.remove('applied');
    }
  };

  // Set loading state for the checkout panel
  const setLoadingState = () => {
    orderLineItems.innerHTML = `<div class="product-name-price"><span>Loading...</span><span></span></div>`;
    planDescription.innerText = 'Fetching details...';
    subtotalAmount.innerText = '...';
    totalAmount.innerText = '...';
    discountMessage.textContent = '';
    discountSection.classList.add('hidden');
  };

  openCheckoutButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      checkoutPanel.classList.add('open');
      const plan = button.dataset.plan;
      planInput.value = plan;
      setLoadingState();

      try {
        // Fetch all price and promo info in one go from the server
        const response = await fetch('/.netlify/functions/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getPriceInfo', plan: plan }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch pricing information.');
        }
        
        const data = await response.json();
        renderOrderSummary(data.lineItems, data.promo);

      } catch (error) {
        console.error('Error fetching price information:', error);
        renderOrderSummary(null, null); // Render error state
      }
    });
  });

  // --- STRIPE ELEMENTS INITIALIZATION ---
  // This code sets up the credit card entry field.
  
  // Get the Stripe publishable key from the global scope (set in stripe-config.js)
  const stripe = Stripe(`${window.stripePublishableKey}`);
  // Initialize Stripe Elements (no unsupported wallets parameter)
  const elements = stripe.elements();
  const cardElement = elements.create('card', {
    style: {
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
    }
  });
  
  // Mount the card element to the div in your form
  cardElement.mount('#card-element');
  
  closeCheckoutButton.addEventListener('click', () => {
    checkoutPanel.classList.remove('open');

    // Use a timeout to reset the form after the panel is closed
    // to prevent a visual flash for the user.
    setTimeout(() => {
      checkoutContent.style.display = 'block';
      checkoutSuccess.style.display = 'none';
      
      const submitButton = form.querySelector('.submit-button');
      submitButton.disabled = false;
      submitButton.textContent = 'Complete Purchase';
      submitButton.classList.remove('success');
      form.reset();
      cardElement.clear();
      document.getElementById('card-errors').textContent = '';
    }, 500);
  });
  
  // Handle form submission
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Disable the button and show loading state
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    // Clear previous errors
    const cardErrors = document.getElementById('card-errors');
    cardErrors.textContent = '';

    // Get customer info from the form
    const customer = {
      name: document.getElementById('customer-name').value,
      churchName: document.getElementById('church-name').value,
      email: document.getElementById('customer-email').value,
      phone: document.getElementById('customer-phone').value
    };
    const plan = planInput.value;
    const discountCode = document.getElementById('discount-code-input').value;

    // Create Stripe token
    const { token, error } = await stripe.createToken(cardElement);
    if (error) {
      cardErrors.textContent = error.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Complete Purchase';
      return;
    }

    // Send payment request to Netlify function
    try {
      const response = await fetch('/.netlify/functions/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.id,
          plan,
          customer,
          discountCode
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment failed.');
      }

      // Show success message and hide the form content
      checkoutContent.style.display = 'none';
      checkoutSuccess.style.display = 'block';
      submitButton.textContent = 'Success!';
      submitButton.classList.add('success');
      cardErrors.textContent = '';
      // Display Charge ID as confirmation number
      if (result.chargeId) {
        const confirmationNumberEl = document.getElementById('confirmation-number');
        confirmationNumberEl.textContent = result.chargeId;
      }
      // Display customer email in the thank you message
      if (result.customerEmail) {
        const confirmationEmailEl = document.getElementById('confirmation-email');
        if (confirmationEmailEl) {
          confirmationEmailEl.textContent = result.customerEmail;
        }
      }
      // Show Stripe receipt download link
      if (result.receiptUrl) {
        const receiptLinkContainer = document.getElementById('receipt-link-container');
        const receiptLink = document.getElementById('receipt-link');
        const receiptNote = document.getElementById('receipt-note');
        if (receiptLink && receiptLinkContainer) {
          receiptLink.href = result.receiptUrl;
          receiptLinkContainer.style.display = 'block';
          if (receiptNote) {
            receiptNote.style.display = 'block';
          }
          // Always open receipt link in a new tab
          receiptLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(result.receiptUrl, '_blank', 'noopener');
          });
        }
      }
      
    } catch (err) {
      cardErrors.textContent = err.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Complete Purchase';
    }
  });
});