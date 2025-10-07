export const formatCurrency = (amount, currency) => {
  const options = { style: 'currency', currency };
  
  // The 'fr' locale generally works well for FCFA and EUR formatting.
  // The 'en' locale is standard for USD.
  let locale = 'fr-FR';
  if (currency === 'USD') {
    locale = 'en-US';
  }

  // Intl.NumberFormat doesn't natively support FCFA, so we handle it manually.
  if (currency === 'FCFA') {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount) + ' FCFA';
  }

  return new Intl.NumberFormat(locale, options).format(amount);
};
