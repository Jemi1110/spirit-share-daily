// API service for Django backend integration
// Replace BASE_URL with your Django backend URL
const BASE_URL = 'http://localhost:8000/api';

// Token management
export const getToken = () => localStorage.getItem('access_token');
export const setToken = (token: string) => localStorage.setItem('access_token', token);
export const removeToken = () => localStorage.removeItem('access_token');

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Auth endpoints
export const authAPI = {
  register: (data: { email: string; password: string; username: string }) =>
    apiCall('/users/register/', { method: 'POST', body: JSON.stringify(data) }),
  
  login: async (email: string, password: string) => {
    const response = await apiCall<{ access: string; refresh: string }>('/users/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(response.access);
    return response;
  },
  
  logout: () => {
    removeToken();
    return Promise.resolve();
  },
};

// Bible endpoints
export const bibleAPI = {
  getVersions: () => apiCall('/bible/versions/', { method: 'GET' }),
  getVerses: (params?: { book?: string; chapter?: number; verse?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/verses/?${query}`, { method: 'GET' });
  },
  searchVerses: (query: string) => apiCall(`/verses/search/?q=${query}`, { method: 'GET' }),
};

// Highlights endpoints
export const highlightAPI = {
  getAll: () => apiCall('/highlights/', { method: 'GET' }),
  create: (data: any) => apiCall('/highlights/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/highlights/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/highlights/${id}/`, { method: 'DELETE' }),
};

// Devotionals endpoints
export const devotionalAPI = {
  getAll: () => apiCall('/devotionals/', { method: 'GET' }),
  getById: (id: string) => apiCall(`/devotionals/${id}/`, { method: 'GET' }),
  create: (data: any) => apiCall('/devotionals/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/devotionals/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/devotionals/${id}/`, { method: 'DELETE' }),
};

// Prayer requests endpoints
export const prayerAPI = {
  getAll: () => apiCall('/prayers/', { method: 'GET' }),
  create: (data: any) => apiCall('/prayers/', { method: 'POST', body: JSON.stringify(data) }),
  markPrayed: (id: string) => apiCall(`/prayers/${id}/pray/`, { method: 'POST' }),
  delete: (id: string) => apiCall(`/prayers/${id}/`, { method: 'DELETE' }),
};

// Posts endpoints
export const postAPI = {
  getAll: () => apiCall('/posts/', { method: 'GET' }),
  create: (data: FormData) => {
    const token = getToken();
    return fetch(`${BASE_URL}/posts/`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: data,
    }).then(res => res.json());
  },
  like: (id: string) => apiCall(`/posts/${id}/like/`, { method: 'POST' }),
  delete: (id: string) => apiCall(`/posts/${id}/`, { method: 'DELETE' }),
};

// Comments endpoints
export const commentAPI = {
  getByPost: (postId: string) => apiCall(`/comments/?post=${postId}`, { method: 'GET' }),
  create: (data: any) => apiCall('/comments/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/comments/${id}/`, { method: 'DELETE' }),
};

// Blog endpoints
export const blogAPI = {
  getAll: () => apiCall('/blogs/', { method: 'GET' }),
  getById: (id: string) => apiCall(`/blogs/${id}/`, { method: 'GET' }),
  create: (data: any) => apiCall('/blogs/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/blogs/${id}/`, { method: 'DELETE' }),
};

// User profile endpoints
export const userAPI = {
  getProfile: () => apiCall('/users/profile/', { method: 'GET' }),
  updateProfile: (data: any) => apiCall('/users/profile/', { method: 'PUT', body: JSON.stringify(data) }),
  follow: (userId: string) => apiCall(`/users/${userId}/follow/`, { method: 'POST' }),
  unfollow: (userId: string) => apiCall(`/users/${userId}/unfollow/`, { method: 'POST' }),
};
