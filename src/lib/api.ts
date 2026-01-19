import type { ArticleWithRelations } from './database.types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function getJSON(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  return getJSON(`/api/articles/slug/${encodeURIComponent(slug)}`);
}

export async function incrementViews(id: string): Promise<any> {
  const res = await fetch(`${API}/api/articles/${encodeURIComponent(id)}/views`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to increment views');
  return res.json();
}

export async function getRelatedArticles(categoryId: string, excludeId: string, limit = 3) {
  return getJSON(`/api/articles/related?category_id=${encodeURIComponent(categoryId)}&exclude_id=${encodeURIComponent(excludeId)}&limit=${limit}`);
}

export async function getFeaturedArticles(limit = 5) {
  return getJSON(`/api/articles?featured=true&limit=${limit}`);
}

export async function getTrendingArticles(limit = 5) {
  return getJSON(`/api/articles?trending=true&limit=${limit}`);
}

export async function getLatestArticles(limit = 12) {
  return getJSON(`/api/articles?limit=${limit}`);
}

export async function getBreakingArticles(limit = 5) {
  return getJSON(`/api/articles/breaking?limit=${limit}`);
}

export async function searchArticles(query: string) {
  return getJSON(`/api/search?q=${encodeURIComponent(query)}`);
}

// Admin API
export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createArticle(article: any) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/articles`, { method: 'POST', headers, body: JSON.stringify(article) });
  if (!res.ok) throw new Error('Create failed');
  return res.json();
}

export async function updateArticle(id: string, article: any) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/articles/${encodeURIComponent(id)}`, { method: 'PUT', headers, body: JSON.stringify(article) });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function deleteArticle(id: string) {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function getAdminStats() {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/stats`, { headers });
  if (!res.ok) throw new Error('Stats fetch failed');
  return res.json();
}

export async function getCategories() {
  return getJSON('/api/categories');
}

export async function getAuthors() {
  return getJSON('/api/authors');
}

// Admin Category Management
export async function createCategory(category: { name: string; slug: string; description?: string }) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/categories`, { method: 'POST', headers, body: JSON.stringify(category) });
  if (!res.ok) throw new Error('Create category failed');
  return res.json();
}

export async function updateCategory(id: string, category: { name?: string; slug?: string; description?: string }) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', headers, body: JSON.stringify(category) });
  if (!res.ok) throw new Error('Update category failed');
  return res.json();
}

export async function deleteCategory(id: string) {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Delete category failed');
  return res.json();
}

// Admin Author Management
export async function createAuthor(author: { name: string; email?: string; bio?: string; avatar_url?: string }) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/authors`, { method: 'POST', headers, body: JSON.stringify(author) });
  if (!res.ok) throw new Error('Create author failed');
  return res.json();
}

export async function updateAuthor(id: string, author: { name?: string; email?: string; bio?: string; avatar_url?: string }) {
  const headers = { 'Content-Type': 'application/json', ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/authors/${encodeURIComponent(id)}`, { method: 'PUT', headers, body: JSON.stringify(author) });
  if (!res.ok) throw new Error('Update author failed');
  return res.json();
}

export async function deleteAuthor(id: string) {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/authors/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Delete author failed');
  return res.json();
}

// Admin: list and fetch single article
export async function adminGetArticles() {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/articles`, { headers });
  if (!res.ok) throw new Error('Admin list failed');
  return res.json();
}

export async function adminGetArticle(id: string) {
  const headers = { ...(authHeaders() as Record<string, string>) } as HeadersInit;
  const res = await fetch(`${API}/api/admin/articles/${encodeURIComponent(id)}`, { headers });
  if (!res.ok) throw new Error('Admin fetch failed');
  return res.json();
}

export async function getArticlesByCategory(categoryId: string, limit = 3) {
  return getJSON(`/api/articles?category_id=${encodeURIComponent(categoryId)}&limit=${limit}`);
}

// Upload helpers
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // { url, filename }
}

export async function getPresign(filename: string, contentType: string) {
  const res = await fetch(`${API}/api/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!res.ok) throw new Error('Presign failed');
  return res.json(); // { url, key, publicUrl }
}

export default {
  getArticleBySlug,
  incrementViews,
  getRelatedArticles,
  getFeaturedArticles,
  getTrendingArticles,
  getLatestArticles,
  getCategories,
  getArticlesByCategory,
  uploadFile,
  getPresign,
  adminGetArticles,
  adminGetArticle,
};
