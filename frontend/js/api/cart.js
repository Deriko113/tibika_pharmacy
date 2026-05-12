// Cart API Service
(function() {
    'use strict';
    
    window.CartAPI = {
        // Get user's cart
        async getCart() {
            const token = localStorage.getItem('token');
            if (!token) {
                return { 
                    success: true, 
                    data: { 
                        items: [], 
                        subtotal: 0, 
                        tax: 0, 
                        delivery_fee: 0, 
                        total: 0 
                    } 
                };
            }
            
            try {
                const response = await fetch('/api/cart', {
                    method: 'GET',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to load cart');
                return data;
            } catch (error) {
                console.error('Get cart error:', error);
                return { 
                    success: false, 
                    message: error.message, 
                    data: { 
                        items: [], 
                        subtotal: 0, 
                        tax: 0, 
                        delivery_fee: 0, 
                        total: 0 
                    } 
                };
            }
        },
        
        // Add item to cart
        async addToCart(medicationId, quantity = 1) {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to add items to cart');
            }
            
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ medication_id: medicationId, quantity })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        },
        
        // Update cart item quantity
        async updateCartItem(cartId, quantity) {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        },
        
        // Remove item from cart
        async removeFromCart(cartId) {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        },
        
        // Clear entire cart
        async clearCart() {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        }
    };
    
    console.log('CartAPI loaded successfully:', window.CartAPI);
})();