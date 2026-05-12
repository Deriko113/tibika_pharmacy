// Cart Page - Fixed Version
const CartPage = {
    async render(container) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Please Login</h2>
                    <p>You need to be logged in to view your cart.</p>
                    <a href="/login" data-link class="btn btn-primary">Login Now</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <h1>Shopping Cart</h1>
                <div id="cart-loading" class="loading-spinner">Loading your cart...</div>
                <div id="cart-content" style="display: none;"></div>
            </div>
        `;
        
        await this.loadCart();
    },
    
    async loadCart() {
        const loadingDiv = document.getElementById('cart-loading');
        const contentDiv = document.getElementById('cart-content');
        const token = localStorage.getItem('token');
        
        if (!token) {
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = '<div class="alert alert-warning">Please login to view your cart</div>';
            return;
        }
        
        try {
            // Try multiple possible API URLs
            let apiUrl = '/api/cart';
            
            // If using Live Server on different port, use full URL
            // if (window.location.port === '5500') {
            //     apiUrl = '/api/cart';
            // }
            
            console.log('Fetching cart from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            // Check if response is OK
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
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
            console.log('Cart data:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load cart');
            }
            
            const cart = data.data;
            
            if (!cart.items || cart.items.length === 0) {
                loadingDiv.style.display = 'none';
                contentDiv.style.display = 'block';
                contentDiv.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: white; border-radius: 8px;">
                        <h3>Your cart is empty</h3>
                        <p>Add some medications to your cart to get started.</p>
                        <a href="/medications" data-link class="btn btn-primary">Browse Medications</a>
                    </div>
                `;
                return;
            }
            
            // Render cart
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = this.renderCartHTML(cart);
            
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
                    <small>Make sure:
                        <ul>
                            <li>Backend is running on port 5000</li>
                            <li>You are logged in</li>
                            <li>Network connection is working</li>
                        </ul>
                    </small>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 10px;">Retry</button>
                </div>
            `;
        }
    },
    
    renderCartHTML(cart) {
        const itemsHTML = cart.items.map(item => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            const itemTotal = price * quantity;
            
            return `
                <div class="cart-item" data-cart-id="${item.cart_id}" data-medication-id="${item.medication_id}">
                    <div class="cart-item-image">
                        <img src="${item.image_url || 'https://via.placeholder.com/80'}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="cart-item-info">
                        <h4>${this.escapeHtml(item.name)}</h4>
                        <p class="price">KES ${price.toFixed(2)} each</p>
                        ${item.requires_prescription ? '<span class="prescription-badge">⚠️ Prescription Required</span>' : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn qty-minus">-</button>
                        <span class="qty-value">${quantity}</span>
                        <button class="qty-btn qty-plus">+</button>
                    </div>
                    <div class="cart-item-total">
                        <strong>KES ${itemTotal.toFixed(2)}</strong>
                    </div>
                    <div class="cart-item-remove">
                        <button class="remove-item">🗑️ Remove</button>
                    </div>
                </div>
            `;
        }).join('');
        
        const subtotal = parseFloat(cart.subtotal) || 0;
        const tax = parseFloat(cart.tax) || 0;
        const deliveryFee = parseFloat(cart.delivery_fee) || 0;
        const total = parseFloat(cart.total) || 0;
        
        return `
            <div class="cart-grid" style="display: grid; grid-template-columns: 1fr 350px; gap: 2rem;">
                <div class="cart-items">
                    <div class="cart-header" style="display: grid; grid-template-columns: 100px 1fr 120px 120px 50px; gap: 1rem; padding: 1rem; background: #f5f5f5; font-weight: bold;">
                        <div>Product</div>
                        <div>Details</div>
                        <div>Quantity</div>
                        <div>Total</div>
                        <div></div>
                    </div>
                    ${itemsHTML}
                </div>
                <div class="cart-summary" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 20px;">
                    <h3>Order Summary</h3>
                    <div class="summary-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <span>Subtotal:</span>
                        <span>KES ${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <span>Tax (16% VAT):</span>
                        <span>KES ${tax.toFixed(2)}</span>
                    </div>
                    <div class="summary-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <span>Delivery Fee:</span>
                        <span>KES ${deliveryFee.toFixed(2)}</span>
                    </div>
                    <div class="summary-row total" style="display: flex; justify-content: space-between; padding: 1rem 0; font-size: 1.2rem; font-weight: bold; border-top: 2px solid #eee; margin-top: 0.5rem;">
                        <span>Total:</span>
                        <span>KES ${total.toFixed(2)}</span>
                    </div>
                    <button id="checkoutBtn" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Proceed to Checkout</button>
                    <button id="clearCartBtn" class="btn btn-outline" style="width: 100%; margin-top: 0.5rem;">Clear Cart</button>
                </div>
            </div>
        `;
    },
    
    attachEvents() {
        const token = localStorage.getItem('token');
        let apiUrl = '/api/cart';
        if (window.location.port === '5500') {
            apiUrl = '/api/cart';
        }
        
        // Quantity minus buttons
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartItem = btn.closest('.cart-item');
                const cartId = cartItem.dataset.cartId;
                const qtySpan = cartItem.querySelector('.qty-value');
                let qty = parseInt(qtySpan.textContent);
                
                if (qty > 1) {
                    qty--;
                    qtySpan.textContent = qty;
                    
                    await fetch(`${apiUrl}/${cartId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ quantity: qty })
                    });
                    
                    await this.loadCart();
                    if (typeof App !== 'undefined' && App.updateCartCount) {
                        App.updateCartCount();
                    }
                }
            });
        });
        
        // Quantity plus buttons
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartItem = btn.closest('.cart-item');
                const cartId = cartItem.dataset.cartId;
                const qtySpan = cartItem.querySelector('.qty-value');
                let qty = parseInt(qtySpan.textContent);
                
                qty++;
                qtySpan.textContent = qty;
                
                await fetch(`${apiUrl}/${cartId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ quantity: qty })
                });
                
                await this.loadCart();
                if (typeof App !== 'undefined' && App.updateCartCount) {
                    App.updateCartCount();
                }
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartItem = btn.closest('.cart-item');
                const cartId = cartItem.dataset.cartId;
                
                if (confirm('Remove this item from your cart?')) {
                    await fetch(`${apiUrl}/${cartId}`, {
                        method: 'DELETE',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    await this.loadCart();
                    if (typeof App !== 'undefined' && App.updateCartCount) {
                        App.updateCartCount();
                    }
                }
            });
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (typeof router !== 'undefined') {
                    router.navigateTo('/checkout');
                } else {
                    window.location.href = '/checkout';
                }
            });
        }
        
        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear your entire cart?')) {
                    await fetch(apiUrl, {
                        method: 'DELETE',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    await this.loadCart();
                    if (typeof App !== 'undefined' && App.updateCartCount) {
                        App.updateCartCount();
                    }
                }
            });
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
    window.CartPage = CartPage;
}