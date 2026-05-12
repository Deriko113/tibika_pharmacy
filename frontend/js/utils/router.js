class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        
        window.addEventListener('popstate', () => {
            this.loadRoute(window.location.pathname);
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigateTo(e.target.getAttribute('href'));
            }
        });
    }
    
    addRoute(path, handler) {
        this.routes[path] = handler;
    }
    
    navigateTo(path, replace = false) {
        if (replace) {
            window.history.replaceState({}, '', path);
        } else {
            window.history.pushState({}, '', path);
        }
        this.loadRoute(path);
    }
    
    async loadRoute(path) {
        // Remove trailing slash
        path = path.replace(/\/$/, '') || '/';
        
        const handler = this.routes[path] || this.routes['/404'];
        
        if (handler) {
            this.currentRoute = path;
            await handler();
        } else {
            console.error('Route not found:', path);
            if (this.routes['/404']) {
                await this.routes['/404']();
            }
        }
    }
    
    getCurrentRoute() {
        return this.currentRoute;
    }
}

const router = new Router();