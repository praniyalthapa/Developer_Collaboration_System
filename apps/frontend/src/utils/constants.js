// Auto-detect backend URL based on environment
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
	(typeof window !== "undefined" && window.location.hostname === "localhost" 
		? "http://localhost:7777/api"
		: "/api");
