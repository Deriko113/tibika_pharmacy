// Admin Dashboard Page
const AdminPage = {
    async render(container) {
        // Check if user is admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role !== 'admin') {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view this page.</p>
                    <a href="/" data-link class="btn btn-primary">Go Home</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <h1>Admin Dashboard</h1>
                
                <div class="admin-tabs" style="display: flex; gap: 1rem; margin: 2rem 0; border-bottom: 1px solid #ddd;">
                    <button class="tab-btn active" data-tab="pending">Pending Orders</button>
                    <button class="tab-btn" data-tab="all">All Orders</button>
                    <button class="tab-btn" data-tab="stats">Statistics</button>
                </div>
                
                <div id="admin-content">
                    <div class="loading-spinner">Loading...</div>
                </div>
            </div>
        `;
        
        // Add tab styles
        const style = document.createElement('style');
        style.textContent = `
            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s;
            }
            .tab-btn.active {
                border-bottom: 3px solid #2c7da0;
                color: #2c7da0;
                font-weight: bold;
            }
            .order-card {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .order-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #eee;
            }
            .order-status {
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
            .order-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin: 1rem 0;
            }
            .order-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            .btn-sm {
                padding: 5px 12px;
                font-size: 0.85rem;
            }
            .stat-card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #2c7da0;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
        `;
        document.head.appendChild(style);
        
        // Setup tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                if (tab === 'pending') this.loadPendingOrders();
                else if (tab === 'all') this.loadAllOrders();
                else if (tab === 'stats') this.loadStats();
            });
        });
        
        // Load initial tab
        await this.loadPendingOrders();
    },
    
    async loadPendingOrders() {
        const container = document.getElementById('admin-content');
        const token = localStorage.getItem('token');
        
        try {
            let apiUrl = '/api/orders/admin/pending';
            if (window.location.port === '5500') {
                apiUrl = '/api/orders/admin/pending';
            }
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const orders = data.data;
            
            if (orders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <h3>No Pending Orders</h3>
                        <p>All orders have been processed.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <h2>Pending Orders (${orders.length})</h2>
                ${orders.map(order => this.renderOrderCard(order)).join('')}
            `;
            
            this.attachOrderEvents();
            
        } catch (error) {
            console.error('Load pending orders error:', error);
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },
    
    async loadAllOrders() {
        const container = document.getElementById('admin-content');
        const token = localStorage.getItem('token');
        
        try {
            let apiUrl = '/api/orders/admin/all';
            if (window.location.port === '5500') {
                apiUrl = '/api/orders/admin/all';
            }
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const orders = data.data;
            
            if (orders.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem;"><h3>No Orders Found</h3></div>';
                return;
            }
            
            container.innerHTML = `
                <h2>All Orders (${orders.length})</h2>
                ${orders.map(order => this.renderOrderCard(order)).join('')}
            `;
            
            this.attachOrderEvents();
            
        } catch (error) {
            console.error('Load all orders error:', error);
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },
    
    async loadStats() {
        const container = document.getElementById('admin-content');
        const token = localStorage.getItem('token');
        
        try {
            let apiUrl = '/api/orders/admin/stats';
            if (window.location.port === '5500') {
                apiUrl = '/api/orders/admin/stats';
            }
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const stats = data.data;
            
            container.innerHTML = `
                <h2>Order Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.total_orders || 0}</div>
                        <div>Total Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.pending_orders || 0}</div>
                        <div>Pending</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.processing_orders || 0}</div>
                        <div>Processing</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.shipped_orders || 0}</div>
                        <div>Shipped</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.delivered_orders || 0}</div>
                        <div>Delivered</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">KES ${(stats.total_revenue || 0).toLocaleString()}</div>
                        <div>Total Revenue</div>
                    </div>
                </div>
                
                <h3 style="margin-top: 2rem;">Recent Orders</h3>
                ${stats.recent_orders?.map(order => this.renderOrderCard(order)).join('') || '<p>No recent orders</p>'}
            `;
            
            this.attachOrderEvents();
            
        } catch (error) {
            console.error('Load stats error:', error);
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },
    
    renderOrderCard(order) {
        const statusClass = this.getStatusClass(order.status);
        const orderDate = new Date(order.created_at).toLocaleString();
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <strong>Order #${order.order_number}</strong>
                        <br>
                        <small>${orderDate}</small>
                    </div>
                    <div>
                        <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="order-details">
                    <div>
                        <strong>Customer:</strong><br>
                        ${order.user_name || 'N/A'}<br>
                        ${order.user_email || ''}
                    </div>
                    <div>
                        <strong>Total:</strong><br>
                        KES ${parseFloat(order.total).toLocaleString()}
                    </div>
                    <div>
                        <strong>Payment:</strong><br>
                        ${order.payment_method || 'N/A'}
                    </div>
                </div>
                
                <div class="order-actions">
                    <select class="status-select form-control" style="width: auto;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="btn btn-primary btn-sm update-status">Update</button>
                    <button class="btn btn-outline btn-sm view-details">View Details</button>
                </div>
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
    
    attachOrderEvents() {
        // Update status buttons
        document.querySelectorAll('.update-status').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderCard = btn.closest('.order-card');
                const orderId = orderCard.dataset.orderId;
                const statusSelect = orderCard.querySelector('.status-select');
                const newStatus = statusSelect.value;
                
                await this.updateOrderStatus(orderId, newStatus);
            });
        });
        
        // View details buttons
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderCard = btn.closest('.order-card');
                const orderId = orderCard.dataset.orderId;
                await this.viewOrderDetails(orderId);
            });
        });
    },
    
    async updateOrderStatus(orderId, status) {
        const token = localStorage.getItem('token');
        
        try {
            let apiUrl = `/api/orders/${orderId}/status`;
            if (window.location.port === '5500') {
                apiUrl = `/api/orders/${orderId}/status`;
            }
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Order status updated successfully!');
                // Reload current tab
                const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                if (activeTab === 'pending') this.loadPendingOrders();
                else if (activeTab === 'all') this.loadAllOrders();
                else if (activeTab === 'stats') this.loadStats();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Update status error:', error);
            alert('Failed to update status: ' + error.message);
        }
    },
    
    async viewOrderDetails(orderId) {
        const token = localStorage.getItem('token');
        
        try {
            let apiUrl = `/api/orders/${orderId}`;
            if (window.location.port === '5500') {
                apiUrl = `/api/orders/${orderId}`;
            }
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const order = data.data;
                const items = order.items || [];
                
                let itemsHtml = '<h4>Order Items</h4><ul>';
                items.forEach(item => {
                    itemsHtml += `<li>${item.medication_name} x ${item.quantity} - KES ${parseFloat(item.price).toLocaleString()}</li>`;
                });
                itemsHtml += '</ul>';
                
                alert(`Order Details:\n\nOrder #: ${order.order_number}\nTotal: KES ${parseFloat(order.total).toLocaleString()}\nStatus: ${order.status}\n\n${items.map(i => `${i.medication_name} x ${i.quantity} = KES ${parseFloat(i.price).toLocaleString()}`).join('\n')}`);
            }
        } catch (error) {
            console.error('View details error:', error);
            alert('Failed to load order details');
        }
    }
};