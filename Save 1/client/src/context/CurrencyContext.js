import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('FCFA'); // Default currency

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await axios.get('/api/settings/currency');
        setCurrency(response.data.currency);
      } catch (error) {
        console.error('Error fetching currency:', error);
      }
    };

    fetchCurrency();
  }, []);

  const updateCurrency = async (newCurrency) => {
    try {
      await axios.put('/api/settings/currency', { currency: newCurrency });
      setCurrency(newCurrency);
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
