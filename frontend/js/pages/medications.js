// Medications Page - Complete Working Version
const MedicationsPage = {
    currentPage: 1,
    allMedications: [],
    filteredMedications: [],
    filters: {
        search: '',
        category: 'all',
        requiresPrescription: ''
    },
    categories: [],
    
    async render(container) {
        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h1>Medications</h1>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <input type="text" id="search-input" placeholder="Search medications..." class="form-control" style="width: 250px;">
                        <select id="category-filter" class="form-control">
                            <option value="all">All Categories</option>
                        </select>
                        <select id="prescription-filter" class="form-control">
                            <option value="">All Medications</option>
                            <option value="true">Prescription Required</option>
                            <option value="false">Over the Counter</option>
                        </select>
                        <button id="reset-filters" class="btn btn-outline">Reset Filters</button>
                    </div>
                </div>
                <div id="medications-grid" class="grid">
                    <div class="loading-spinner">Loading medications...</div>
                </div>
                <div id="pagination" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;"></div>
            </div>
        `;
        
        await this.loadCategories();
        await this.loadMedications();
        this.setupEventListeners();
    },
    
    async loadCategories() {
        try {
            // Determine API URL
            let apiUrl = '/api/medications/categories';
            if (window.location.port === '5500') {
                apiUrl = '/api/medications/categories';
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.categories = data.data;
                const categorySelect = document.getElementById('category-filter');
                
                this.categories.forEach(cat => {
                    if (cat.category) {
                        const option = document.createElement('option');
                        option.value = cat.category;
                        option.textContent = cat.category.charAt(0).toUpperCase() + cat.category.slice(1);
                        categorySelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    },
    
    async loadMedications() {
        const grid = document.getElementById('medications-grid');
        grid.innerHTML = '<div class="loading-spinner">Loading medications...</div>';
        
        try {
            // Determine API URL based on port
            let apiUrl = '/api/medications';
            if (window.location.port === '5500') {
                apiUrl = '/api/medications';
            }
            
            console.log('Fetching medications from:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Server returned HTML instead of JSON. Make sure backend is running on port 5000');
            }
            
            const data = await response.json();
            console.log('Medications API response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load medications');
            }
            
            if (!data.data || data.data.length === 0) {
                grid.innerHTML = `
                    <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                        <h3>No Medications Found</h3>
                        <p>The medication list is empty. Please check back later.</p>
                        <button onclick="location.reload()" class="btn btn-primary">Refresh</button>
                    </div>
                `;
                return;
            }
            
            this.allMedications = data.data;
            this.applyFilters();
            
        } catch (error) {
            console.error('Load medications error:', error);
            grid.innerHTML = `
                <div style="text-align: center; padding: 3rem; grid-column: 1/-1; color: #dc3545;">
                    <h3>Error Loading Medications</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem;">
                        Make sure:
                        <br>- Backend is running on port 5000
                        <br>- MySQL database has medications
                        <br>- API endpoint is accessible
                    </p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Try Again</button>
                </div>
            `;
        }
    },
    
    applyFilters() {
        let filtered = [...this.allMedications];
        
        // Apply search filter
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(med => 
                med.name.toLowerCase().includes(searchLower) ||
                (med.generic_name && med.generic_name.toLowerCase().includes(searchLower)) ||
                (med.description && med.description.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply category filter
        if (this.filters.category && this.filters.category !== 'all') {
            filtered = filtered.filter(med => med.category === this.filters.category);
        }
        
        // Apply prescription filter
        if (this.filters.requiresPrescription === 'true') {
            filtered = filtered.filter(med => med.requires_prescription == 1);
        } else if (this.filters.requiresPrescription === 'false') {
            filtered = filtered.filter(med => med.requires_prescription == 0);
        }
        
        this.filteredMedications = filtered;
        this.currentPage = 1;
        this.renderMedications();
    },
    
    renderMedications() {
        const grid = document.getElementById('medications-grid');
        const isLoggedIn = localStorage.getItem('token') !== null;
        
        if (this.filteredMedications.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                    <h3>No matching medications</h3>
                    <p>Try adjusting your search or filters.</p>
                    <button id="clear-filters-btn" class="btn btn-primary">Clear Filters</button>
                </div>
            `;
            
            const clearBtn = document.getElementById('clear-filters-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.resetFilters();
                });
            }
            return;
        }
        
        // Pagination
        const itemsPerPage = 12;
        const startIndex = (this.currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = this.filteredMedications.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredMedications.length / itemsPerPage);
        
        // Render items
        grid.innerHTML = '';
        for (const med of paginatedItems) {
            const card = this.createMedicationCard(med, isLoggedIn);
            grid.appendChild(card);
        }
        
        // Render pagination
        this.renderPagination(totalPages);
    },
    
    createMedicationCard(medication, isLoggedIn) {
        const card = document.createElement('div');
        card.className = 'medication-card';
        card.style.cssText = 'background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.3s;';
        
        // Format price in KES
        const price = parseFloat(medication.price) || 0;
        const formattedPrice = `KES ${price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        card.innerHTML = `
            <div class="medication-image" style="height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                ${medication.image_url ? 
                    `<img src="${medication.image_url}" alt="${medication.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    '<div style="font-size: 3rem;">💊</div>'
                }
            </div>
            <div class="medication-info" style="padding: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${this.escapeHtml(medication.name)}</h3>
                ${medication.generic_name ? `<p style="color: #666; font-size: 0.85rem; margin: 0 0 0.5rem 0;">${this.escapeHtml(medication.generic_name)}</p>` : ''}
                ${medication.strength ? `<p style="color: #888; font-size: 0.8rem; margin: 0 0 0.5rem 0;">${medication.strength}</p>` : ''}
                ${medication.requires_prescription ? 
                    '<span style="display: inline-block; background: #f39c12; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin: 0.5rem 0;">⚠️ Prescription Required</span>' : ''
                }
                <div style="margin: 0.5rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.25rem; font-weight: bold; color: #2c7da0;">${formattedPrice}</span>
                    ${medication.stock_quantity > 0 ? 
                        `<span style="color: #28a745; font-size: 0.8rem;">In Stock (${medication.stock_quantity})</span>` : 
                        '<span style="color: #dc3545; font-size: 0.8rem;">Out of Stock</span>'
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
    
    renderPagination(totalPages) {
        const paginationDiv = document.getElementById('pagination');
        if (!paginationDiv) return;
        
        if (totalPages <= 1) {
            paginationDiv.innerHTML = '';
            return;
        }
        
        let html = '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">';
        
        if (this.currentPage > 1) {
            html += `<button class="btn btn-outline" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Show page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span style="padding: 0 0.5rem;">...</span>`;
            }
        }
        
        if (this.currentPage < totalPages) {
            html += `<button class="btn btn-outline" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        html += '</div>';
        paginationDiv.innerHTML = html;
        
        // Add event listeners
        paginationDiv.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(btn.dataset.page);
                this.renderMedications();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    },
    
    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const prescriptionFilter = document.getElementById('prescription-filter');
        const resetBtn = document.getElementById('reset-filters');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }
        
        if (prescriptionFilter) {
            prescriptionFilter.addEventListener('change', (e) => {
                this.filters.requiresPrescription = e.target.value;
                this.applyFilters();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    },
    
    resetFilters() {
        this.filters = {
            search: '',
            category: 'all',
            requiresPrescription: ''
        };
        
        // Reset form inputs
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const prescriptionFilter = document.getElementById('prescription-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (prescriptionFilter) prescriptionFilter.value = '';
        
        this.applyFilters();
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};