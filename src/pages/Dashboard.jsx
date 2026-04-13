import { Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import Value from '../components/Value';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinanceData } from '../hooks/useFinanceData';

export default function Dashboard() {
  const isHidden = useStore((state) => state.isHidden);
  const toggleHidden = useStore((state) => state.toggleHidden);
  const { totals, loading } = useFinanceData();

  const currentDate = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Cargando datos...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header bar within Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Resumen General</h2>
          <p className="text-muted" style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{currentDate}</p>
        </div>
        
        <button onClick={toggleHidden} className="btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', color: 'white' }}>
        <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Patrimonio Total Estimado (ARS)</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
          <Value amount={totals.granTotalArs} />
        </div>
        <p style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '0.5rem' }}>Incluye Sueldos, Ahorros (Pesos) y Sobrantes.</p>
      </div>

      <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', color: 'white' }}>
        <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Sueldos Activos</p>
        <div style={{ fontSize: '2rem', fontWeight: 600 }}>
          <Value amount={totals.sueldos} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ahorros (ARS)</p>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            <Value amount={totals.ahorrosArs} />
          </div>
        </div>

        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ahorros (USD)</p>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--secondary)' }}>
            <Value amount={totals.ahorrosUsd} currencySymbol="U$D " />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Sobrantes Totales</p>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          <Value amount={totals.sobrantes} />
        </div>
      </div>

    </div>
  );
}
