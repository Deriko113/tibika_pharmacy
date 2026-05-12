const RegisterPage = {
    async render(container) {
        // If already logged in, redirect to home
        if (localStorage.getItem('token')) {
            router.navigateTo('/');
            return;
        }
        
        container.innerHTML = `
            <div class="container" style="max-width: 600px; margin: 60px auto;">
                <div class="card" style="background: white; padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow);">
                    <h2 style="text-align: center; margin-bottom: 2rem;">Create an Account</h2>
                    <form id="register-form">
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="confirm_password">Confirm Password</label>
                            <input type="password" id="confirm_password" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
                    </form>
                    <p style="text-align: center; margin-top: 1rem;">
                        Already have an account? <a href="/login" data-link>Login here</a>
                    </p>
                </div>
            </div>
        `;
        
        const form = document.getElementById('register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Validate
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Registration successful!');
                
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
                console.error('Registration error:', error);
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
};