import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaThermometerHalf, FaHandSparkles, FaClipboardCheck } from 'react-icons/fa';

function HACCP() {
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('temperature');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    log_type: 'temperature',
    description: '',
    temperature: '',
    status: 'ok'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/haccp');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching HACCP logs:', error);
      toast.error('Erreur lors du chargement des contrôles HACCP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description || !formData.log_type) {
      toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.log_type === 'temperature' && !formData.temperature) {
      toast.warning('La température est obligatoire pour ce type de contrôle');
      return;
    }

    setSubmitting(true);
    
    try {
      await axios.post('/api/haccp', formData);
      toast.success('Contrôle HACCP enregistré ! ✓');
      
      setShowModal(false);
      resetForm();
      fetchLogs();
    } catch (error) {
      console.error('Error saving HACCP log:', error);
      const errorMessage = error.userMessage || 'Erreur lors de l\'enregistrement';
      const errorDetails = error.errorDetails || [];
      
      if (errorDetails.length > 0) {
        toast.error(`${errorMessage}: ${errorDetails.join(', ')}`, 6000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrôle ?')) {
      return;
    }

    try {
      await axios.delete(`/api/haccp/${id}`);
      toast.success('Contrôle supprimé avec succès');
      fetchLogs();
    } catch (error) {
      console.error('Error deleting HACCP log:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      log_type: 'temperature',
      description: '',
      temperature: '',
      status: 'ok'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ok': <span className="badge badge-success">OK</span>,
      'warning': <span className="badge badge-warning">Avertissement</span>,
      'critical': <span className="badge badge-danger">Critique</span>
    };
    return badges[status] || badges['ok'];
  };

  const getLogTypeLabel = (type) => {
    const labels = {
      'temperature': '🌡️ Température',
      'cleaning': '🧹 Nettoyage',
      'receiving': '📦 Réception',
      'storage': '🏪 Stockage',
      'other': '📋 Autre'
    };
    return labels[type] || type;
  };

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'temperature') return log.log_type === 'temperature';
    return log.log_type !== 'temperature';
  });

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement des contrôles HACCP..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Conformité HACCP</h1>
        <p>Suivi des normes d'hygiène et de sécurité alimentaire</p>
      </div>

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nouveau Contrôle
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            className={`tab-button ${activeTab === 'temperature' ? 'active' : ''}`}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              borderBottom: activeTab === 'temperature' ? '3px solid #667eea' : 'none', 
              fontWeight: activeTab === 'temperature' ? 'bold' : 'normal',
              color: activeTab === 'temperature' ? '#667eea' : '#6b7280'
            }}
            onClick={() => setActiveTab('temperature')}>
            <FaThermometerHalf style={{ marginRight: '8px' }} />
            Contrôles de température
          </button>
          <button 
            className={`tab-button ${activeTab === 'hygiene' ? 'active' : ''}`}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              borderBottom: activeTab === 'hygiene' ? '3px solid #667eea' : 'none', 
              fontWeight: activeTab === 'hygiene' ? 'bold' : 'normal',
              color: activeTab === 'hygiene' ? '#667eea' : '#6b7280'
            }}
            onClick={() => setActiveTab('hygiene')}>
            <FaHandSparkles style={{ marginRight: '8px' }} />
            Contrôles d'hygiène
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <FaClipboardCheck size={64} color="#d1d5db" />
            <h3>Aucun contrôle enregistré</h3>
            <p>Ajoutez votre premier contrôle HACCP</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> Nouveau Contrôle
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  {activeTab === 'temperature' && <th>Température</th>}
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    <td>{getLogTypeLabel(log.log_type)}</td>
                    <td>{log.description}</td>
                    {activeTab === 'temperature' && (
                      <td className="font-bold">
                        {log.temperature ? `${log.temperature}°C` : '-'}
                      </td>
                    )}
                    <td>{getStatusBadge(log.status)}</td>
                    <td>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => deleteLog(log.id)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nouveau Contrôle */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouveau contrôle HACCP</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type de contrôle *</label>
                  <select
                    value={formData.log_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                    required
                    disabled={submitting}
                  >
                    <option value="temperature">Température</option>
                    <option value="cleaning">Nettoyage</option>
                    <option value="receiving">Réception</option>
                    <option value="storage">Stockage</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez le contrôle effectué..."
                    rows="3"
                    required
                    disabled={submitting}
                  />
                </div>

                {formData.log_type === 'temperature' && (
                  <div className="form-group">
                    <label>Température (°C) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                      placeholder="Ex: 4.5"
                      required
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="ok">OK</option>
                    <option value="warning">Avertissement</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HACCP;
