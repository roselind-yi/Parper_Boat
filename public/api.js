const API_BASE = '/api';

const API = {
  token: localStorage.getItem('paper-boat-token') || null,
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('paper-boat-token', token);
  },
  
  clearToken() {
    this.token = null;
    localStorage.removeItem('paper-boat-token');
  },
  
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  },
  
  async register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },
  
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  async getProfile() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  },
  
  async createBoat(content, pathType) {
    return this.request('/boats/create', {
      method: 'POST',
      body: JSON.stringify({ content, pathType }),
    });
  },
  
  async findBoats() {
    return this.request('/boats/find', {
      method: 'GET',
    });
  },
  
  async getMyBoats() {
    return this.request('/boats/mine', {
      method: 'GET',
    });
  },
  
  async interactBoat(boatId, type, replyContent) {
    return this.request('/boats/interact', {
      method: 'POST',
      body: JSON.stringify({ boatId, type, replyContent }),
    });
  },
  
  async addFriend(friendId) {
    return this.request('/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  },
  
  async getFriends() {
    return this.request('/friends/list', {
      method: 'GET',
    });
  },
};
