// Lightweight frontend API wrapper that talks to the Neon-backed API.
// Previously this file created a Supabase client. To migrate to Neon we
// now call the API endpoints under `VITE_API_URL` (defaults to same origin).

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

async function fetchJSON(path: string, opts: RequestInit = {}) {
	const res = await fetch(`${API_BASE}${path}`, opts);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`API error ${res.status}: ${text}`);
	}
	return res.json();
}

export const supabase = {
	// Fetch a single article by slug
	async getArticleBySlug(slug: string) {
		const data = await fetchJSON(`/api/articles?slug=${encodeURIComponent(slug)}`);
		return data.data;
	},

	// Increment views for an article id
	async incrementViews(id: string) {
		await fetchJSON(`/api/articles/${encodeURIComponent(id)}/views`, { method: 'POST' });
	},

	// Fetch related articles by category id (exclude an id)
	async getRelatedArticles(category_id: string, exclude_id?: string, limit = 3) {
		return this.getArticles({ category_id, exclude_id, limit });
	},

	// Fetch categories
	async getCategories() {
		const data = await fetchJSON('/api/categories');
		return data.data;
	},

	// Generic articles fetch (supports category_id, featured, breaking, trending, limit, exclude_id)
	async getArticles(opts: { category_id?: string; featured?: boolean; breaking?: boolean; trending?: boolean; limit?: number; exclude_id?: string } = {}) {
		const params = new URLSearchParams();
		if (opts.featured) params.set('featured', 'true');
		if (opts.trending) params.set('trending', 'true');
		if (opts.breaking) params.set('breaking', 'true');
		if (opts.category_id) params.set('category_id', opts.category_id);
		if (opts.exclude_id) params.set('exclude_id', opts.exclude_id);
		if (opts.limit) params.set('limit', String(opts.limit));
		const data = await fetchJSON(`/api/articles?${params.toString()}`);
		return data.data;
	},
};
