// Main Application
const App = {
    user: null,
    cartCount: 0,
    
    async init() {
        console.log('Initializing App...');
        
        // Setup routes
        router.addRoute('/', () => this.loadPage('home'));
        router.addRoute('/login', () => this.loadPage('login'));
        router.addRoute('/register', () => this.loadPage('register'));
        router.addRoute('/medications', () => this.loadPage('medications'));
        router.addRoute('/cart', () => this.loadPage('cart'));
        router.addRoute('/checkout', () => this.loadPage('checkout'));
        router.addRoute('/prescriptions', () => this.loadPage('prescriptions'));
        router.addRoute('/dashboard', () => this.loadPage('dashboard'));
        router.addRoute('/404', () => this.loadPage('404'));
        router.addRoute('/admin', () => this.loadPage('admin'));
        router.addRoute('/my-orders', () => this.loadPage('myOrders'));

        // Check authentication
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    this.user = result.user;
                    localStorage.setItem('user', JSON.stringify(this.user));
                    console.log('User logged in:', this.user?.name);
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth error:', error);
                this.logout();
            }
        } else {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                this.user = JSON.parse(storedUser);
            }
        }
        
        // Load cart count
        if (this.user) {
            await this.updateCartCount();
        }
        
        // Render header
        this.renderHeader();
        
        // Load initial route
        const path = window.location.pathname || '/';
        await router.loadRoute(path);
    },
    
    async loadPage(pageName) {
        const mainContent = document.getElementById('main-content');
        
        switch(pageName) {
            case 'home':
                await HomePage.render(mainContent);
                break;
            case 'login':
                await LoginPage.render(mainContent);
                break;
            case 'register':
                await RegisterPage.render(mainContent);
                break;
            case 'medications':
                await MedicationsPage.render(mainContent);
                break;
            case 'cart':
                await CartPage.render(mainContent);
                break;
            case 'checkout':
                await CheckoutPage.render(mainContent);
                break;
            case 'prescriptions':
                await PrescriptionsPage.render(mainContent);
                break;
            case 'dashboard':
                await DashboardPage.render(mainContent);
                break;
            case 'admin':
                await AdminPage.render(mainContent);
                break; 
            case 'myOrders':
                await MyOrdersPage.render(mainContent);
                break;      
            default:
                mainContent.innerHTML = `
                    <div class="container" style="text-align: center; padding: 4rem 0;">
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="/" data-link class="btn btn-primary">Go Home</a>
                    </div>
                `;
        }
    },
    
    renderHeader() {
        const headerContainer = document.getElementById('header');
        if (typeof Header !== 'undefined') {
            Header.render(headerContainer, this.user, this.cartCount);
        } else {
            console.warn('Header component not loaded');
        }
    },
    
    async updateCartCount() {
        if (!this.user) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/cart', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            this.cartCount = data.data?.items?.length || 0;
            this.renderHeader();
        } catch (error) {
            console.error('Error updating cart count:', error);
            this.cartCount = 0;
        }
    },
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.user = null;
        this.cartCount = 0;
        this.renderHeader();
        router.navigateTo('/login');
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, starting App...');
    App.init();
});