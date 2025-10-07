import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FaUser, FaCog, FaSignOutAlt, FaChevronDown, 
  FaUserCircle, FaKey, FaShieldAlt, FaEnvelope
} from 'react-icons/fa';
import './UserProfile.css';

function UserProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Déconnexion réussie');
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    navigate('/settings');
  };

  if (!user) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#DC2626'; // Red
      case 'manager':
        return '#7C3AED'; // Purple
      case 'staff':
        return '#2563EB'; // Blue
      default:
        return '#14B8A6'; // Teal
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'staff':
        return 'Employé';
      default:
        return 'Utilisateur';
    }
  };

  return (
    <div className="user-profile-container" ref={dropdownRef}>
      <button 
        className="user-profile-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
      >
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
          ) : (
            <FaUserCircle className="default-avatar" />
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{user.first_name} {user.last_name}</span>
          <span className="user-role" style={{ color: getRoleColor(user.role) }}>
            {getRoleLabel(user.role)}
          </span>
        </div>
        <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="user-profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <FaUserCircle className="default-avatar-large" />
              )}
            </div>
            <div className="dropdown-user-info">
              <p className="dropdown-user-name">{user.first_name} {user.last_name}</p>
              <p className="dropdown-user-email">
                <FaEnvelope /> {user.email}
              </p>
              <span 
                className="dropdown-role-badge" 
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                <FaShieldAlt /> {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          <div className="dropdown-menu">
            <button 
              className="dropdown-item"
              onClick={handleProfileClick}
            >
              <FaUser className="dropdown-icon" />
              <span>Mon Profil</span>
            </button>

            <button 
              className="dropdown-item"
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/change-password');
              }}
            >
              <FaKey className="dropdown-icon" />
              <span>Changer mot de passe</span>
            </button>

            {(user.role === 'admin' || user.role === 'manager') && (
              <button 
                className="dropdown-item"
                onClick={handleSettingsClick}
              >
                <FaCog className="dropdown-icon" />
                <span>Paramètres</span>
              </button>
            )}

            <div className="dropdown-divider"></div>

            <button 
              className="dropdown-item logout"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="dropdown-icon" />
              <span>Déconnexion</span>
            </button>
          </div>

          <div className="dropdown-footer">
            <p>Dernière connexion: {user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Première connexion'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
