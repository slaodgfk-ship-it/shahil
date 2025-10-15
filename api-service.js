/**
 * API Service - Replaces localStorage with backend API calls
 * This service handles all communication with the Flask backend
 */

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.currentUser = null;
        this.currentAdmin = null;
        
        // Load session data on initialization
        this.loadSession();
    }
    
    // Helper method to make API calls
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session management
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // Session Management
    loadSession() {
        // Try to load session from localStorage (temporary fallback)
        const userData = localStorage.getItem('currentUser');
        const adminData = localStorage.getItem('currentAdmin');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        if (adminData) {
            this.currentAdmin = JSON.parse(adminData);
        }
    }
    
    saveSession(user, isAdmin = false) {
        if (isAdmin) {
            this.currentAdmin = user;
            localStorage.setItem('currentAdmin', JSON.stringify(user));
        } else {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }
    
    clearSession() {
        this.currentUser = null;
        this.currentAdmin = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentAdmin');
    }
    
    // Authentication APIs
    async login(username, password) {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.user) {
            this.saveSession(response.user, response.user.is_admin);
        }
        
        return response;
    }
    
    async register(userData) {
        return await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    async logout() {
        try {
            await this.makeRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
        }
    }
    
    // Issues APIs
    async getIssues(userId = null) {
        const endpoint = userId ? `/issues?user_id=${userId}` : '/issues';
        return await this.makeRequest(endpoint);
    }
    
    async createIssue(issueData) {
        return await this.makeRequest('/issues', {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
    }
    
    async updateIssue(issueId, updateData) {
        return await this.makeRequest(`/issues/${issueId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }
    
    async upvoteIssue(issueId) {
        return await this.makeRequest(`/issues/${issueId}/upvote`, {
            method: 'POST'
        });
    }
    
    // Feedback APIs
    async getFeedback() {
        return await this.makeRequest('/feedback');
    }
    
    async createFeedback(feedbackData) {
        return await this.makeRequest('/feedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        });
    }
    
    // Orders/Cafeteria APIs
    async getOrders(userId = null) {
        const endpoint = userId ? `/cafeteria/orders?user_id=${userId}` : '/cafeteria/orders';
        return await this.makeRequest(endpoint);
    }
    
    async createOrder(orderData) {
        return await this.makeRequest('/cafeteria/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }
    
    async updateOrderStatus(orderId, status) {
        return await this.makeRequest(`/cafeteria/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
    
    // Lost & Found APIs
    async getLostFoundItems() {
        return await this.makeRequest('/lost-found');
    }
    
    async createLostFoundItem(itemData) {
        return await this.makeRequest('/lost-found', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }
    
    async updateLostFoundStatus(itemId, status) {
        return await this.makeRequest(`/lost-found/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
    
    // Transport/Rides APIs
    async getRides() {
        return await this.makeRequest('/transport/rides');
    }
    
    async createRide(rideData) {
        return await this.makeRequest('/transport/rides', {
            method: 'POST',
            body: JSON.stringify(rideData)
        });
    }
    
    async bookRide(rideId) {
        return await this.makeRequest(`/transport/rides/${rideId}/book`, {
            method: 'POST'
        });
    }
    
    // Dashboard APIs
    async getDashboardStats() {
        return await this.makeRequest('/dashboard/stats');
    }
    
    async getRecentActivity() {
        return await this.makeRequest('/dashboard/activity');
    }
    
    // Admin APIs
    async getPendingSignups() {
        return await this.makeRequest('/auth/pending-signups');
    }
    
    async approveSignup(signupId) {
        return await this.makeRequest(`/auth/approve-signup/${signupId}`, {
            method: 'POST'
        });
    }
    
    async rejectSignup(signupId) {
        return await this.makeRequest(`/auth/reject-signup/${signupId}`, {
            method: 'POST'
        });
    }
    
    async getAllUsers() {
        return await this.makeRequest('/auth/users');
    }
    
    async updateUser(userId, userData) {
        return await this.makeRequest(`/auth/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    async deleteUser(userId) {
        return await this.makeRequest(`/auth/users/${userId}`, {
            method: 'DELETE'
        });
    }
    
    // Utility methods
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    isAdmin() {
        return this.currentAdmin !== null || (this.currentUser && this.currentUser.is_admin);
    }
    
    getCurrentUser() {
        return this.currentUser || this.currentAdmin;
    }
    
    // Health check
    async checkHealth() {
        try {
            return await this.makeRequest('/health');
        } catch (error) {
            console.error('Backend health check failed:', error);
            return { status: 'error', message: 'Backend not available' };
        }
    }
}

// Create global API service instance
const apiService = new ApiService();

// Fallback functions for localStorage compatibility
// These will gradually be replaced with API calls

const LocalStorageAPI = {
    // Temporary fallback methods that use localStorage
    // These should be replaced with apiService calls
    
    getItem(key) {
        console.warn(`Using localStorage fallback for: ${key}. Consider migrating to API.`);
        return localStorage.getItem(key);
    },
    
    setItem(key, value) {
        console.warn(`Using localStorage fallback for: ${key}. Consider migrating to API.`);
        return localStorage.setItem(key, value);
    },
    
    removeItem(key) {
        console.warn(`Using localStorage fallback for: ${key}. Consider migrating to API.`);
        return localStorage.removeItem(key);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService, apiService };
}

// Global availability
window.apiService = apiService;
window.LocalStorageAPI = LocalStorageAPI;

console.log('🚀 API Service initialized. Backend URL:', apiService.baseURL);
