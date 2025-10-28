// API service for Django backend integration
// Replace BASE_URL with your Django backend URL
const BASE_URL = 'http://127.0.0.1:8000/api';

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

  // If we get 401 and it's a GET request, try again without token
  if (!response.ok && response.status === 401 && (!options.method || options.method === 'GET')) {
    console.log('401 error on GET request, retrying without token...');
    removeToken(); // Clear invalid token
    
    // Retry without Authorization header
    const headersWithoutAuth: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: headersWithoutAuth,
    });
    
    if (!retryResponse.ok) {
      throw new Error(`API Error: ${retryResponse.statusText}`);
    }
    
    // Handle DELETE requests which typically return no content (204)
    if (retryResponse.status === 204 || options.method === 'DELETE') {
      return {} as T;
    }
    
    return retryResponse.json();
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  // Handle DELETE requests which typically return no content (204)
  if (response.status === 204 || options.method === 'DELETE') {
    return {} as T;
  }

  return response.json();
}

// Auth endpoints
export const authAPI = {
  register: (data: { email: string; password: string; username: string }) =>
    apiCall('/accounts/register/', { method: 'POST', body: JSON.stringify(data) }),
  
  login: async (email: string, password: string) => {
    const response = await apiCall<{ access: string; refresh: string }>('/auth/login/', {
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
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return apiCall(`/verses/${query ? '?' + query : ''}`, { method: 'GET' });
  },
  searchVerses: (query: string) => apiCall(`/verses/?search=${encodeURIComponent(query)}`, { method: 'GET' }),
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
  update: (id: string, data: any) => apiCall(`/blogs/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/blogs/${id}/`, { method: 'DELETE' }),
};

// User profile endpoints
export const userAPI = {
  getProfile: () => apiCall('/accounts/profile/', { method: 'GET' }),
  updateProfile: (data: any) => apiCall('/accounts/profile/', { method: 'PUT', body: JSON.stringify(data) }),
  follow: (userId: string) => apiCall(`/accounts/${userId}/follow/`, { method: 'POST' }),
  unfollow: (userId: string) => apiCall(`/accounts/${userId}/unfollow/`, { method: 'POST' }),
};

// Document endpoints
export const documentAPI = {
  getAll: () => apiCall('/documents/', { method: 'GET' }),
  getById: (id: string) => apiCall(`/documents/${id}/`, { method: 'GET' }),
  upload: (formData: FormData) => {
    const token = getToken();
    return fetch(`${BASE_URL}/documents/`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    }).then(res => res.json());
  },
  update: (id: string, data: any) => apiCall(`/documents/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/documents/${id}/`, { method: 'DELETE' }),
  share: (id: string, email: string) => apiCall(`/documents/${id}/share/`, { 
    method: 'POST', 
    body: JSON.stringify({ email }) 
  }),
  makePublic: (id: string) => apiCall(`/documents/${id}/make_public/`, { method: 'POST' }),
};
