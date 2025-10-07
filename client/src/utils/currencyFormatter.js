export const formatCurrency = (amount, currency = 'FCFA') => {
  // Default to FCFA if no currency provided
  if (!currency) {
    currency = 'FCFA';
  }

  // Intl.NumberFormat doesn't natively support FCFA, so we handle it manually.
  if (currency === 'FCFA') {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount) + ' FCFA';
  }

  const options = { style: 'currency', currency };
  
  // The 'fr' locale generally works well for EUR formatting.
  // The 'en' locale is standard for USD.
  let locale = 'fr-FR';
  if (currency === 'USD') {
    locale = 'en-US';
  }

  return new Intl.NumberFormat(locale, options).format(amount);
};
