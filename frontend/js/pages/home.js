// Home Page - Complete Working Version
const HomePage = {
    async render(container) {
        container.innerHTML = `
            <div class="hero-section" style="background: linear-gradient(135deg, #2c7da0, #61a5c2); color: white; padding: 60px 0; text-align: center;">
                <div class="container">
                    <h1>Welcome to Tibika Pharmacy</h1>
                    <p style="font-size: 1.2rem; margin: 20px 0;">Your trusted online pharmacy for prescription medications</p>
                    <a href="/medications" data-link class="btn" style="background: white; color: #2c7da0; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold;">Shop Now</a>
                </div>
            </div>
            
            <div class="container" style="padding: 60px 0;">
                <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 60px;">
                    <div class="feature" style="text-align: center; padding: 20px;">
                        <div style="font-size: 3rem;">📋</div>
                        <h3>Easy Prescription Upload</h3>
                        <p>Upload your prescription online and get it verified by our pharmacists</p>
                    </div>
                    <div class="feature" style="text-align: center; padding: 20px;">
                        <div style="font-size: 3rem;">🚚</div>
                        <h3>Fast Delivery</h3>
                        <p>Get your medications delivered to your doorstep within 2-3 days</p>
                    </div>
                    <div class="feature" style="text-align: center; padding: 20px;">
                        <div style="font-size: 3rem;">💊</div>
                        <h3>Quality Medications</h3>
                        <p>All medications are sourced from verified manufacturers</p>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <h2>Featured Medications</h2>
                    <div id="featured-medications" class="grid" style="margin-top: 30px;">
                        <div class="loading-spinner">Loading medications...</div>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadFeaturedMedications();
    },
    
    async loadFeaturedMedications() {
        const container = document.getElementById('featured-medications');
        
        try {
            // Determine API URL based on port
            let apiUrl = '/api/medications';
            if (window.location.port === '5500') {
                apiUrl = '/api/medications';
            }
            
            console.log('Fetching featured medications from:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned HTML instead of JSON');
            }
            
            const data = await response.json();
            
            console.log('Medications API response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load medications');
            }
            
            if (!data.data || data.data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                        <p>No medications available at the moment.</p>
                    </div>
                `;
                return;
            }
            
            // Take only first 4 medications for featured section
            const featuredMedications = data.data.slice(0, 4);
            
            // Clear loading spinner
            container.innerHTML = '';
            
            // Check if user is logged in for add to cart functionality
            const isLoggedIn = localStorage.getItem('token') !== null;
            
            // Render each medication card
            for (const med of featuredMedications) {
                const card = this.createMedicationCard(med, isLoggedIn);
                container.appendChild(card);
            }
            
        } catch (error) {
            console.error('Error loading featured medications:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; grid-column: 1/-1; color: #dc3545;">
                    <p>Error loading medications: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Try Again</button>
                </div>
            `;
        }
    },
    
    createMedicationCard(medication, isLoggedIn) {
        const card = document.createElement('div');
        card.className = 'medication-card';
        card.style.cssText = 'background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.3s;';
        
        // Format price in KES
        const price = parseFloat(medication.price) || 0;
        const formattedPrice = `KES ${price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        card.innerHTML = `
            <div class="medication-image" style="height: 180px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                ${medication.image_url ? 
                    `<img src="${medication.image_url}" alt="${medication.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    '<div style="font-size: 3rem;">💊</div>'
                }
            </div>
            <div class="medication-info" style="padding: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${this.escapeHtml(medication.name)}</h3>
                ${medication.generic_name ? `<p style="color: #666; font-size: 0.8rem; margin: 0 0 0.5rem 0;">${this.escapeHtml(medication.generic_name)}</p>` : ''}
                ${medication.strength ? `<p style="color: #888; font-size: 0.75rem; margin: 0 0 0.5rem 0;">${medication.strength}</p>` : ''}
                ${medication.requires_prescription ? 
                    '<span style="display: inline-block; background: #f39c12; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; margin: 0.5rem 0;">⚠️ Prescription Required</span>' : ''
                }
                <div style="margin: 0.5rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.1rem; font-weight: bold; color: #2c7da0;">${formattedPrice}</span>
                    ${medication.stock_quantity > 0 ? 
                        `<span style="color: #28a745; font-size: 0.7rem;">In Stock</span>` : 
                        '<span style="color: #dc3545; font-size: 0.7rem;">Out of Stock</span>'
                    }
                </div>
                ${isLoggedIn ? 
                    `<button class="add-to-cart-btn" data-id="${medication.id}" data-name="${medication.name}" data-price="${medication.price}" 
                        style="width: 100%; padding: 8px; background: #2c7da0; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 0.5rem;"
                        ${medication.stock_quantity === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        Add to Cart
                    </button>` :
                    `<a href="/login" data-link style="display: block; text-align: center; width: 100%; padding: 8px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px; margin-top: 0.5rem;">
                        Login to Order
                    </a>`
                }
            </div>
        `;
        
        // Add event listener to Add to Cart button
        if (isLoggedIn && medication.stock_quantity > 0) {
            const addBtn = card.querySelector('.add-to-cart-btn');
            if (addBtn) {
                addBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.addToCart(medication);
                });
            }
        }
        
        return card;
    },
    
    async addToCart(medication) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            if (typeof helpers !== 'undefined') {
                helpers.showAlert('Please login to add items to cart', 'warning');
            } else {
                alert('Please login to add items to cart');
            }
            window.location.href = '/login';
            return;
        }
        
        let apiUrl = '/api/cart/add';
        if (window.location.port === '5500') {
            apiUrl = '/api/cart/add';
        }
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    medication_id: medication.id, 
                    quantity: 1 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add to cart');
            }
            
            if (typeof helpers !== 'undefined') {
                helpers.showAlert(`${medication.name} added to cart!`, 'success');
            } else {
                alert(`${medication.name} added to cart!`);
            }
            
            // Update cart count in header
            if (typeof App !== 'undefined' && App.updateCartCount) {
                await App.updateCartCount();
            }
            
        } catch (error) {
            console.error('Add to cart error:', error);
            if (typeof helpers !== 'undefined') {
                helpers.showAlert(error.message, 'danger');
            } else {
                alert(error.message);
            }
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};