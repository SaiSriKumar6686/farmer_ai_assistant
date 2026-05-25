/**
 * services/apiConfig.js
 * Re-exports BACKEND_URL from the unified gateway for backward compatibility.
 * All new code should import from services/api/gateway.js directly.
 */
import { BACKEND_URL } from './api/gateway';
export const BASE_URL = BACKEND_URL;
