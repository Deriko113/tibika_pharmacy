// Dashboard for Pharmacist and Admin
const DashboardPage = {
    currentUser: null,
    isAdmin: false,

    async render(container) {
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        this.isAdmin = this.currentUser.role === 'admin';

        // Check if user is pharmacist or admin
        if (this.currentUser.role !== 'pharmacist' && !this.isAdmin) {
            container.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem;">
                    <h2>Access Denied</h2>
                    <p>Only pharmacists and administrators can access this page.</p>
                    <a href="/" data-link class="btn btn-primary">Go Home</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <h1>${this.isAdmin ? 'Admin' : 'Pharmacist'} Dashboard</h1>
                <p>Welcome, ${this.currentUser.name} (${this.currentUser.role})!</p>
                
                <div class="dashboard-tabs" style="display: flex; gap: 1rem; margin: 2rem 0; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; flex-wrap: wrap;">
                    <button class="tab-btn active" data-tab="prescriptions">📋 Prescriptions</button>
                    <button class="tab-btn" data-tab="pending-orders">🕐 Pending Orders</button>
                    <button class="tab-btn" data-tab="processing-orders">⚙️ Processing Orders</button>
                    <button class="tab-btn" data-tab="shipped-orders">🚚 Shipped Orders</button>
                    <button class="tab-btn" data-tab="all-orders">📦 All Orders</button>
                    <button class="tab-btn" data-tab="stats">📊 Statistics</button>
                    ${this.isAdmin ? `
                        <button class="tab-btn" data-tab="medications">💊 Medications</button>
                        <button class="tab-btn" data-tab="users">👥 Users</button>
                    ` : ''}
                </div>
                
                <div id="dashboard-content">
                    <div class="loading-spinner">Loading...</div>
                </div>
            </div>
        `;

        this.addStyles();
        this.attachTabEvents();
        
        // Load prescriptions by default
        await this.loadPrescriptions();
    },

    addStyles() {
        if (document.getElementById('dashboard-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s;
                border-radius: 5px;
            }
            .tab-btn:hover { background: #f0f0f0; }
            .tab-btn.active { background: #2c7da0; color: white; }
            
            .prescription-card, .order-card {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .prescription-header, .order-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #eee;
            }
            .status-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: bold;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-reviewing { background: #cfe2ff; color: #084298; }
            .status-approved { background: #d1e7dd; color: #0f5132; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            .status-processing { background: #cfe2ff; color: #084298; }
            .status-shipped { background: #cff4fc; color: #055160; }
            .status-delivered { background: #d1e7dd; color: #0f5132; }
            .prescription-actions, .order-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                flex-wrap: wrap;
            }
            .btn-sm { padding: 5px 12px; font-size: 0.85rem; }
            .prescription-image { max-width: 150px; max-height: 150px; border-radius: 5px; cursor: pointer; }
            .medication-list { margin-top: 0.5rem; padding-left: 1rem; }
            .filter-bar { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
            .stat-card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stat-number { font-size: 2rem; font-weight: bold; color: #2c7da0; }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
            th { background: #2c7da0; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .role-badge { padding: 4px 8px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
            .role-patient { background: #cfe2ff; color: #084298; }
            .role-pharmacist { background: #d1e7dd; color: #0f5132; }
            .role-admin { background: #f8d7da; color: #721c24; }
        `;
        document.head.appendChild(style);
    },

    attachTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                if (tab === 'prescriptions') await this.loadPrescriptions();
                else if (tab === 'pending-orders') await this.loadOrders('pending');
                else if (tab === 'processing-orders') await this.loadOrders('processing');
                else if (tab === 'shipped-orders') await this.loadOrders('shipped');
                else if (tab === 'all-orders') await this.loadOrders('all');
                else if (tab === 'stats') await this.loadStats();
                else if (tab === 'medications' && this.isAdmin) await this.loadMedications();
                else if (tab === 'users' && this.isAdmin) await this.loadUsers();
            });
        });
    },

    // ==================== PRESCRIPTIONS ====================
    async loadPrescriptions() {
        const container = document.getElementById('dashboard-content');
        const token = localStorage.getItem('token');

        try {
            let apiUrl = '/api/prescriptions/all';
            if (window.location.port === '5500') apiUrl = '/api/prescriptions/all';

            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();

            if (!data.success) throw new Error(data.message);

            const prescriptions = data.data;
            const pendingCount = prescriptions.filter(p => p.status === 'pending' || p.status === 'reviewing').length;

            container.innerHTML = `
                <h2>📋 Prescriptions (${pendingCount} pending)</h2>
                <div class="filter-bar">
                    <input type="text" id="prescription-search" placeholder="Search by patient..." class="form-control" style="width: 250px;">
                    <select id="prescription-status-filter" class="form-control">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div id="prescriptions-list">
                    ${prescriptions.map(p => this.renderPrescriptionCard(p)).join('')}
                </div>
            `;

            document.getElementById('prescription-search').addEventListener('input', () => this.filterPrescriptions());
            document.getElementById('prescription-status-filter').addEventListener('change', () => this.filterPrescriptions());
            this.attachPrescriptionEvents();

        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },

    renderPrescriptionCard(p) {
        const statusClass = this.getPrescriptionStatusClass(p.status);
        const date = new Date(p.created_at).toLocaleString();
        return `
            <div class="prescription-card" data-prescription-id="${p.id}" data-status="${p.status}">
                <div class="prescription-header">
                    <div>
                        <strong>Prescription #${p.id}</strong><br>
                        Patient: ${p.user_name || 'N/A'}<br>
                        Email: ${p.user_email || 'N/A'}<br>
                        Date: ${date}
                    </div>
                    <div><span class="status-badge ${statusClass}">${p.status.toUpperCase()}</span></div>
                </div>
                <div class="prescription-details" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${p.image_url ? `<div><strong>Image:</strong><br><a href="${p.image_url}" target="_blank"><img src="${p.image_url}" class="prescription-image"></a></div>` : ''}
                    <div>
                        <strong>Medications:</strong>
                        <div class="medication-list">
                            ${p.medications && p.medications.length ? p.medications.map(m => `<li>${m.medication_name} - ${m.dosage || ''} ${m.frequency || ''}</li>`).join('') : '<li>No medications extracted</li>'}
                        </div>
                    </div>
                </div>
                <div class="prescription-actions">
                    ${p.status === 'pending' || p.status === 'reviewing' ? `
                        <button class="btn btn-success btn-sm approve-prescription">✓ Approve</button>
                        <button class="btn btn-danger btn-sm reject-prescription">✗ Reject</button>
                        <button class="btn btn-outline btn-sm add-medications">+ Add Medications</button>
                    ` : ''}
                    ${p.pharmacist_notes ? `<div><strong>Notes:</strong> ${p.pharmacist_notes}</div>` : ''}
                    ${p.rejection_reason ? `<div><strong>Rejection:</strong> ${p.rejection_reason}</div>` : ''}
                </div>
            </div>
        `;
    },

    getPrescriptionStatusClass(status) {
        const map = { pending: 'status-pending', reviewing: 'status-reviewing', approved: 'status-approved', rejected: 'status-rejected' };
        return map[status] || 'status-pending';
    },

    filterPrescriptions() {
        const search = document.getElementById('prescription-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('prescription-status-filter')?.value || 'all';
        document.querySelectorAll('.prescription-card').forEach(card => {
            const status = card.dataset.status;
            const text = card.innerText.toLowerCase();
            const matchStatus = statusFilter === 'all' || status === statusFilter;
            const matchSearch = !search || text.includes(search);
            card.style.display = matchStatus && matchSearch ? 'block' : 'none';
        });
    },

    attachPrescriptionEvents() {
        document.querySelectorAll('.approve-prescription').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.closest('.prescription-card').dataset.prescriptionId;
                await this.reviewPrescription(id, 'approved', 'Prescription approved.');
            });
        });
        document.querySelectorAll('.reject-prescription').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reason = prompt('Rejection reason:');
                if (reason) {
                    const id = btn.closest('.prescription-card').dataset.prescriptionId;
                    await this.reviewPrescription(id, 'rejected', reason);
                }
            });
        });
        document.querySelectorAll('.add-medications').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.closest('.prescription-card').dataset.prescriptionId;
                const input = prompt('Enter medications (JSON array):\n[{"name":"Amoxicillin","dosage":"500mg","frequency":"Twice daily","duration":"7 days","quantity":14}]');
                if (input) {
                    try {
                        const meds = JSON.parse(input);
                        await this.reviewPrescription(id, 'reviewing', null, meds);
                    } catch (err) { alert('Invalid JSON'); }
                }
            });
        });
    },

    async reviewPrescription(id, status, notes, medications = null) {
        const token = localStorage.getItem('token');
        let apiUrl = `/api/prescriptions/${id}/review`;
        if (window.location.port === '5500') apiUrl = `/api/prescriptions/${id}/review`;

        const body = { status, pharmacistNotes: notes, rejectionReason: status === 'rejected' ? notes : null };
        if (medications) body.medications = medications;

        const response = await fetch(apiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
        const data = await response.json();
        if (data.success) {
            alert(`Prescription ${status}!`);
            await this.loadPrescriptions();
        } else alert(data.message);
    },

    // ==================== ORDERS ====================
    async loadOrders(status) {
        const container = document.getElementById('dashboard-content');
        const token = localStorage.getItem('token');
        let apiUrl = status === 'all' ? '/api/orders/admin/all' : `/api/orders/admin/status/${status}`;
        if (window.location.port === '5500') apiUrl = `${apiUrl}`;

        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            const orders = data.data;
            const title = status === 'all' ? 'All Orders' : `${status.toUpperCase()} Orders`;
            if (orders.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:3rem;"><h3>No ${title}</h3></div>`;
                return;
            }
            container.innerHTML = `<h2>${title} (${orders.length})</h2>${orders.map(o => this.renderOrderCard(o)).join('')}`;
            this.attachOrderEvents();
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },

    renderOrderCard(order) {
        const statusClass = this.getOrderStatusClass(order.status);
        const date = new Date(order.created_at).toLocaleString();
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div><strong>Order #${order.order_number}</strong><br>Customer: ${order.user_name || 'N/A'}<br>Date: ${date}</div>
                    <div><span class="status-badge ${statusClass}">${order.status.toUpperCase()}</span></div>
                </div>
                <div class="order-details" style="display: flex; gap: 1rem; flex-wrap: wrap; margin:0.5rem 0;">
                    <div><strong>Total:</strong> KES ${parseFloat(order.total).toLocaleString()}</div>
                    <div><strong>Payment:</strong> ${order.payment_method}</div>
                    <div><strong>Delivery:</strong> ${order.shipping_city || 'N/A'}</div>
                </div>
                <div class="order-actions">
                    <select class="status-select form-control" style="width:auto;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="btn btn-primary btn-sm update-order-status">Update</button>
                    <button class="btn btn-outline btn-sm view-order-details">Details</button>
                </div>
            </div>
        `;
    },

    getOrderStatusClass(status) {
        const map = { pending: 'status-pending', processing: 'status-processing', shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled' };
        return map[status] || 'status-pending';
    },

    attachOrderEvents() {
        document.querySelectorAll('.update-order-status').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = btn.closest('.order-card');
                const id = card.dataset.orderId;
                const newStatus = card.querySelector('.status-select').value;
                await this.updateOrderStatus(id, newStatus);
            });
        });
        document.querySelectorAll('.view-order-details').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.closest('.order-card').dataset.orderId;
                await this.viewOrderDetails(id);
            });
        });
    },

    async updateOrderStatus(orderId, status) {
        const token = localStorage.getItem('token');
        let apiUrl = `/api/orders/${orderId}/status`;
        if (window.location.port === '5500') apiUrl = `/api/orders/${orderId}/status`;
        const response = await fetch(apiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
        const data = await response.json();
        if (data.success) {
            alert(`Order status updated to ${status}`);
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (activeTab === 'pending-orders') await this.loadOrders('pending');
            else if (activeTab === 'processing-orders') await this.loadOrders('processing');
            else if (activeTab === 'shipped-orders') await this.loadOrders('shipped');
            else if (activeTab === 'all-orders') await this.loadOrders('all');
        } else alert(data.message);
    },

    async viewOrderDetails(orderId) {
        const token = localStorage.getItem('token');
        let apiUrl = `/api/orders/${orderId}`;
        if (window.location.port === '5500') apiUrl = `/api/orders/${orderId}`;
        const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (data.success) {
            const order = data.data;
            const items = order.items || [];
            let msg = `Order #${order.order_number}\nTotal: KES ${parseFloat(order.total).toLocaleString()}\nStatus: ${order.status}\nPayment: ${order.payment_method}\n\nItems:\n`;
            items.forEach(i => msg += `${i.medication_name} x ${i.quantity} = KES ${(i.price * i.quantity).toLocaleString()}\n`);
            alert(msg);
        } else alert(data.message);
    },

    // ==================== STATISTICS ====================
    async loadStats() {
        const container = document.getElementById('dashboard-content');
        const token = localStorage.getItem('token');
        let apiUrl = '/api/orders/admin/stats';
        if (window.location.port === '5500') apiUrl = '/api/orders/admin/stats';

        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            const stats = data.data.stats;
            const recent = data.data.recent_orders || [];

            container.innerHTML = `
                <h2>📊 Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-number">${stats.total_orders || 0}</div><div>Total Orders</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.pending_orders || 0}</div><div>Pending</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.processing_orders || 0}</div><div>Processing</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.shipped_orders || 0}</div><div>Shipped</div></div>
                    <div class="stat-card"><div class="stat-number">${stats.delivered_orders || 0}</div><div>Delivered</div></div>
                    <div class="stat-card"><div class="stat-number">KES ${(stats.total_revenue || 0).toLocaleString()}</div><div>Revenue</div></div>
                </div>
                <h3>Recent Orders</h3>
                ${recent.length ? recent.map(o => this.renderOrderCard(o)).join('') : '<p>No recent orders</p>'}
            `;
            this.attachOrderEvents();
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },

    // ==================== ADMIN ONLY: MEDICATIONS ====================
    async loadMedications() {
        if (!this.isAdmin) return;
        const container = document.getElementById('dashboard-content');
        const token = localStorage.getItem('token');
        try {
            let apiUrl = '/api/medications';
            if (window.location.port === '5500') apiUrl = '/api/medications';
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            const meds = data.data;
            container.innerHTML = `
                <h2>💊 Manage Medications</h2>
                <button id="add-med-btn" class="btn btn-primary" style="margin-bottom:1rem;">+ Add Medication</button>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>ID</th><th>Name</th><th>Price (KES)</th><th>Stock</th><th>Prescription</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${meds.map(m => `
                                <tr>
                                    <td>${m.id}</td>
                                    <td>${m.name}</td>
                                    <td>${parseFloat(m.price).toFixed(2)}</td>
                                    <td>${m.stock_quantity}</td>
                                    <td>${m.requires_prescription ? 'Yes' : 'No'}</td>
                                    <td><button class="edit-stock-btn btn btn-sm btn-outline" data-id="${m.id}">Update Stock</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            document.getElementById('add-med-btn').addEventListener('click', () => this.addMedication());
            document.querySelectorAll('.edit-stock-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const newStock = prompt('New stock quantity:');
                    if (newStock !== null) this.updateStock(id, parseInt(newStock));
                });
            });
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },

    async addMedication() {
        const name = prompt('Medication name:');
        if (!name) return;
        const price = parseFloat(prompt('Price (KES):'));
        if (isNaN(price)) return;
        const stock = parseInt(prompt('Stock quantity:'));
        if (isNaN(stock)) return;
        const requiresRx = confirm('Requires prescription?');
        const token = localStorage.getItem('token');
        let apiUrl = '/api/medications';
        if (window.location.port === '5500') apiUrl = '/api/medications';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, price, stock_quantity: stock, requires_prescription: requiresRx })
        });
        const data = await response.json();
        if (data.success) {
            alert('Medication added');
            await this.loadMedications();
        } else alert(data.message);
    },

    async updateStock(id, stock) {
        const token = localStorage.getItem('token');
        let apiUrl = `/api/medications/${id}/stock`;
        if (window.location.port === '5500') apiUrl = `/api/medications/${id}/stock`;
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ stock_quantity: stock })
        });
        const data = await response.json();
        if (data.success) {
            alert('Stock updated');
            await this.loadMedications();
        } else alert(data.message);
    },

    // ==================== ADMIN ONLY: USERS ====================
    async loadUsers() {
        if (!this.isAdmin) return;
        const container = document.getElementById('dashboard-content');
        const token = localStorage.getItem('token');
        let apiUrl = '/api/auth/users';
        if (window.location.port === '5500') apiUrl = '/api/auth/users';
        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            const users = data.data;
            container.innerHTML = `
                <h2>👥 Manage Users</h2>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.id}</td>
                                    <td>${u.name}</td>
                                    <td>${u.email}</td>
                                    <td>${u.phone}</td>
                                    <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                                    <td>
                                        <select class="role-select" data-id="${u.id}">
                                            <option value="patient" ${u.role === 'patient' ? 'selected' : ''}>Patient</option>
                                            <option value="pharmacist" ${u.role === 'pharmacist' ? 'selected' : ''}>Pharmacist</option>
                                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        </select>
                                        <button class="update-role-btn btn btn-sm btn-primary" data-id="${u.id}">Update</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            document.querySelectorAll('.update-role-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const select = document.querySelector(`.role-select[data-id="${id}"]`);
                    const newRole = select.value;
                    await this.updateUserRole(id, newRole);
                });
            });
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },

    async updateUserRole(userId, role) {
        const token = localStorage.getItem('token');
        let apiUrl = `/api/auth/users/${userId}/role`;
        if (window.location.port === '5500') apiUrl = `/api/auth/users/${userId}/role`;
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role })
        });
        const data = await response.json();
        if (data.success) {
            alert(`User role updated to ${role}`);
            await this.loadUsers();
        } else alert(data.message);
    }
};