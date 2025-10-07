import React, { useState, useEffect } from 'react';
import axios from 'axios';

function HACCP() {
  const [temperatureLogs, setTemperatureLogs] = useState([]);
  const [hygieneChecks, setHygieneChecks] = useState([]);
  const [activeTab, setActiveTab] = useState('temperature');

  useEffect(() => {
    fetchTemperatureLogs();
    fetchHygieneChecks();
  }, []);

  const fetchTemperatureLogs = async () => {
    try {
      const response = await axios.get('/api/haccp/temperature');
      setTemperatureLogs(response.data);
    } catch (error) {
      console.error('Error fetching temperature logs:', error);
    }
  };

  const fetchHygieneChecks = async () => {
    try {
      const response = await axios.get('/api/haccp/hygiene');
      setHygieneChecks(response.data);
    } catch (error) {
      console.error('Error fetching hygiene checks:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Conformité HACCP</h1>
        <p>Suivi des normes d'hygiène et de sécurité alimentaire</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'temperature' ? '3px solid #667eea' : 'none', fontWeight: activeTab === 'temperature' ? 'bold' : 'normal' }}
            onClick={() => setActiveTab('temperature')}>
            Contrôles de température
          </button>
          <button 
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'hygiene' ? '3px solid #667eea' : 'none', fontWeight: activeTab === 'hygiene' ? 'bold' : 'normal' }}
            onClick={() => setActiveTab('hygiene')}>
            Contrôles d'hygiène
          </button>
        </div>

        {activeTab === 'temperature' && (
          <div>
            <h2>Contrôles de température</h2>
            <table>
              <thead>
                <tr>
                  <th>Équipement</th>
                  <th>Température</th>
                  <th>Statut</th>
                  <th>Contrôlé par</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {temperatureLogs.map(log => (
                  <tr key={log.id}>
                    <td><strong>{log.equipment_name}</strong></td>
                    <td>{log.temperature}°{log.unit === 'celsius' ? 'C' : 'F'}</td>
                    <td>
                      <span className={`badge ${log.status === 'normal' ? 'badge-success' : 'badge-danger'}`}>
                        {log.status === 'normal' ? 'Normal' : 'Alerte'}
                      </span>
                    </td>
                    <td>{log.recorded_by || '-'}</td>
                    <td>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {temperatureLogs.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                Aucun contrôle de température enregistré
              </p>
            )}
          </div>
        )}

        {activeTab === 'hygiene' && (
          <div>
            <h2>Contrôles d'hygiène</h2>
            <table>
              <thead>
                <tr>
                  <th>Type de contrôle</th>
                  <th>Zone</th>
                  <th>Statut</th>
                  <th>Contrôlé par</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {hygieneChecks.map(check => (
                  <tr key={check.id}>
                    <td><strong>{check.check_type}</strong></td>
                    <td>{check.area}</td>
                    <td>
                      <span className={`badge ${check.status === 'conforme' ? 'badge-success' : 'badge-warning'}`}>
                        {check.status}
                      </span>
                    </td>
                    <td>{check.checked_by || '-'}</td>
                    <td>{new Date(check.created_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hygieneChecks.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                Aucun contrôle d'hygiène enregistré
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HACCP;
