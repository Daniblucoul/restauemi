import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelector = () => {
  const { currency, updateCurrency } = useCurrency();

  const handleCurrencyChange = (e) => {
    updateCurrency(e.target.value);
  };

  return (
    <div className="currency-selector">
      <label htmlFor="currency">Devise: </label>
      <select id="currency" value={currency} onChange={handleCurrencyChange}>
        <option value="FCFA">FCFA</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
    </div>
  );
};

export default CurrencySelector;
