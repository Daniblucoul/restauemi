import axios from 'axios';

// Configuration de base axios
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de réponse pour gérer le nouveau format d'API
instance.interceptors.response.use(
  (response) => {
    // Si la réponse a le format { status: 'success', data: ... }, extraire data
    if (response.data && response.data.status === 'success' && response.data.data !== undefined) {
      // Préserver les autres propriétés de la réponse si nécessaires
      const originalData = response.data.data;
      response.data = originalData;
    }
    return response;
  },
  (error) => {
    // Gestion d'erreur améliorée avec le nouveau format
    if (error.response && error.response.data) {
      const { message, details, status } = error.response.data;
      
      // Créer un objet d'erreur enrichi
      const enhancedError = {
        message: message || error.message || 'Une erreur est survenue',
        details: details || [],
        status: error.response.status,
        originalError: error
      };
      
      // Log pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', enhancedError);
      }
      
      // Retourner une erreur avec les informations enrichies
      error.userMessage = enhancedError.message;
      error.errorDetails = enhancedError.details;
    }
    
    return Promise.reject(error);
  }
);

// Interceptor de requête (pour futures fonctionnalités comme l'authentification)
instance.interceptors.request.use(
  (config) => {
    // Ici on pourrait ajouter un token d'authentification par exemple
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
