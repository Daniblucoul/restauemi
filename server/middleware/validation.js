/**
 * Validation middleware for API requests
 * Provides data validation and sanitization
 */

// Validate login request
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Nom d\'utilisateur ou email requis');
  }

  if (!password || password.length === 0) {
    errors.push('Mot de passe requis');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation échouée', 
      details: errors 
    });
  }

  next();
};

// Validate register request
const validateRegister = (req, res, next) => {
  const { username, email, password, first_name, last_name } = req.body;
  const errors = [];

  // Validate username
  if (!username || username.trim().length < 3) {
    errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email invalide');
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères');
  }

  // Validate names
  if (!first_name || first_name.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }

  if (!last_name || last_name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation échouée', 
      details: errors 
    });
  }

  next();
};

const validateOrder = (req, res, next) => {
  const { table_id, items, total_amount, status, order_type } = req.body;
  const errors = [];

  // Validate order_type
  const validOrderTypes = ['dine-in', 'takeaway', 'delivery'];
  if (order_type && !validOrderTypes.includes(order_type)) {
    errors.push(`Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`);
  }

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Items array is required and must not be empty');
  } else {
    items.forEach((item, index) => {
      if (!item.id || typeof item.id !== 'number') {
        errors.push(`Item at index ${index} must have a valid numeric id`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item at index ${index} must have a valid quantity greater than 0`);
      }
      if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
        errors.push(`Item at index ${index} must have a valid price >= 0`);
      }
    });
  }

  // Validate total_amount
  if (total_amount !== undefined && (typeof total_amount !== 'number' || total_amount < 0)) {
    errors.push('Total amount must be a number >= 0');
  }

  // Validate status
  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateInventoryItem = (req, res, next) => {
  const { item_name, quantity, unit, min_quantity, cost_per_unit, category } = req.body;
  const errors = [];

  // Validate item_name
  if (!item_name || typeof item_name !== 'string' || item_name.trim().length === 0) {
    errors.push('Item name is required and must be a non-empty string');
  }

  // Validate quantity
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
    errors.push('Quantity must be a number >= 0');
  }

  // Validate unit
  if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
    errors.push('Unit is required and must be a non-empty string');
  }

  // Validate min_quantity
  if (min_quantity !== undefined && (typeof min_quantity !== 'number' || min_quantity < 0)) {
    errors.push('Minimum quantity must be a number >= 0');
  }

  // Validate cost_per_unit
  if (cost_per_unit !== undefined && (typeof cost_per_unit !== 'number' || cost_per_unit < 0)) {
    errors.push('Cost per unit must be a number >= 0');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateReservation = (req, res, next) => {
  const { customer_name, phone_number, reservation_time, party_size, status } = req.body;
  const errors = [];

  // Validate customer_name
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
    errors.push('Customer name is required and must be a non-empty string');
  }

  // Validate phone_number
  if (!phone_number || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
    errors.push('Phone number is required and must be a non-empty string');
  }

  // Validate reservation_time
  if (!reservation_time) {
    errors.push('Reservation time is required');
  } else {
    const date = new Date(reservation_time);
    if (isNaN(date.getTime())) {
      errors.push('Reservation time must be a valid date/time');
    }
  }

  // Validate party_size
  if (party_size !== undefined && (typeof party_size !== 'number' || party_size <= 0)) {
    errors.push('Party size must be a number > 0');
  }

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateStaff = (req, res, next) => {
  const { first_name, last_name, role, status } = req.body;
  const errors = [];

  // Validate first_name
  if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
    errors.push('First name is required and must be a non-empty string');
  }

  // Validate last_name
  if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
    errors.push('Last name is required and must be a non-empty string');
  }

  // Validate role
  if (!role || typeof role !== 'string' || role.trim().length === 0) {
    errors.push('Role is required and must be a non-empty string');
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'on_leave'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateMenuItem = (req, res, next) => {
  const { name, price, category } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Menu item name is required and must be a non-empty string');
  }

  // Validate price
  if (price === undefined || typeof price !== 'number' || price < 0) {
    errors.push('Price is required and must be a number >= 0');
  }

  // Validate category
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateHACCPLog = (req, res, next) => {
  const { log_type, description, temperature, status } = req.body;
  const errors = [];

  // Validate log_type
  const validLogTypes = ['temperature', 'cleaning', 'receiving', 'storage', 'other'];
  if (!log_type || !validLogTypes.includes(log_type)) {
    errors.push(`Log type is required. Must be one of: ${validLogTypes.join(', ')}`);
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  // Validate temperature (optional but must be valid if provided)
  if (temperature !== undefined && (typeof temperature !== 'number' || isNaN(temperature))) {
    errors.push('Temperature must be a valid number if provided');
  }

  // Validate status
  const validStatuses = ['ok', 'warning', 'critical'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateSupplier = (req, res, next) => {
  const { name, phone, category, email, status } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Supplier name is required and must be a non-empty string');
  }

  // Validate phone
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    errors.push('Phone number is required and must be a non-empty string');
  }

  // Validate category
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }

  // Validate email (optional but must be valid if provided)
  if (email && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email must be a valid email address');
    }
  }

  // Validate status
  const validStatuses = ['active', 'inactive'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      error: 'Invalid ID parameter', 
      details: ['ID must be a positive integer'] 
    });
  }

  req.params.id = id; // Convert to number
  next();
};

module.exports = {
  validateLogin,
  validateRegister,
  validateOrder,
  validateInventoryItem,
  validateReservation,
  validateStaff,
  validateMenuItem,
  validateHACCPLog,
  validateSupplier,
  validateIdParam
};
