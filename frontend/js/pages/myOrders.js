// Patient Orders Page - View order history
const MyOrdersPage = {
    async render(container) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check if user is logged in
        if (!token) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Please Login</h2>
                    <p>You need to be logged in to view your orders.</p>
                    <a href="/login" data-link class="btn btn-primary">Login Now</a>
                </div>
            `;
            return;
        }
        
        // Only patients should see this page
        if (user.role !== 'patient') {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Access Denied</h2>
                    <p>This page is for patients only.</p>
                    <a href="/" data-link class="btn btn-primary">Go Home</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <h1>My Orders</h1>
                <p>View your order history and track your deliveries.</p>
                
                <div style="display: flex; gap: 1rem; margin: 2rem 0; flex-wrap: wrap;">
                    <button id="filter-all" class="order-filter-btn active">All Orders</button>
                    <button id="filter-pending" class="order-filter-btn">Pending</button>
                    <button id="filter-processing" class="order-filter-btn">Processing</button>
                    <button id="filter-shipped" class="order-filter-btn">Shipped</button>
                    <button id="filter-delivered" class="order-filter-btn">Delivered</button>
                </div>
                
                <div id="orders-container">
                    <div class="loading-spinner">Loading your orders...</div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .order-filter-btn {
                padding: 8px 16px;
                background: #f0f0f0;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .order-filter-btn.active {
                background: #2c7da0;
                color: white;
            }
            .order-filter-btn:hover {
                background: #61a5c2;
                color: white;
            }
            .order-card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .order-status {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: bold;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-processing { background: #cfe2ff; color: #084298; }
            .status-shipped { background: #cff4fc; color: #055160; }
            .status-delivered { background: #d1e7dd; color: #0f5132; }
            .status-cancelled { background: #f8d7da; color: #721c24; }
            .order-items {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #eee;
            }
            .order-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f5f5f5;
            }
            .tracking-info {
                margin-top: 1rem;
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 5px;
            }
        `;
        document.head.appendChild(style);
        
        // Setup filter buttons
        document.getElementById('filter-all').addEventListener('click', () => this.loadOrders('all'));
        document.getElementById('filter-pending').addEventListener('click', () => this.loadOrders('pending'));
        document.getElementById('filter-processing').addEventListener('click', () => this.loadOrders('processing'));
        document.getElementById('filter-shipped').addEventListener('click', () => this.loadOrders('shipped'));
        document.getElementById('filter-delivered').addEventListener('click', () => this.loadOrders('delivered'));
        
        // Load all orders by default
        await this.loadOrders('all');
    },
    
    async loadOrders(status) {
        const container = document.getElementById('orders-container');
        const token = localStorage.getItem('token');
        
        // Update active filter button
        document.querySelectorAll('.order-filter-btn').forEach(btn => btn.classList.remove('active'));
        if (status === 'all') document.getElementById('filter-all').classList.add('active');
        else if (status === 'pending') document.getElementById('filter-pending').classList.add('active');
        else if (status === 'processing') document.getElementById('filter-processing').classList.add('active');
        else if (status === 'shipped') document.getElementById('filter-shipped').classList.add('active');
        else if (status === 'delivered') document.getElementById('filter-delivered').classList.add('active');
        
        try {
            let apiUrl = '/api/orders/my';
            if (window.location.port === '5500') {
                apiUrl = '/api/orders/my';
            }
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            let orders = data.data;
            
            // Filter orders by status if not 'all'
            if (status !== 'all') {
                orders = orders.filter(order => order.status === status);
            }
            
            if (orders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: white; border-radius: 8px;">
                        <h3>No orders found</h3>
                        <p>You haven't placed any orders yet.</p>
                        <a href="/medications" data-link class="btn btn-primary">Start Shopping</a>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = orders.map(order => this.renderOrderCard(order)).join('');
            
        } catch (error) {
            console.error('Load orders error:', error);
            container.innerHTML = `<div class="alert alert-danger">Error loading orders: ${error.message}</div>`;
        }
    },
    
    renderOrderCard(order) {
        const statusClass = this.getStatusClass(order.status);
        const orderDate = new Date(order.created_at).toLocaleString();
        const items = order.items || [];
        
        return `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3>Order #${order.order_number}</h3>
                        <p><strong>Date:</strong> ${orderDate}</p>
                        <p><strong>Total:</strong> <span style="font-size: 1.2rem; color: #2c7da0;">KES ${parseFloat(order.total).toLocaleString()}</span></p>
                        <p><strong>Payment:</strong> ${this.formatPaymentMethod(order.payment_method)}</p>
                    </div>
                    <div style="text-align: right;">
                        <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="order-items">
                    <strong>Items:</strong>
                    ${items.map(item => `
                        <div class="order-item">
                            <span>${item.medication_name} x ${item.quantity}</span>
                            <span>KES ${(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${order.tracking_number ? `
                    <div class="tracking-info">
                        <strong>Tracking Number:</strong> ${order.tracking_number}
                        ${order.estimated_delivery ? `<br><strong>Estimated Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString()}` : ''}
                    </div>
                ` : ''}
                
                ${order.status === 'pending' ? `
                    <div style="margin-top: 1rem; padding: 0.5rem; background: #fff3cd; border-radius: 5px;">
                        ⏳ Your order is pending confirmation. You will receive an update soon.
                    </div>
                ` : ''}
                
                ${order.status === 'shipped' ? `
                    <div style="margin-top: 1rem; padding: 0.5rem; background: #cff4fc; border-radius: 5px;">
                        🚚 Your order is on the way! Track your delivery using the tracking number above.
                    </div>
                ` : ''}
                
                ${order.status === 'delivered' ? `
                    <div style="margin-top: 1rem; padding: 0.5rem; background: #d1e7dd; border-radius: 5px;">
                        ✅ Order delivered! Thank you for shopping with Tibika Pharmacy.
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    getStatusClass(status) {
        const classes = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled'
        };
        return classes[status] || 'status-pending';
    },
    
    formatPaymentMethod(method) {
        const methods = {
            'mpesa': 'M-Pesa',
            'card': 'Credit/Debit Card',
            'cash_on_delivery': 'Cash on Delivery'
        };
        return methods[method] || method;
    }
};