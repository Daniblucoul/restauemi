import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

function Inventory() {
  const { currency } = useCurrency();
  const [inventory, setInventory] = useState([]);
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/inventory', formData);
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const restockItem = async (id) => {
    const quantity = prompt('Quantité à ajouter :');
    if (quantity && !isNaN(quantity)) {
      try {
        await axios.patch(`/api/inventory/${id}/restock`, { quantity: parseFloat(quantity) });
        fetchInventory();
      } catch (error) {
        console.error('Error restocking item:', error);
      }
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
    setFormData(item);
    setShowModal(true);
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);

  return (
    <div>
      <div className="page-header">
        <h1>Gestion de l'inventaire</h1>
        <p>Suivez vos stocks et optimisez vos approvisionnements</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <FaExclamationTriangle /> {lowStockItems.length} article(s) en stock faible nécessitent un réapprovisionnement
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Articles en stock</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus /> Ajouter un article
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Stock min.</th>
              <th>Coût unitaire</th>
              <th>Valeur totale</th>
              <th>Fournisseur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id} style={{ background: item.quantity <= item.min_quantity ? '#fff5f5' : 'white' }}>
                <td>
                  <strong>{item.item_name}</strong>
                  {item.quantity <= item.min_quantity && (
                    <span style={{ color: '#f56565', marginLeft: '8px' }}>⚠️</span>
                  )}
                </td>
                <td>{item.category}</td>
                <td><strong>{item.quantity} {item.unit}</strong></td>
                <td>{item.min_quantity} {item.unit}</td>
                <td>{formatCurrency(item.cost_per_unit, currency)}</td>
                <td><strong>{formatCurrency(item.quantity * item.cost_per_unit, currency)}</strong></td>
                <td>{item.supplier || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => restockItem(item.id)}>
                      Réappro
                    </button>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => openEditModal(item)}>
                      <FaEdit />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => deleteItem(item.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Modifier l\'article' : 'Nouvel article'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom de l'article *</label>
                <input type="text" required value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Catégorie *</label>
                <input type="text" required value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Quantité *</label>
                <input type="number" step="0.01" required value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Unité *</label>
                <input type="text" required value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Stock minimum</label>
                <input type="number" step="0.01" value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Coût unitaire (€)</label>
                <input type="number" step="0.01" value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fournisseur</label>
                <input type="text" value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Mettre à jour' : 'Ajouter'}
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
