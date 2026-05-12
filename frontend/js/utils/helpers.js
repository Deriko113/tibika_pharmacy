// Helper functions for the pharmacy system
const helpers = {
    // ==================== PRICE FORMATTING ====================
    
    // Format price in Kenyan Shillings (no dollar sign)
    formatPrice(price) {
        if (price === undefined || price === null) return 'KES 0.00';
        return 'KES ' + parseFloat(price).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    // Format price without currency symbol (just number)
    formatPriceNumber(price) {
        if (price === undefined || price === null) return '0.00';
        return parseFloat(price).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    // Format price for display (short version)
    formatPriceShort(price) {
        if (price === undefined || price === null) return 'KES 0';
        return 'KES ' + Math.round(parseFloat(price)).toLocaleString('en-KE');
    },
    
    // Format large numbers with commas (Kenyan format)
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('en-KE');
    },
    
    // ==================== DATE FORMATTING ====================
    
    // Format date
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Format date and time
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Format time only
    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // ==================== VALIDATION ====================
    
    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate Kenyan phone number
    validateKenyanPhone(phone) {
        // Kenyan phone numbers: 07xxxxxxxx or 01xxxxxxxx (10 digits)
        const phoneRegex = /^(07|01)[0-9]{8}$/;
        return phoneRegex.test(phone);
    },
    
    // Format Kenyan phone number
    formatKenyanPhone(phone) {
        if (!phone) return '';
        // Remove any non-digit characters
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        return phone;
    },
    
    // Validate password strength
    validatePassword(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        if (password.length < minLength) {
            return { valid: false, message: `Password must be at least ${minLength} characters` };
        }
        if (!hasUpperCase) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!hasLowerCase) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!hasNumbers) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        return { valid: true, message: 'Password is strong' };
    },
    
    // ==================== FILE HANDLING ====================
    
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // ==================== TEXT FORMATTING ====================
    
    // Truncate text
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // Capitalize first letter of each word
    capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    },
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ==================== UI HELPERS ====================
    
    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Show alert message
    showAlert(message, type = 'success') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert alert-${type}`;
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                <span>${message}</span>
                <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.maxWidth = '400px';
        alertDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        alertDiv.style.borderRadius = '8px';
        
        // Add color based on type
        if (type === 'success') {
            alertDiv.style.backgroundColor = '#d4edda';
            alertDiv.style.color = '#155724';
            alertDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'danger') {
            alertDiv.style.backgroundColor = '#f8d7da';
            alertDiv.style.color = '#721c24';
            alertDiv.style.border = '1px solid #f5c6cb';
        } else if (type === 'warning') {
            alertDiv.style.backgroundColor = '#fff3cd';
            alertDiv.style.color = '#856404';
            alertDiv.style.border = '1px solid #ffeeba';
        } else if (type === 'info') {
            alertDiv.style.backgroundColor = '#d1ecf1';
            alertDiv.style.color = '#0c5460';
            alertDiv.style.border = '1px solid #bee5eb';
        }
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv && alertDiv.remove) {
                alertDiv.remove();
            }
        }, 5000);
    },
    
    // Get status badge HTML
    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge badge-warning">Pending</span>',
            approved: '<span class="badge badge-success">Approved</span>',
            rejected: '<span class="badge badge-danger">Rejected</span>',
            shipped: '<span class="badge badge-info">Shipped</span>',
            delivered: '<span class="badge badge-success">Delivered</span>',
            cancelled: '<span class="badge badge-danger">Cancelled</span>',
            processing: '<span class="badge badge-info">Processing</span>',
            paid: '<span class="badge badge-success">Paid</span>',
            failed: '<span class="badge badge-danger">Failed</span>',
            reviewing: '<span class="badge badge-warning">Reviewing</span>',
            dispensed: '<span class="badge badge-success">Dispensed</span>'
        };
        return badges[status] || `<span class="badge badge-secondary">${status}</span>`;
    },
    
    // ==================== ORDER STATUS ====================
    
    // Format order status for display
    formatOrderStatus(status) {
        const statusMap = {
            pending: 'Pending',
            pharmacist_approved: 'Pharmacist Approved',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    },
    
    // Format payment status
    formatPaymentStatus(status) {
        const statusMap = {
            pending: 'Pending',
            paid: 'Paid',
            failed: 'Failed',
            refunded: 'Refunded'
        };
        return statusMap[status] || status;
    },
    
    // Format payment method
    formatPaymentMethod(method) {
        const methodMap = {
            mpesa: 'M-Pesa',
            card: 'Credit/Debit Card',
            cash_on_delivery: 'Cash on Delivery'
        };
        return methodMap[method] || method;
    },
    
    // ==================== KENYA SPECIFIC ====================
    
    // Get Kenyan county list
    getKenyanCounties() {
        return [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado',
            'Uasin Gishu', 'Kakamega', 'Bungoma', 'Meru', 'Nyeri', 'Kilifi', 'Kwale',
            'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Elgeyo Marakwet',
            'Nandi', 'Baringo', 'Laikipia', 'Kirinyaga', 'Muranga', 'Nyandarua',
            'Embu', 'Tharaka Nithi', 'Tana River', 'Garissa', 'Wajir', 'Mandera',
            'Marsabit', 'Isiolo', 'Kitui', 'Makueni', 'Kisii', 'Nyamira', 'Homa Bay',
            'Siaya', 'Migori', 'Busia', 'Vihiga', 'Bomet', 'Kericho'
        ];
    },
    
    // Get delivery fee by county
    getDeliveryFee(county) {
        const fees = {
            'Nairobi': 150,
            'Mombasa': 300,
            'Kisumu': 250,
            'Nakuru': 200,
            'Kiambu': 180,
            'Machakos': 180,
            'Kajiado': 200,
            'Thika': 180,
            'Eldoret': 250,
            'Kitale': 280
        };
        return fees[county] || 250;
    },
    
    // ==================== UTILITY ====================
    
    // Get random color
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    
    // Copy to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showAlert('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showAlert('Failed to copy', 'danger');
        });
    },
    
    // Get query parameter from URL
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    // Scroll to top smoothly
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    // ==================== AUTH HELPERS ====================
    
    // Check if user is logged in
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },
    
    // Get user from localStorage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    // Get user role
    getUserRole() {
        const user = this.getUser();
        return user?.role || null;
    },
    
    // Check if user is admin
    isAdmin() {
        return this.getUserRole() === 'admin';
    },
    
    // Check if user is pharmacist
    isPharmacist() {
        return this.getUserRole() === 'pharmacist';
    },
    
    // Check if user is patient
    isPatient() {
        return this.getUserRole() === 'patient';
    },
    
    // Logout user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    
    // ==================== CALCULATIONS ====================
    
    // Calculate discount
    calculateDiscount(originalPrice, discountPercentage) {
        const discount = (originalPrice * discountPercentage) / 100;
        const finalPrice = originalPrice - discount;
        return {
            original: originalPrice,
            discount: discount,
            final: finalPrice,
            savings: discount,
            original_formatted: this.formatPrice(originalPrice),
            discount_formatted: this.formatPrice(discount),
            final_formatted: this.formatPrice(finalPrice)
        };
    },
    
    // Calculate tax (16% VAT for Kenya)
    calculateTax(amount, taxRate = 0.16) {
        const tax = amount * taxRate;
        return {
            amount: amount,
            tax: tax,
            total: amount + tax,
            tax_formatted: this.formatPrice(tax),
            total_formatted: this.formatPrice(amount + tax)
        };
    }
};

// Make helpers available globally
if (typeof window !== 'undefined') {
    window.helpers = helpers;
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = helpers;
}