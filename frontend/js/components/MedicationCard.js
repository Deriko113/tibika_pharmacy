const MedicationCard = {
    render(medication, onAddToCart) {
        const card = document.createElement('div');
        card.className = 'medication-card';
        
        // Use the helper to format price (ensures KES, not $)
        const formattedPrice = helpers.formatPrice(medication.price);
        
        card.innerHTML = `
            <div class="medication-image">
                ${medication.image_url ? 
                    `<img src="${medication.image_url}" alt="${medication.name}">` : 
                    '<div class="image-placeholder">💊</div>'
                }
            </div>
            <div class="medication-info">
                <h3>${medication.name}</h3>
                ${medication.generic_name ? `<p class="generic-name">${medication.generic_name}</p>` : ''}
                ${medication.strength ? `<p class="strength">${medication.strength}</p>` : ''}
                ${medication.requires_prescription ? 
                    '<span class="prescription-badge">⚠️ Prescription Required</span>' : ''
                }
                <div class="price-section">
                    <span class="price">${formattedPrice}</span>
                    ${medication.stock_quantity > 0 ? 
                        `<span class="in-stock">In Stock (${medication.stock_quantity})</span>` : 
                        '<span class="out-of-stock">Out of Stock</span>'
                    }
                </div>
                <button class="add-to-cart-btn" 
                    ${medication.stock_quantity === 0 ? 'disabled' : ''}
                    data-id="${medication.id}">
                    Add to Cart
                </button>
            </div>
        `;
        
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (addBtn && medication.stock_quantity > 0) {
            addBtn.addEventListener('click', () => onAddToCart(medication));
        }
        
        return card;
    }
};