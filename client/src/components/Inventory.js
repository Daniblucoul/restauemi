import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaBox } from 'react-icons/fa';

function Inventory() {
  const { currency } = useCurrency();
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity: '',
    unit: '',
    min_quantity: '',
    cost_per_unit: '',
    supplier: ''
  });

  // Listes prédéfinies
  const categories = [
    'Fruits et Légumes',
    'Viandes',
    'Poissons et Fruits de mer',
    'Produits laitiers',
    'Épicerie sèche',
    'Boissons',
    'Épices et condiments',
    'Pains et pâtisseries',
    'Surgelés',
    'Autre'
  ];

  const units = [
    'kg',
    'g',
    'L',
    'mL',
    'unité',
    'pièce',
    'paquet',
    'boîte',
    'bouteille',
    'sac'
  ];

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Erreur lors du chargement de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers', { params: { status: 'active' } });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // Ne pas afficher de toast pour ne pas surcharger l'interface
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.item_name || !formData.unit) {
      toast.warning('Le nom de l\'article et l\'unité sont obligatoires');
      return;
    }

    setSubmitting(true);
    
    try {
      // Préparer les données en convertissant les champs numériques
      const dataToSend = {
        item_name: formData.item_name,
        category: formData.category || '',
        unit: formData.unit,
        supplier: formData.supplier || '',
        // Convertir les champs numériques, ou ne pas les inclure s'ils sont vides
        ...(formData.quantity && { quantity: parseFloat(formData.quantity) }),
        ...(formData.min_quantity && { min_quantity: parseFloat(formData.min_quantity) }),
        ...(formData.cost_per_unit && { cost_per_unit: parseFloat(formData.cost_per_unit) })
      };

      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, dataToSend);
        toast.success('Article mis à jour avec succès ! ✓');
      } else {
        await axios.post('/api/inventory', dataToSend);
        toast.success('Article ajouté avec succès ! 🎉');
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
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

  const deleteItem = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await axios.delete(`/api/inventory/${id}`);
      toast.success('Article supprimé avec succès');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la suppression';
      toast.error(errorMessage, 5000);
    }
  };

  const restockItem = async (id) => {
    const quantity = prompt('Quantité à ajouter :');
    
    if (!quantity) return;
    
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.warning('Veuillez entrer une quantité valide et positive');
      return;
    }

    try {
      await axios.patch(`/api/inventory/${id}/restock`, { quantity: parsedQuantity });
      toast.success(`+${parsedQuantity} unité(s) ajoutée(s) ! 📦`);
      fetchInventory();
    } catch (error) {
      console.error('Error restocking item:', error);
      const errorMessage = error.userMessage || 'Erreur lors du réapprovisionnement';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      quantity: '',
      unit: '',
      min_quantity: '',
      cost_per_unit: '',
      supplier: ''
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity || 0,
      cost_per_unit: item.cost_per_unit || 0,
      supplier: item.supplier || ''
    });
    setShowModal(true);
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement de l'inventaire..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gestion de l'inventaire</h1>
        <p>Suivez vos stocks et optimisez vos approvisionnements</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <FaExclamationTriangle /> 
          <strong>Attention !</strong> {lowStockItems.length} article(s) en stock faible nécessitent un réapprovisionnement
        </div>
      )}

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nouvel Article
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="empty-state">
          <FaBox size={64} color="#d1d5db" />
          <h3>Aucun article en inventaire</h3>
          <p>Commencez par ajouter des articles à votre inventaire</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Ajouter un article
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>Seuil Min</th>
                <th>Coût/Unité</th>
                <th>Fournisseur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const isLowStock = item.quantity <= item.min_quantity;
                return (
                  <tr key={item.id} className={isLowStock ? 'row-warning' : ''}>
                    <td className="font-bold">{item.item_name}</td>
                    <td>{item.category || '-'}</td>
                    <td className={isLowStock ? 'text-danger font-bold' : ''}>
                      {item.quantity}
                    </td>
                    <td>{item.unit}</td>
                    <td>{item.min_quantity || 0}</td>
                    <td>{formatCurrency(item.cost_per_unit || 0, currency)}</td>
                    <td>{item.supplier || '-'}</td>
                    <td>
                      {isLowStock ? (
                        <span className="badge badge-warning">
                          <FaExclamationTriangle /> Stock faible
                        </span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn-icon btn-primary"
                          onClick={() => restockItem(item.id)}
                          title="Réapprovisionner"
                        >
                          +
                        </button>
                        <button 
                          className="btn-icon btn-secondary"
                          onClick={() => openEditModal(item)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-icon btn-danger"
                          onClick={() => deleteItem(item.id)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajout/Édition */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Modifier l\'article' : 'Nouvel article'}</h2>
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
                  <label>Nom de l'article *</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    placeholder="Ex: Tomates, Poulet, etc."
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantité</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Unité *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      required
                      disabled={submitting}
                    >
                      <option value="">Sélectionner une unité</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Seuil minimum</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: e.target.value }))}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Coût par unité</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Fournisseur</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="">Aucun fournisseur</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
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
                  {submitting ? 'Enregistrement...' : (editingItem ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
