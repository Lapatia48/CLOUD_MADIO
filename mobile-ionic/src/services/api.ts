import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const fileService = {
  getFiles: (folderId?: string) =>
    api.get('/files', { params: { folderId } }),
  uploadFile: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (fileId: string) =>
    api.delete(`/files/${fileId}`),
  downloadFile: (fileId: string) =>
    api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  shareFile: (fileId: string, email: string) =>
    api.post(`/files/${fileId}/share`, { email }),
};

export const folderService = {
  createFolder: (name: string, parentId?: string) =>
    api.post('/folders', { name, parentId }),
  deleteFolder: (folderId: string) =>
    api.delete(`/folders/${folderId}`),
};

export default api;
