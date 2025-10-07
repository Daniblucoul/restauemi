import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaList, FaImage, FaThLarge, FaLeaf, FaDrumstickBite, FaIceCream, FaCoffee } from 'react-icons/fa';

function MenuManagement() {
  const { currency } = useCurrency();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Toutes');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Entrées',
    available: 1,
    image_url: ''
  });

  const categories = ['Entrées', 'Plats', 'Desserts', 'Boissons'];
  const allCategories = ['Toutes', ...categories];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, inventoryRes] = await Promise.all([
        axios.get('/api/menu'),
        axios.get('/api/inventory')
      ]);
      setMenuItems(menuRes.data);
      setInventoryItems(inventoryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 MB');
        return;
      }

      setImageFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', imageFile);

      const response = await axios.post('/api/upload/menu', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix sont requis');
      return;
    }

    try {
      // Upload de l'image si une nouvelle image a été sélectionnée
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const dataToSend = { ...formData, image_url: imageUrl };

      if (editingItem) {
        await axios.put(`/api/menu/${editingItem.id}`, dataToSend);
        toast.success('Article modifié avec succès ! ✅');
      } else {
        await axios.post('/api/menu', dataToSend);
        toast.success('Article ajouté au menu ! 🎉');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      available: item.available,
      image_url: item.image_url || ''
    });
    setImageFile(null);
    setImagePreview(item.image_url || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await axios.delete(`/api/menu/${id}`);
      toast.success('Article supprimé ! 🗑️');
      fetchData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleManageRecipe = async (item) => {
    setSelectedMenuItem(item);
    try {
      const response = await axios.get(`/api/recipes/${item.id}`);
      setRecipes(response.data.map(r => ({
        inventory_item_id: r.inventory_item_id,
        quantity_required: r.quantity_required,
        item_name: r.item_name,
        unit: r.unit
      })));
      setShowRecipeModal(true);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setRecipes([]);
      setShowRecipeModal(true);
    }
  };

  const handleAddIngredient = () => {
    setRecipes([...recipes, { inventory_item_id: '', quantity_required: '', item_name: '', unit: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...recipes];
    newRecipes[index][field] = value;
    
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find(item => item.id === parseInt(value));
      if (selectedItem) {
        newRecipes[index].item_name = selectedItem.item_name;
        newRecipes[index].unit = selectedItem.unit;
      }
    }
    
    setRecipes(newRecipes);
  };

  const handleSaveRecipe = async () => {
    try {
      const ingredients = recipes
        .filter(r => r.inventory_item_id && r.quantity_required)
        .map(r => ({
          inventory_item_id: parseInt(r.inventory_item_id),
          quantity_required: parseFloat(r.quantity_required)
        }));

      await axios.post('/api/recipes', {
        menu_item_id: selectedMenuItem.id,
        ingredients
      });

      toast.success('Recette enregistrée ! 👨‍🍳');
      setShowRecipeModal(false);
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Erreur lors de l\'enregistrement de la recette');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Entrées',
      available: 1,
      image_url: ''
    });
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement du menu..." />;
  }

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = menuItems.filter(item => item.category === cat);
    return acc;
  }, {});

  const categoriesToDisplay = activeCategory === 'Toutes' ? categories : [activeCategory];

  const getCategoryIcon = (category) => {
    const icons = {
      'Toutes': <FaThLarge />,
      'Entrées': <FaLeaf />,
      'Plats': <FaDrumstickBite />,
      'Desserts': <FaIceCream />,
      'Boissons': <FaCoffee />
    };
    return icons[category] || <FaUtensils />;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gestion du Menu</h1>
          <p>Gérer les articles du menu et leurs recettes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nouvel Article
        </button>
      </div>

      {/* Navigation par onglets */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px', 
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto'
      }}>
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeCategory === cat 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#f7fafc',
              color: activeCategory === cat ? 'white' : '#4a5568',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeCategory === cat ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== cat) {
                e.target.style.background = '#edf2f7';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== cat) {
                e.target.style.background = '#f7fafc';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {getCategoryIcon(cat)}
            <span>{cat}</span>
            {cat !== 'Toutes' && (
              <span style={{ 
                marginLeft: '4px', 
                padding: '2px 8px', 
                borderRadius: '12px',
                background: activeCategory === cat ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                fontSize: '12px'
              }}>
                {groupedItems[cat]?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {categoriesToDisplay.map(category => (
        <div key={category} style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#1f2937',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '8px'
          }}>
            {category} ({groupedItems[category].length})
          </h2>
          
          {groupedItems[category].length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucun article dans cette catégorie</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {groupedItems[category].map(item => (
                <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '200px', 
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<svg style="width: 48px; height: 48px; color: #9ca3af;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                        }}
                      />
                    ) : (
                      <FaImage size={48} />
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px', minHeight: '40px' }}>
                      {item.description || 'Aucune description'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                        {formatCurrency(item.price, currency)}
                      </span>
                      <span className={`badge ${item.available ? 'badge-success' : 'badge-danger'}`}>
                        {item.available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => handleManageRecipe(item)}
                        title="Gérer la recette"
                        style={{ flex: 1 }}
                      >
                        <FaUtensils /> Recette
                      </button>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => handleEdit(item)}
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(item.id)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Modal for adding/editing menu item */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Modifier l\'Article' : 'Nouvel Article'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Image du plat</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ marginBottom: '8px' }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>
                    Formats acceptés: JPG, PNG, GIF, WEBP (max 5 MB)
                  </small>
                  {(imagePreview || formData.image_url) && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <img 
                        src={imagePreview || formData.image_url} 
                        alt="Aperçu" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '150px', 
                          width: 'auto',
                          height: 'auto',
                          borderRadius: '8px', 
                          objectFit: 'contain',
                          border: '1px solid #e2e8f0'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <p style={{ display: 'none', color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        ⚠️ Image non disponible
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Prix ({currency}) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Catégorie *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available === 1}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        available: e.target.checked ? 1 : 0 
                      }))}
                    />
                    {' '}Disponible à la vente
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${uploading ? 'btn-loading' : ''}`}
                  disabled={uploading}
                >
                  {uploading ? 'Upload en cours...' : (editingItem ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for managing recipe */}
      {showRecipeModal && selectedMenuItem && (
        <div className="modal-overlay" onClick={() => setShowRecipeModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaUtensils /> Recette: {selectedMenuItem.name}
              </h2>
              <button className="modal-close" onClick={() => setShowRecipeModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                Définissez les ingrédients nécessaires pour préparer cet article. 
                Les quantités seront automatiquement déduites de l'inventaire lors d'une vente.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddIngredient}
                >
                  <FaPlus /> Ajouter un ingrédient
                </button>
              </div>

              {recipes.length === 0 ? (
                <div className="empty-state">
                  <FaList size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                  <p>Aucun ingrédient défini pour cette recette</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Cliquez sur "Ajouter un ingrédient" pour commencer
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Ingrédient</th>
                        <th>Quantité Requise</th>
                        <th>Unité</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.map((recipe, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              value={recipe.inventory_item_id}
                              onChange={(e) => handleRecipeChange(index, 'inventory_item_id', e.target.value)}
                              style={{ width: '100%' }}
                            >
                              <option value="">-- Sélectionner --</option>
                              {inventoryItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.item_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={recipe.quantity_required}
                              onChange={(e) => handleRecipeChange(index, 'quantity_required', e.target.value)}
                              step="0.01"
                              min="0"
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>{recipe.unit || '-'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveIngredient(index)}
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
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowRecipeModal(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveRecipe}
              >
                Enregistrer la Recette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
