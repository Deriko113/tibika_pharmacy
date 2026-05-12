// Checkout Page - Fixed Version
const CheckoutPage = {
    cartData: null,
    
    async render(container) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Please Login</h2>
                    <p>You need to be logged in to checkout.</p>
                    <a href="/login" data-link class="btn btn-primary">Login Now</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="max-width: 800px; margin: 2rem auto;">
                <h1>Checkout</h1>
                <div id="checkout-loading" class="loading-spinner">Loading your cart...</div>
                <div id="checkout-content" style="display: none;"></div>
            </div>
        `;
        
        await this.loadCart();
    },
    
    async loadCart() {
        const loadingDiv = document.getElementById('checkout-loading');
        const contentDiv = document.getElementById('checkout-content');
        const token = localStorage.getItem('token');
        
        if (!token) {
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = '<div class="alert alert-warning">Please login to continue</div>';
            return;
        }
        
        try {
            // Determine API URL based on port
            let apiUrl = '/api/cart';
            if (window.location.port === '5500') {
                apiUrl = '/api/cart';
            }
            
            console.log('Fetching cart from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    loadingDiv.style.display = 'none';
                    contentDiv.style.display = 'block';
                    contentDiv.innerHTML = `
                        <div class="alert alert-warning">
                            Your session has expired. Please <a href="/login" data-link>login again</a>.
                        </div>
                    `;
                    return;
                }
                throw new Error(`Server responded with ${response.status}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Server returned HTML instead of JSON. Make sure backend is running on port 5000');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load cart');
            }
            
            this.cartData = data.data;
            
            if (!this.cartData.items || this.cartData.items.length === 0) {
                loadingDiv.style.display = 'none';
                contentDiv.style.display = 'block';
                contentDiv.innerHTML = `
                    <div class="alert alert-warning">
                        Your cart is empty. <a href="/medications" data-link>Continue Shopping</a>
                    </div>
                `;
                return;
            }
            
            // Render checkout form
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = this.renderCheckoutForm();
            
            // Attach event listeners
            this.attachEvents();
            
        } catch (error) {
            console.error('Load cart error:', error);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error loading cart:</strong> ${error.message}
                    <br><br>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    },
    
    renderCheckoutForm() {
        const cart = this.cartData;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        const subtotal = parseFloat(cart.subtotal) || 0;
        const tax = parseFloat(cart.tax) || 0;
        const deliveryFee = parseFloat(cart.delivery_fee) || 200;
        const total = parseFloat(cart.total) || (subtotal + tax + deliveryFee);
        
        return `
            <form id="checkoutForm">
                <div style="display: grid; grid-template-columns: 1fr 350px; gap: 2rem;">
                    <!-- Shipping Information -->
                    <div>
                        <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h3>Shipping Information</h3>
                            
                            <div class="form-group">
                                <label for="street">Street/Area *</label>
                                <input type="text" id="street" class="form-control" value="${user.street || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="estate">Estate/Neighborhood</label>
                                <input type="text" id="estate" class="form-control" value="${user.estate || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="city">City/Town *</label>
                                <input type="text" id="city" class="form-control" value="${user.city || 'Nairobi'}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="county">County *</label>
                                <select id="county" class="form-control" required>
                                    <option value="">Select County</option>
                                    <option value="Nairobi" ${user.county === 'Nairobi' ? 'selected' : ''}>Nairobi</option>
                                    <option value="Mombasa">Mombasa</option>
                                    <option value="Kisumu">Kisumu</option>
                                    <option value="Nakuru">Nakuru</option>
                                    <option value="Kiambu">Kiambu</option>
                                    <option value="Machakos">Machakos</option>
                                    <option value="Kajiado">Kajiado</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone">Phone Number *</label>
                                <input type="tel" id="phone" class="form-control" value="${user.phone || ''}" placeholder="0712345678" required>
                            </div>
                        </div>
                        
                        <!-- Payment Method -->
                        <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 1rem;">
                            <h3>Payment Method</h3>
                            
                            <div class="form-group">
                                <select id="payment_method" class="form-control" required>
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="cash_on_delivery">Cash on Delivery</option>
                                </select>
                            </div>
                            
                            <div id="mpesa_details" style="display: block;">
                                <div class="form-group">
                                    <label for="mpesa_number">M-Pesa Number</label>
                                    <input type="tel" id="mpesa_number" class="form-control" placeholder="0712345678">
                                    <small>You will receive a prompt on your phone to complete payment</small>
                                </div>
                            </div>
                            
                            <div id="card_details" style="display: none;">
                                <div class="form-group">
                                    <label for="card_number">Card Number</label>
                                    <input type="text" id="card_number" class="form-control" placeholder="1234 5678 9012 3456">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label for="expiry">Expiry Date</label>
                                        <input type="text" id="expiry" class="form-control" placeholder="MM/YY">
                                    </div>
                                    <div class="form-group">
                                        <label for="cvv">CVV</label>
                                        <input type="text" id="cvv" class="form-control" placeholder="123">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Summary -->
                    <div>
                        <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 20px;">
                            <h3>Order Summary</h3>
                            
                            ${cart.items.map(item => `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>${this.escapeHtml(item.name)} x ${item.quantity}</span>
                                    <span>KES ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                                </div>
                            `).join('')}
                            
                            <hr style="margin: 1rem 0;">
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Subtotal:</span>
                                <span>KES ${subtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Tax (16% VAT):</span>
                                <span>KES ${tax.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Delivery Fee:</span>
                                <span>KES ${deliveryFee.toFixed(2)}</span>
                            </div>
                            
                            <hr style="margin: 1rem 0;">
                            
                            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                                <span>Total:</span>
                                <span>KES ${total.toFixed(2)}</span>
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem;">
                                Place Order
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        `;
    },
    
    attachEvents() {
        // Payment method toggle
        const paymentMethod = document.getElementById('payment_method');
        const mpesaDetails = document.getElementById('mpesa_details');
        const cardDetails = document.getElementById('card_details');
        
        if (paymentMethod) {
            paymentMethod.addEventListener('change', () => {
                if (paymentMethod.value === 'mpesa') {
                    mpesaDetails.style.display = 'block';
                    cardDetails.style.display = 'none';
                } else if (paymentMethod.value === 'card') {
                    mpesaDetails.style.display = 'none';
                    cardDetails.style.display = 'block';
                } else {
                    mpesaDetails.style.display = 'none';
                    cardDetails.style.display = 'none';
                }
            });
        }
        
        // Form submission
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.placeOrder();
            });
        }
    },
    
    async placeOrder() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Please login to place order');
            router.navigateTo('/login');
            return;
        }
        
        // Get form values
        const street = document.getElementById('street')?.value;
        const estate = document.getElementById('estate')?.value;
        const city = document.getElementById('city')?.value;
        const county = document.getElementById('county')?.value;
        const phone = document.getElementById('phone')?.value;
        const payment_method = document.getElementById('payment_method')?.value;
        const mpesa_number = document.getElementById('mpesa_number')?.value;
        
        // Validate
        if (!street || !city || !county || !phone) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Validate phone number
        const phoneRegex = /^(07|01)[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid Kenyan phone number (e.g., 0712345678)');
            return;
        }
        
        if (payment_method === 'mpesa' && !phoneRegex.test(mpesa_number)) {
            alert('Please enter a valid M-Pesa number');
            return;
        }
        
        const orderData = {
            payment_method: payment_method,
            shipping_address: {
                street: street,
                estate: estate,
                city: city,
                county: county,
                phone: phone
            }
        };
        
        if (payment_method === 'mpesa') {
            orderData.mpesa_number = mpesa_number;
        }
        
        // Get API URL
        let apiUrl = '/api/orders';
        if (window.location.port === '5500') {
            apiUrl = '/api/orders';
        }
        
        const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Placing Order...';
            
            console.log('Placing order to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Server error. Make sure backend is running on port 5000');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to place order');
            }
            
            alert('Order placed successfully!');
            
            // Clear cart from UI
            if (typeof App !== 'undefined' && App.updateCartCount) {
                await App.updateCartCount();
            }
            
            // Redirect to home or orders page
            setTimeout(() => {
                if (typeof router !== 'undefined') {
                    router.navigateTo('/');
                } else {
                    window.location.href = '/';
                }
            }, 2000);
            
        } catch (error) {
            console.error('Place order error:', error);
            alert('Failed to place order: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.CheckoutPage = CheckoutPage;
}