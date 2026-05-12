const LoginPage = {
    async render(container) {
        // If already logged in, redirect to home
        if (localStorage.getItem('token')) {
            router.navigateTo('/');
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="max-width: 500px; margin: 60px auto;">
                <div class="card" style="background: white; padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow);">
                    <h2 style="text-align: center; margin-bottom: 2rem;">Login to Your Account</h2>
                    <form id="login-form">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                    </form>
                    <p style="text-align: center; margin-top: 1rem;">
                        Don't have an account? <a href="/register" data-link>Register here</a>
                    </p>
                </div>
            </div>
        `;
        
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            
            try {
                // Use full URL if using Live Server, or relative if backend serves frontend
                const apiUrl = '/api/auth/login';
                
                console.log('Attempting login to:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                console.log('Response status:', response.status);
                
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text.substring(0, 200));
                    throw new Error('Server returned non-JSON response. Make sure backend is running on port 5000');
                }
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Login successful!');
                
                // Update App state
                if (typeof App !== 'undefined') {
                    App.user = data.user;
                    await App.updateCartCount();
                    App.renderHeader();
                }
                
                // Redirect to home page
                setTimeout(() => {
                    router.navigateTo('/');
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
};