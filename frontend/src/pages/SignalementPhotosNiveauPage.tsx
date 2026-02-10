import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type Signalement = {
  id: number;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  photoBase64?: string;
  photoUrl?: string;
  dateSignalement?: string;
};

type NiveauData = {
  id: number;
  idSignalement: number;
  niveau: number;
};

const SignalementPhotosNiveauPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [niveau, setNiveau] = useState<NiveauData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [sigRes, nivRes] = await Promise.all([
        fetch('http://localhost:8080/api/signalements/' + id),
        fetch('http://localhost:8080/api/niveau-signalement/signalement/' + id),
      ]);

      if (sigRes.ok) {
        const sigData = await sigRes.json();
        setSignalement(sigData);
      }

      if (nivRes.ok) {
        const nivData = await nivRes.json();
        if (nivData && nivData.niveau) {
          setNiveau(nivData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoSrc = (): string | null => {
    if (signalement?.photoBase64) {
      if (signalement.photoBase64.startsWith('data:')) {
        return signalement.photoBase64;
      }
      return 'data:image/jpeg;base64,' + signalement.photoBase64;
    }
    if (signalement?.photoUrl) {
      return signalement.photoUrl;
    }
    return null;
  };

  const getNiveauColor = (n: number) => 'hsl(' + ((10 - n) * 12) + ', 80%, 50%)';

  const getNiveauLabel = (n: number) => {
    if (n <= 3) return 'Mineur';
    if (n <= 6) return 'Modere';
    if (n <= 8) return 'Important';
    return 'Critique';
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!signalement) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.notFound}>
          <h2>Signalement non trouve</h2>
          <button onClick={() => navigate('/manager')} style={styles.btnBack}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const photoSrc = getPhotoSrc();

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/signalement/' + id)} style={styles.btnBack}>
            &#8592; Retour au signalement
          </button>
          <h1 style={styles.title}>Photos et Niveau - Signalement #{signalement.id}</h1>
        </div>

        <div style={styles.content}>
          {/* Photo Section */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Photo du signalement</h2>
            {photoSrc ? (
              <div style={styles.photoContainer}>
                <img src={photoSrc} alt="Photo du signalement" style={styles.photo} />
              </div>
            ) : (
              <div style={styles.noPhoto}>
                <p>Aucune photo disponible pour ce signalement</p>
              </div>
            )}
            {signalement.description && (
              <p style={styles.description}>
                <strong>Description :</strong> {signalement.description}
              </p>
            )}
          </div>

          {/* Niveau Section */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Niveau du signalement</h2>
            {niveau ? (
              <div style={styles.niveauDisplay}>
                <div
                  style={{
                    ...styles.niveauCircle,
                    background: 'conic-gradient(' + getNiveauColor(niveau.niveau) + ' ' + (niveau.niveau * 10) + '%, #e0e0e0 0)',
                  }}
                >
                  <div style={styles.niveauInner}>
                    <span style={{ ...styles.niveauNumber, color: getNiveauColor(niveau.niveau) }}>
                      {niveau.niveau}
                    </span>
                    <span style={styles.niveauMax}>/10</span>
                  </div>
                </div>

                <div style={styles.niveauDetails}>
                  <div style={{
                    ...styles.niveauBadge,
                    background: getNiveauColor(niveau.niveau),
                  }}>
                    {getNiveauLabel(niveau.niveau)}
                  </div>

                  <div style={styles.niveauBarContainer}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.niveauBarSegment,
                          background: i < niveau.niveau ? getNiveauColor(niveau.niveau) : '#e0e0e0',
                        }}
                      />
                    ))}
                  </div>

                  <p style={styles.niveauHint}>
                    {niveau.niveau <= 3 && 'Degradation mineure - intervention non urgente.'}
                    {niveau.niveau > 3 && niveau.niveau <= 6 && 'Degradation moderee - planifier une intervention.'}
                    {niveau.niveau > 6 && niveau.niveau <= 8 && 'Degradation importante - intervention recommandee rapidement.'}
                    {niveau.niveau > 8 && 'Degradation critique - intervention urgente requise !'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={styles.noNiveau}>
                <p>Aucun niveau n a encore ete attribue a ce signalement.</p>
                <button
                  onClick={() => navigate('/signalement/' + id)}
                  style={styles.btnAssign}
                >
                  Attribuer un niveau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: '#F5F1E8',
    padding: '2rem',
  },
  container: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  btnBack: {
    padding: '0.6rem 1.2rem',
    background: 'transparent',
    color: '#7F8C8D',
    border: '1.5px solid rgba(74,144,226,0.15)',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '1rem',
    display: 'inline-block',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: '#2C3E50',
    margin: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    border: '1px solid rgba(74,144,226,0.12)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#2C3E50',
    marginTop: 0,
    marginBottom: '1.5rem',
  },
  photoContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#F5F1E8',
  },
  photo: {
    width: '100%',
    maxHeight: 500,
    objectFit: 'contain' as const,
    display: 'block',
  },
  noPhoto: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#7F8C8D',
  },
  description: {
    marginTop: '1rem',
    color: '#2C3E50',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  niveauDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap' as const,
  },
  niveauCircle: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  niveauInner: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
  },
  niveauNumber: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  niveauMax: {
    fontSize: '1rem',
    color: '#7F8C8D',
    fontWeight: 500,
  },
  niveauDetails: {
    flex: 1,
  },
  niveauBadge: {
    display: 'inline-block',
    padding: '0.4rem 1.2rem',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  niveauBarContainer: {
    display: 'flex',
    gap: 4,
    marginBottom: '1rem',
  },
  niveauBarSegment: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  niveauHint: {
    color: '#7F8C8D',
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: 1.5,
  },
  noNiveau: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#7F8C8D',
  },
  btnAssign: {
    marginTop: '1rem',
    padding: '0.6rem 1.5rem',
    background: 'linear-gradient(135deg, #4A90E2, #6AA8F4)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#7F8C8D',
  },
  notFound: {
    textAlign: 'center' as const,
    padding: '3rem',
  },
};

export default SignalementPhotosNiveauPage;
