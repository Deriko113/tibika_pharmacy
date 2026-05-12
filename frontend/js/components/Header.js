// Header Component
const Header = {
    render(container, user, cartCount) {
        const token = localStorage.getItem('token');
        const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
        const isLoggedIn = token !== null;
        const itemCount = cartCount || 0;
        
        let navLinks = '';
        
        if (isLoggedIn && currentUser) {
            // Show different links based on role
            if (currentUser.role === 'patient') {
                navLinks = `
                    <a href="/" data-link>Home</a>
                    <a href="/medications" data-link>Medications</a>
                    <a href="/prescriptions" data-link>My Prescriptions</a>
                    <a href="/my-orders" data-link>My Orders</a>
                    <div class="cart-icon">
                        <a href="/cart" data-link>🛒</a>
                        ${itemCount > 0 ? `<span class="cart-count">${itemCount}</span>` : ''}
                    </div>
                    <span class="user-name">👋 ${currentUser.name}</span>
                    <button id="logout-btn" class="logout-btn">Logout</button>
                `;
            } else if (currentUser.role === 'pharmacist' || currentUser.role === 'admin') {
                navLinks = `
                    <a href="/" data-link>Home</a>
                    <a href="/medications" data-link>Medications</a>
                    <a href="/dashboard" data-link>📊 Dashboard</a>
                    <div class="cart-icon">
                        <a href="/cart" data-link>🛒</a>
                        ${itemCount > 0 ? `<span class="cart-count">${itemCount}</span>` : ''}
                    </div>
                    <span class="user-name">👋 ${currentUser.name} (${currentUser.role})</span>
                    <button id="logout-btn" class="logout-btn">Logout</button>
                `;
            }
        } else {
            navLinks = `
                <a href="/" data-link>Home</a>
                <a href="/medications" data-link>Medications</a>
                <a href="/login" data-link>Login</a>
                <a href="/register" data-link>Register</a>
            `;
        }
        
        container.innerHTML = `
            <nav class="navbar">
                <div class="container">
                    <a href="/" data-link class="logo">🏥 Tibika Pharmacy</a>
                    <div class="nav-links">
                        ${navLinks}
                    </div>
                </div>
            </nav>
        `;
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (typeof App !== 'undefined') {
                    App.user = null;
                    App.cartCount = 0;
                }
                window.location.href = '/';
            });
        }
    }
};