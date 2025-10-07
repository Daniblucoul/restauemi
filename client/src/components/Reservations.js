import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaPhone, FaUsers } from 'react-icons/fa';

function Reservations() {
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [reservations, setReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    party_size: '',
    reservation_time: '',
    table_id: '',
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reservations');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_name || !formData.phone_number || !formData.party_size || !formData.reservation_time) {
      toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (parseInt(formData.party_size) <= 0) {
      toast.warning('Le nombre de personnes doit être supérieur à 0');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingReservation) {
        await axios.put(`/api/reservations/${editingReservation.id}`, formData);
        toast.success('Réservation mise à jour avec succès ! ✓');
      } else {
        await axios.post('/api/reservations', formData);
        toast.success('Réservation créée avec succès ! 📅');
      }
      
      setShowModal(false);
      setEditingReservation(null);
      resetForm();
      fetchReservations();
    } catch (error) {
      console.error('Error saving reservation:', error);
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

  const deleteReservation = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }

    try {
      await axios.delete(`/api/reservations/${id}`);
      toast.success('Réservation supprimée avec succès');
      fetchReservations();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/reservations/${id}/status`, { status });
      toast.success(`Statut mis à jour: ${getStatusLabel(status)}`);
      fetchReservations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      phone_number: '',
      party_size: '',
      reservation_time: '',
      table_id: '',
      notes: '',
      status: 'pending'
    });
  };

  const openEditModal = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customer_name: reservation.customer_name,
      phone_number: reservation.phone_number,
      party_size: reservation.party_size,
      reservation_time: reservation.reservation_time,
      table_id: reservation.table_id || '',
      notes: reservation.notes || '',
      status: reservation.status
    });
    setShowModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'seated': 'Installée',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'no_show': 'Non présentée'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'seated': '#10b981',
      'completed': '#6b7280',
      'cancelled': '#ef4444',
      'no_show': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement des réservations..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des Réservations</h1>
        <p>Gérez les réservations de votre restaurant</p>
      </div>

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nouvelle Réservation
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <FaCalendarAlt size={64} color="#d1d5db" />
          <h3>Aucune réservation</h3>
          <p>Créez votre première réservation pour commencer</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Nouvelle Réservation
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Réservation</th>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Nb Personnes</th>
                <th>Date & Heure</th>
                <th>Table</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>#{reservation.id}</td>
                  <td className="font-bold">{reservation.customer_name}</td>
                  <td>
                    <FaPhone size={12} style={{ marginRight: '4px' }} />
                    {reservation.phone_number}
                  </td>
                  <td>
                    <FaUsers size={12} style={{ marginRight: '4px' }} />
                    {reservation.party_size}
                  </td>
                  <td>{new Date(reservation.reservation_time).toLocaleString('fr-FR')}</td>
                  <td>{reservation.table_id ? `Table ${reservation.table_id}` : '-'}</td>
                  <td>
                    <select
                      value={reservation.status}
                      onChange={(e) => updateStatus(reservation.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(reservation.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="seated">Installée</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                      <option value="no_show">Non présentée</option>
                    </select>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn-icon btn-secondary"
                        onClick={() => openEditModal(reservation)}
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => deleteReservation(reservation.id)}
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
              <h2>{editingReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}</h2>
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
                  <label>Nom du client *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Nom complet"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de personnes *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.party_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, party_size: e.target.value }))}
                      placeholder="2"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Table (optionnel)</label>
                    <input
                      type="text"
                      value={formData.table_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, table_id: e.target.value }))}
                      placeholder="Numéro de table"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date et heure *</label>
                  <input
                    type="datetime-local"
                    value={formData.reservation_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, reservation_time: e.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>

                {editingReservation && (
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      disabled={submitting}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="seated">Installée</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                      <option value="no_show">Non présentée</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Notes (optionnel)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Remarques, allergies, demandes spéciales..."
                    rows="3"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingReservation(null);
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
                  {submitting ? 'Enregistrement...' : (editingReservation ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservations;
