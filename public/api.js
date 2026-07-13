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
    
    // 获取响应文本，然后尝试解析为 JSON
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // 如果不是 JSON 格式，说明服务器返回了 HTML 错误页
      throw new Error('服务器错误: ' + text.substring(0, 100));
    }
    
    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
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
