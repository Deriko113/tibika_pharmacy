const MedicationsAPI = {
    async getAll(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/medications${queryParams ? '?' + queryParams : ''}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch medications');
            }
            
            return data;
        } catch (error) {
            console.error('Get medications error:', error);
            return { success: false, data: [], message: error.message };
        }
    },
    
    async getById(id) {
        try {
            const response = await fetch(`/api/medications/${id}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch medication');
            }
            
            return data;
        } catch (error) {
            console.error('Get medication error:', error);
            return { success: false, data: null, message: error.message };
        }
    },
    
    async getCategories() {
        try {
            const response = await fetch('/api/medications/categories');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch categories');
            }
            
            return data;
        } catch (error) {
            console.error('Get categories error:', error);
            return { success: false, data: [], message: error.message };
        }
    }
};