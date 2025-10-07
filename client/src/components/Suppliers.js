import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaTruck, FaPhone, FaEnvelope, FaMapMarkerAlt, FaInfoCircle, FaBox } from 'react-icons/fa';

function Suppliers() {
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierStats, setSupplierStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    status: 'active',
    payment_terms: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filterStatus, filterCategory]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;

      const response = await axios.get('/api/suppliers', { params });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.phone || !formData.category) {
      toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingSupplier) {
        await axios.put(`/api/suppliers/${editingSupplier.id}`, formData);
        toast.success('Fournisseur mis à jour ! ✓');
      } else {
        await axios.post('/api/suppliers', formData);
        toast.success('Fournisseur ajouté ! 🚚');
      }
      
      setShowModal(false);
      setEditingSupplier(null);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
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

  const deleteSupplier = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return;
    }

    try {
      await axios.delete(`/api/suppliers/${id}`);
      toast.success('Fournisseur supprimé avec succès');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la suppression';
      const errorDetails = error.errorDetails || [];
      
      if (errorDetails.length > 0) {
        toast.error(`${errorMessage}: ${errorDetails.join(', ')}`, 6000);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/suppliers/${id}/status`, { status });
      toast.success(`Statut mis à jour: ${getStatusLabel(status)}`);
      fetchSuppliers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const viewStats = async (supplier) => {
    setLoadingStats(true);
    setShowStatsModal(true);
    setSupplierStats(null);

    try {
      const response = await axios.get(`/api/suppliers/${supplier.id}/stats`);
      setSupplierStats(response.data);
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
      setShowStatsModal(false);
    } finally {
      setLoadingStats(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      status: 'active',
      payment_terms: '',
      notes: ''
    });
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone,
      address: supplier.address || '',
      category: supplier.category,
      status: supplier.status,
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Actif',
      'inactive': 'Inactif'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'inactive': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Fruits et Légumes': '🥬',
      'Viandes': '🥩',
      'Poissons et Fruits de mer': '🐟',
      'Épicerie sèche': '🏪',
      'Produits laitiers': '🥛',
      'Boissons': '🥤'
    };
    return icons[category] || '📦';
  };

  // Get unique categories from suppliers
  const categories = [...new Set(suppliers.map(s => s.category))].sort();

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement des fournisseurs..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des Fournisseurs</h1>
        <p>Gérez vos fournisseurs et leurs informations</p>
      </div>

      <div className="actions-bar">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>

          {categories.length > 0 && (
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> Ajouter un Fournisseur
            </button>
          </div>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state">
          <FaTruck size={64} color="#d1d5db" />
          <h3>Aucun fournisseur</h3>
          <p>Ajoutez votre premier fournisseur pour commencer</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Ajouter un Fournisseur
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>Conditions</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>#{supplier.id}</td>
                  <td className="font-bold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaTruck style={{ color: '#667eea' }} />
                      {supplier.name}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {getCategoryIcon(supplier.category)} {supplier.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      {supplier.contact_person && (
                        <div>{supplier.contact_person}</div>
                      )}
                      {supplier.email && (
                        <div style={{ color: '#6b7280' }}>
                          <FaEnvelope style={{ fontSize: '10px', marginRight: '4px' }} />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <FaPhone style={{ fontSize: '10px', marginRight: '4px', color: '#6b7280' }} />
                    {supplier.phone}
                  </td>
                  <td>{supplier.payment_terms || '-'}</td>
                  <td>
                    <select
                      value={supplier.status}
                      onChange={(e) => updateStatus(supplier.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(supplier.status),
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
                    </select>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn-icon btn-info"
                        onClick={() => viewStats(supplier)}
                        title="Statistiques"
                      >
                        <FaBox />
                      </button>
                      <button 
                        className="btn-icon btn-secondary"
                        onClick={() => openEditModal(supplier)}
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => deleteSupplier(supplier.id)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
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
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Nom du fournisseur *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Marché Central"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Catégorie *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: Fruits et Légumes"
                      required
                      disabled={submitting}
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      <option value="Fruits et Légumes" />
                      <option value="Viandes" />
                      <option value="Poissons et Fruits de mer" />
                      <option value="Épicerie sèche" />
                      <option value="Produits laitiers" />
                      <option value="Boissons" />
                    </datalist>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Personne de contact</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Nom du contact"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+237 690 123 456"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@fournisseur.com"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète"
                    disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Conditions de paiement</label>
                    <input
                      type="text"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                      placeholder="Ex: Net 30, Comptant..."
                      disabled={submitting}
                    />
                  </div>

                  {editingSupplier && (
                    <div className="form-group">
                      <label>Statut</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        disabled={submitting}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes supplémentaires..."
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
                    setEditingSupplier(null);
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
                  {submitting ? 'Enregistrement...' : (editingSupplier ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Statistiques */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>
                <FaBox style={{ marginRight: '8px' }} />
                Statistiques - {supplierStats?.supplier_name || 'Chargement...'}
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setShowStatsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {loadingStats ? (
                <LoadingSpinner message="Chargement des statistiques..." />
              ) : supplierStats ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div className="stat-card">
                      <div className="stat-value">{supplierStats.total_items}</div>
                      <div className="stat-label">Articles en stock</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{supplierStats.total_stock_value.toLocaleString()} FCFA</div>
                      <div className="stat-label">Valeur totale</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: supplierStats.low_stock_items > 0 ? '#f59e0b' : '#10b981' }}>
                        {supplierStats.low_stock_items}
                      </div>
                      <div className="stat-label">Stock faible</div>
                    </div>
                  </div>

                  {supplierStats.items && supplierStats.items.length > 0 ? (
                    <div>
                      <h3 style={{ marginBottom: '15px' }}>Articles fournis</h3>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Article</th>
                              <th>Catégorie</th>
                              <th>Quantité</th>
                              <th>Unité</th>
                              <th>Coût/Unité</th>
                              <th>Valeur totale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierStats.items.map(item => (
                              <tr key={item.id} style={{ 
                                backgroundColor: item.quantity <= item.min_quantity ? '#fef3c7' : 'transparent' 
                              }}>
                                <td className="font-bold">{item.item_name}</td>
                                <td>{item.category || '-'}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unit}</td>
                                <td>{item.cost_per_unit.toLocaleString()} FCFA</td>
                                <td>{(item.quantity * item.cost_per_unit).toLocaleString()} FCFA</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FaInfoCircle size={48} color="#d1d5db" />
                      <p>Aucun article en stock pour ce fournisseur</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <FaInfoCircle size={48} color="#d1d5db" />
                  <p>Impossible de charger les statistiques</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowStatsModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
