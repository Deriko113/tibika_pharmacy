const PrescriptionsAPI = {
    async upload(formData) {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/prescriptions/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async getMyPrescriptions() {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/prescriptions/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async getAllPrescriptions(status = 'all') {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/prescriptions/all?status=${status}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async reviewPrescription(id, reviewData) {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/prescriptions/${id}/review`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async getStats() {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/prescriptions/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};