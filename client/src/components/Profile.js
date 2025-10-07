import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { 
  FaUser, FaEnvelope, FaShieldAlt, FaCalendar, 
  FaClock, FaSave, FaKey, FaCamera
} from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProfile(formData);
    if (result.success) {
      toast.success('Profil mis à jour avec succès!');
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour');
    }
    
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      toast.success('Mot de passe modifié avec succès!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveTab('info');
    } else {
      toast.error(result.error || 'Erreur lors du changement de mot de passe');
    }
    
    setLoading(false);
  };

  if (!user) {
    return <LoadingSpinner fullscreen message="Chargement du profil..." />;
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#DC2626';
      case 'manager': return '#7C3AED';
      case 'staff': return '#2563EB';
      default: return '#14B8A6';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'staff': return 'Employé';
      default: return 'Utilisateur';
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-header-content">
          <h1>Mon Profil</h1>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <FaUser className="default-avatar" />
              )}
              <button className="avatar-change-btn">
                <FaCamera />
              </button>
            </div>
            <h2>{user.first_name} {user.last_name}</h2>
            <p className="profile-username">@{user.username}</p>
            <span 
              className="profile-role-badge"
              style={{ backgroundColor: getRoleColor(user.role) }}
            >
              <FaShieldAlt /> {getRoleLabel(user.role)}
            </span>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <FaCalendar className="stat-icon" />
              <div>
                <p className="stat-label">Membre depuis</p>
                <p className="stat-value">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="stat-item">
              <FaClock className="stat-icon" />
              <div>
                <p className="stat-label">Dernière connexion</p>
                <p className="stat-value">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleString('fr-FR')
                    : 'Première connexion'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <FaUser /> Informations personnelles
            </button>
            <button
              className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <FaKey /> Sécurité
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="tab-content">
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">
                      <FaUser /> Prénom
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">
                      <FaUser /> Nom
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <FaEnvelope /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="avatar_url">
                    <FaCamera /> URL de l'avatar
                  </label>
                  <input
                    type="url"
                    id="avatar_url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Enregistrement...' : (
                    <>
                      <FaSave /> Enregistrer les modifications
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-content">
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <FaKey /> Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    <FaKey /> Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                  />
                  <small>Minimum 6 caractères</small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FaKey /> Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Changement...' : (
                    <>
                      <FaSave /> Changer le mot de passe
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
