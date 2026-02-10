import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';

const PrixM2ConfigPage = () => {
  const navigate = useNavigate();
  const [prix, setPrix] = useState('');
  const [originalPrix, setOriginalPrix] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    http.get('/api/prix-metre-carre/current')
      .then((res: { data: { prix: number } }) => {
        const val = String(res.data.prix);
        setPrix(val);
        setOriginalPrix(val);
      })
      .catch(() => setMessage({ type: 'error', text: 'Erreur lors du chargement du prix.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    const num = parseFloat(prix);
    if (isNaN(num) || num <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un prix valide.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    http.put('/api/prix-metre-carre/current', { prix: num })
      .then((res: { data: { prix: number } }) => {
        const val = String(res.data.prix);
        setPrix(val);
        setOriginalPrix(val);
        setMessage({ type: 'success', text: 'Prix mis a jour avec succes.' });
      })
      .catch(() => setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' }))
      .finally(() => setSaving(false));
  };

  const hasChanged = prix !== originalPrix;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B3A5C 0%, #2C5F8A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    card: {
      background: '#fff',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '480px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '32px',
    },
    backBtn: {
      background: 'none',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    title: {
      fontSize: '22px',
      fontWeight: 700,
      color: '#1B3A5C',
      margin: 0,
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#555',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '20px',
      fontWeight: 600,
      border: '2px solid #e0e0e0',
      borderRadius: '10px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
    },
    unit: {
      fontSize: '13px',
      color: '#888',
      marginTop: '6px',
    },
    saveBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      fontWeight: 600,
      color: '#fff',
      background: hasChanged ? '#4A90D9' : '#aaa',
      border: 'none',
      borderRadius: '10px',
      cursor: hasChanged ? 'pointer' : 'not-allowed',
      marginTop: '24px',
      transition: 'background 0.2s',
    },
    msgSuccess: {
      marginTop: '16px',
      padding: '12px',
      borderRadius: '8px',
      background: '#e6f9ed',
      color: '#1a7a3a',
      fontSize: '14px',
      textAlign: 'center' as const,
    },
    msgError: {
      marginTop: '16px',
      padding: '12px',
      borderRadius: '8px',
      background: '#fde8e8',
      color: '#c0392b',
      fontSize: '14px',
      textAlign: 'center' as const,
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ textAlign: 'center', color: '#888' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/manager')}>
            Retour
          </button>
          <h1 style={styles.title}>Prix au m2</h1>
        </div>

        <label style={styles.label}>Valeur actuelle (Ariary / m2)</label>
        <input
          style={styles.input}
          type="number"
          min="0"
          step="1000"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
        />
        <p style={styles.unit}>Ce prix est utilise pour calculer automatiquement le budget des signalements.</p>

        <button
          style={styles.saveBtn}
          disabled={!hasChanged || saving}
          onClick={handleSave}
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>

        {message && (
          <div style={message.type === 'success' ? styles.msgSuccess : styles.msgError}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrixM2ConfigPage;
