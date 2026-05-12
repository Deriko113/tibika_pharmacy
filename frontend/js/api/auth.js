// Determine if we are running locally or on Vercel
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' // Use your LOCAL backend port here
    : '/api';                    // On Vercel, use a relative path

const AuthAPI = {
    async register(userData) {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        // Safety check for HTML responses
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server error: Received non-JSON response. Check Vercel logs.");
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async login(email, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server error: Received non-JSON response.");
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async getMe() {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
    
    async updateProfile(profileData) {
        const token = Storage.getToken();
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};