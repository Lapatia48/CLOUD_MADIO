import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

const ConfigurationPage = () => {
  const navigate = useNavigate();
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [originalValue, setOriginalValue] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const response = await http.get('/api/configuration/max-attempts');
      const value = response.data.valeur ? parseInt(response.data.valeur) : 3;
      setMaxAttempts(value);
      setOriginalValue(value);
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (maxAttempts < 1 || maxAttempts > 10) {
      setMessage({ type: 'error', text: 'Le nombre de tentatives doit être entre 1 et 10' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Mettre à jour dans PostgreSQL
      await http.put('/api/configuration/max-attempts', { valeur: maxAttempts.toString() });
      
      // Synchroniser vers Firebase
      await http.post('/api/configuration/sync');
      
      setOriginalValue(maxAttempts);
      setMessage({ 
        type: 'success', 
        text: `✅ Configuration mise à jour! Max attempts = ${maxAttempts} (synchronisé avec Firebase)` 
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erreur lors de la sauvegarde' 
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = maxAttempts !== originalValue;

  return (
    <div className="configuration-page">
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/accounts')}>← Retour</button>
        <h1>⚙️ Configuration</h1>
      </div>

      <div className="config-content">
        {loading ? (
          <div className="loading-spinner">Chargement...</div>
        ) : (
          <>
            <div className="config-card">
              <h2>🔐 Tentatives de connexion</h2>
              <p>Nombre maximum de tentatives échouées avant le blocage automatique du compte</p>
              
              <div className="config-input-group">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                />
                <span className="current-value">
                  Valeur actuelle: {originalValue}
                </span>
              </div>

              <button 
                className="btn-save" 
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder et synchroniser Firebase'}
              </button>

              {message && (
                <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                  {message.text}
                </div>
              )}
            </div>

            <div className="config-card">
              <h2>📱 Fonctionnement</h2>
              <p>Cette configuration est synchronisée avec Firebase et utilisée par l'application mobile.</p>
              <div className="option-features" style={{ marginTop: '1rem' }}>
                <span>• L'app mobile compte les tentatives échouées</span>
                <span>• Si le nombre dépasse {maxAttempts}, le compte est automatiquement bloqué</span>
                <span>• Le blocage est synchronisé vers PostgreSQL</span>
                <span>• Le déblocage depuis le web remet les tentatives à 0</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;
