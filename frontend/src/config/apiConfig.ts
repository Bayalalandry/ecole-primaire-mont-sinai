// Configuration centralisée de l'URL de l'API
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      return 'https://ecole-primaire-mont-sinai.onrender.com/api';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      return 'https://ecole-primaire-mont-sinai.onrender.com';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const API_URL = getApiUrl();
export const API_BASE_URL = getApiBaseUrl();