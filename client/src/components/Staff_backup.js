import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function Staff() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    phone: '',
    email: '',
    hire_date: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(`/api/staff/${editingStaff.id}`, {...formData, status: editingStaff.status});
      } else {
        await axios.post('/api/staff', formData);
      }
      setShowModal(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
    }
  };

  const deleteStaff = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
      try {
        await axios.delete(`/api/staff/${id}`);
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff member:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      role: '',
      phone: '',
      email: '',
      hire_date: ''
    });
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      role: member.role,
      phone: member.phone || '',
      email: member.email || '',
      hire_date: member.hire_date || ''
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestion du personnel</h1>
        <p>Planifiez les horaires et gérez les congés</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Liste du personnel</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus /> Ajouter un employé
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Date d'embauche</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id}>
                <td><strong>{member.first_name} {member.last_name}</strong></td>
                <td>{member.role}</td>
                <td>{member.phone || '-'}</td>
                <td>{member.email || '-'}</td>
                <td>{member.hire_date ? new Date(member.hire_date).toLocaleDateString('fr-FR') : '-'}</td>
                <td>
                  <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {member.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => openEditModal(member)}>
                      <FaEdit />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => deleteStaff(member.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {staff.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            Aucun membre du personnel enregistré
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStaff ? 'Modifier l\'employé' : 'Nouvel employé'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Prénom *</label>
                <input type="text" required value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input type="text" required value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select required value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="">Sélectionner un rôle</option>
                  <option value="Chef">Chef</option>
                  <option value="Sous-chef">Sous-chef</option>
                  <option value="Cuisinier">Cuisinier</option>
                  <option value="Serveur">Serveur</option>
                  <option value="Manager">Manager</option>
                  <option value="Barman">Barman</option>
                  <option value="Plongeur">Plongeur</option>
                </select>
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date d'embauche</label>
                <input type="date" value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Mettre à jour' : 'Ajouter'}
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
