import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaUserTie } from 'react-icons/fa';

function Staff() {
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Erreur lors du chargement du personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.role) {
      toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingStaff) {
        await axios.put(`/api/staff/${editingStaff.id}`, formData);
        toast.success('Membre du personnel mis à jour ! ✓');
      } else {
        await axios.post('/api/staff', formData);
        toast.success('Membre du personnel ajouté ! 👤');
      }
      
      setShowModal(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la sauvegarde';
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

  const deleteStaff = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
      return;
    }

    try {
      await axios.delete(`/api/staff/${id}`);
      toast.success('Membre du personnel supprimé avec succès');
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/staff/${id}/status`, { status });
      toast.success(`Statut mis à jour: ${getStatusLabel(status)}`);
      fetchStaff();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      role: '',
      status: 'active'
    });
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      role: member.role,
      status: member.status
    });
    setShowModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'on_leave': 'En congé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'inactive': '#6b7280',
      'on_leave': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement du personnel..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gestion du Personnel</h1>
        <p>Gérez les employés de votre restaurant</p>
      </div>

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Ajouter un Employé
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <FaUsers size={64} color="#d1d5db" />
          <h3>Aucun employé</h3>
          <p>Ajoutez votre premier employé pour commencer</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Ajouter un Employé
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom Complet</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date d'Ajout</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id}>
                  <td>#{member.id}</td>
                  <td className="font-bold">
                    <FaUserTie style={{ marginRight: '8px', color: '#667eea' }} />
                    {member.first_name} {member.last_name}
                  </td>
                  <td>
                    <span className="badge badge-info">{member.role}</span>
                  </td>
                  <td>
                    <select
                      value={member.status}
                      onChange={(e) => updateStatus(member.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(member.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="on_leave">En congé</option>
                    </select>
                  </td>
                  <td>{new Date(member.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn-icon btn-secondary"
                        onClick={() => openEditModal(member)}
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => deleteStaff(member.id)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajout/Édition */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStaff ? 'Modifier l\'employé' : 'Nouvel employé'}</h2>
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Jean"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Dupont"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rôle *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Chef, Serveur, Manager..."
                    required
                    disabled={submitting}
                  />
                </div>

                {editingStaff && (
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="on_leave">En congé</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingStaff(null);
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
                  {submitting ? 'Enregistrement...' : (editingStaff ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;
