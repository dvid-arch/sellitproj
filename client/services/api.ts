const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
    const userStr = localStorage.getItem('sellit_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem('sellit_token') || (user ? user.token : null);
    
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const fetchWithTimeout = async (url: string, options: any, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, { headers: getHeaders() });
        if (!res.ok) {
            if (res.status === 401 || res.status === 500) {
                localStorage.removeItem('sellit_user');
                localStorage.removeItem('sellit_token');
            }
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'API Error');
        }
        return res.json();
    },
    post: async (endpoint: string, data: any) => {
        const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 500) {
                // Clear potentially invalid token/user data
                localStorage.removeItem('sellit_user');
                localStorage.removeItem('sellit_token');
                // Optional: reload to force login screen if pertinent
                // window.location.reload(); 
            }
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'API Error');
        }
        return res.json();
    },
    put: async (endpoint: string, data: any) => {
        const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'API Error');
        }
        return res.json();
    },
    delete: async (endpoint: string) => {
        const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'API Error');
        }
        return res.json();
    }
};
