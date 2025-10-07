import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: '',
    reservation_date: '',
    reservation_time: '',
    table_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get('/api/reservations');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReservation) {
        await axios.put(`/api/reservations/${editingReservation.id}`, {...formData, status: editingReservation.status});
      } else {
        await axios.post('/api/reservations', formData);
      }
      setShowModal(false);
      setEditingReservation(null);
      resetForm();
      fetchReservations();
    } catch (error) {
      console.error('Error saving reservation:', error);
    }
  };

  const deleteReservation = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      try {
        await axios.delete(`/api/reservations/${id}`);
        fetchReservations();
      } catch (error) {
        console.error('Error deleting reservation:', error);
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/reservations/${id}/status`, { status });
      fetchReservations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      party_size: '',
      reservation_date: '',
      reservation_time: '',
      table_id: '',
      notes: ''
    });
  };

  const openEditModal = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customer_name: reservation.customer_name,
      customer_phone: reservation.customer_phone,
      customer_email: reservation.customer_email || '',
      party_size: reservation.party_size,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      table_id: reservation.table_id || '',
      notes: reservation.notes || ''
    });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'confirmed': 'badge-success',
      'seated': 'badge-info',
      'completed': 'badge-success',
      'cancelled': 'badge-danger',
      'no-show': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      'confirmed': 'Confirmé',
      'seated': 'Installé',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'no-show': 'Absent'
    };
    return texts[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des réservations</h1>
        <p>Centralisez et automatisez vos réservations</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Liste des réservations</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus /> Nouvelle réservation
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Personnes</th>
              <th>Table</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => (
              <tr key={reservation.id}>
                <td><strong>{reservation.customer_name}</strong></td>
                <td>{reservation.customer_phone}</td>
                <td>{new Date(reservation.reservation_date).toLocaleDateString('fr-FR')}</td>
                <td>{reservation.reservation_time}</td>
                <td>{reservation.party_size} pers.</td>
                <td>Table {reservation.table_number || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadge(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {reservation.status === 'confirmed' && (
                      <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updateStatus(reservation.id, 'seated')}>
                        Installer
                      </button>
                    )}
                    {reservation.status === 'seated' && (
                      <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updateStatus(reservation.id, 'completed')}>
                        Terminer
                      </button>
                    )}
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => openEditModal(reservation)}>
                      <FaEdit />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => deleteReservation(reservation.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reservations.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            Aucune réservation pour le moment
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom du client *</label>
                <input type="text" required value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Téléphone *</label>
                <input type="tel" required value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nombre de personnes *</label>
                <input type="number" required value={formData.party_size}
                  onChange={(e) => setFormData({...formData, party_size: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" required value={formData.reservation_date}
                  onChange={(e) => setFormData({...formData, reservation_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Heure *</label>
                <input type="time" required value={formData.reservation_time}
                  onChange={(e) => setFormData({...formData, reservation_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="3" value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">
                  {editingReservation ? 'Mettre à jour' : 'Créer'}
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
