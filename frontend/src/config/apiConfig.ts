// Configuration centralisée de l'URL de l'API
export const API_URL = 
  import.meta.env.MODE === 'production' 
    ? 'https://ecole-primaire-mont-sinai.onrender.com/api' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Pour les services qui utilisent l'URL sans /api
export const API_BASE_URL = 
  import.meta.env.MODE === 'production' 
    ? 'https://ecole-primaire-mont-sinai.onrender.com' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');