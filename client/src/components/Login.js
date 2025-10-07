import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { 
  FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash, 
  FaUtensils, FaSignInAlt, FaUserPlus 
} from 'react-icons/fa';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLoginMode) {
      if (!formData.username) {
        newErrors.username = 'Nom d\'utilisateur ou email requis';
      }
      if (!formData.password) {
        newErrors.password = 'Mot de passe requis';
      }
    } else {
      // Register mode validation
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
      if (!formData.first_name || formData.first_name.length < 2) {
        newErrors.first_name = 'Le prénom doit contenir au moins 2 caractères';
      }
      if (!formData.last_name || formData.last_name.length < 2) {
        newErrors.last_name = 'Le nom doit contenir au moins 2 caractères';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLoginMode) {
        result = await login(formData.username, formData.password);
      } else {
        result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name
        });
      }

      if (result.success) {
        toast.success(isLoginMode ? 'Connexion réussie!' : 'Compte créé avec succès!');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: ''
    });
    setErrors({});
  };

  if (authLoading) {
    return <LoadingSpinner fullscreen message="Vérification de l'authentification..." />;
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <FaUtensils className="brand-icon" />
          <h1>Restaurant Emi</h1>
          <p>Système de gestion complet</p>
        </div>
        <div className="login-features">
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Gestion complète</h3>
            <p>Commandes, stocks, réservations et plus</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Interface moderne</h3>
            <p>Simple, rapide et intuitive</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Sécurisé</h3>
            <p>Vos données sont protégées</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>{isLoginMode ? 'Connexion' : 'Créer un compte'}</h2>
            <p>{isLoginMode ? 'Bienvenue! Connectez-vous à votre compte' : 'Commencez votre essai gratuit'}</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            {!isLoginMode && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Prénom</label>
                  <div className={`input-group ${errors.first_name ? 'error' : ''}`}>
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Votre prénom"
                    />
                  </div>
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Nom</label>
                  <div className={`input-group ${errors.last_name ? 'error' : ''}`}>
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                    />
                  </div>
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">
                {isLoginMode ? 'Nom d\'utilisateur ou Email' : 'Nom d\'utilisateur'}
              </label>
              <div className={`input-group ${errors.username ? 'error' : ''}`}>
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={isLoginMode ? 'admin ou admin@restaurant-emi.com' : 'Choisissez un nom d\'utilisateur'}
                  autoComplete="username"
                />
              </div>
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className={`input-group ${errors.email ? 'error' : ''}`}>
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className={`input-group ${errors.password ? 'error' : ''}`}>
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isLoginMode ? 'Entrez votre mot de passe' : 'Au moins 6 caractères'}
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <div className={`input-group ${errors.confirmPassword ? 'error' : ''}`}>
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez votre mot de passe"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            )}

            {isLoginMode && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Mot de passe oublié?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <span>Chargement...</span>
              ) : (
                <>
                  {isLoginMode ? <FaSignInAlt /> : <FaUserPlus />}
                  <span>{isLoginMode ? 'Se connecter' : 'Créer un compte'}</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLoginMode ? 'Pas encore de compte?' : 'Vous avez déjà un compte?'}
              <button onClick={toggleMode} className="toggle-button">
                {isLoginMode ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
          </div>

          {isLoginMode && (
            <div className="demo-credentials">
              <p className="demo-title">Identifiants de démonstration:</p>
              <p className="demo-info">
                <strong>Utilisateur:</strong> admin<br />
                <strong>Mot de passe:</strong> admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
