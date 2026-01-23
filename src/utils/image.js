
// Helper to construct full image URL

// Access environment variable directly or fallback
const API_URL = import.meta.env?.VITE_API_URL || 'https://backend-car-rental-tesg.onrender.com/api';

/**
 * Returns a usable image URL.
 * - If url is blob or http, return as is.
 * - If url is relative (starts with /), prepend API_URL (stripping /api if double).
 */
export const getImageUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';

    // Return blobs and absolute URLs as is
    if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Handle relative path
    // Our API_URL usually ends with /api.
    // Our relative path from backend is /api/upload/file/...
    // If we just concat, we might get /api/api/...

    // Clean base: remove trailing slash
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    // If backend returns /api/upload/..., and base is .../api
    // We want .../api/upload/... NOT .../api/api/upload

    // Simple fix: If url starts with /api and base ends with /api, remove one.
    // ACTUALLY: The backend relative path will include /api (see below).
    // So if API_URL includes /api, we should use the ROOT of API_URL?
    // No, safest is: "If relative path, assume it needs the HOST of the API".

    // But API_URL includes /api path often.
    // Let's rely on string replacement.

    if (url.startsWith('/')) {
        // If API_URL is http://host/api
        // and url is /api/upload/...
        // We want http://host/api/upload...

        // Remove /api from start of url if base has it at end?
        // Or assume base is the authority?

        // Let's assume the user configured VITE_API_URL to point to the API root.
        // e.g. http://localhost:5000/api

        // If we just join them: http://localhost:5000/api/api/upload... (WRONG)

        // If url starts with /api, we should probably strip /api from base?

        const baseWithoutApi = base.replace(/\/api$/, '');
        return `${baseWithoutApi}${url}`;
    }

    return url;
};
