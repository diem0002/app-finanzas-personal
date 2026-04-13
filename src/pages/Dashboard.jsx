import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import Value from '../components/Value';
import { format, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinanceData } from '../hooks/useFinanceData';

export default function Dashboard() {
  const isHidden = useStore((state) => state.isHidden);
  const toggleHidden = useStore((state) => state.toggleHidden);
  const { totals, historialSueldos, gastos, loading } = useFinanceData();

  // Selected Month (YYYY-MM). Default is empty string (means Current Live Month)
  const [selectedMonth, setSelectedMonth] = useState('');

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const isHistorical = selectedMonth && selectedMonth !== currentMonthStr;

  // Calculate historical values if a past month is selected
  let dSueldos = totals.sueldos;
  let dGastos = totals.gastos;
  let dAguinaldo = totals.aguinaldos;
  let dNeto = dSueldos + dAguinaldo - dGastos;

  if (isHistorical) {
    // Para historial, usamos el snapshot de sueldos que se guardó en "Renovar Mes"
    // El "historial_sueldos" tiene { mes: "2026-03", salary: X, gastosTotales: Y, aguinaldo: Z }
    
    // Sueldos y aguinaldo guardados en historial para ese mes
    const sueldosHist = historialSueldos.filter(h => h.mes === selectedMonth).reduce((acc, h) => acc + Number(h.salary), 0);
    const aguinaldosHist = historialSueldos.filter(h => h.mes === selectedMonth).reduce((acc, h) => acc + (Number(h.aguinaldo) || 0), 0);
    
    // Gastos que se cargaron durante ese mes (basado en la fecha del gasto)
    const gastosHist = gastos.filter(g => {
      if (!g.date) return false;
      const tDate = g.date.toDate();
      const tStr = format(tDate, 'yyyy-MM');
      return tStr === selectedMonth;
    }).reduce((acc, g) => acc + Number(g.amount), 0);
    
    dSueldos = sueldosHist;
    dGastos = gastosHist;
    dAguinaldo = aguinaldosHist;
    // El neto histórico es sueldo base + aguinaldo - gastos
    dNeto = dSueldos + dAguinaldo - dGastos;
  }

  const currentDate = isHistorical 
    ? format(parseISO(`${selectedMonth}-01`), "MMMM yyyy", { locale: es }) 
    : format(new Date(), "MMMM yyyy", { locale: es });

  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Cargando datos...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header bar within Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Resumen {isHistorical ? 'Histórico' : 'General'}</h2>
          <p className="text-muted" style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{currentDate}</p>
        </div>
        
        <button onClick={toggleHidden} className="btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input 
          type="month" 
          value={selectedMonth || currentMonthStr} 
          onChange={(e) => setSelectedMonth(e.target.value)} 
          className="input-field" 
          style={{ marginBottom: 0, flex: 1 }}
        />
        {isHistorical && (
          <button onClick={() => setSelectedMonth('')} className="btn-outline" style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
            Volver a Actual
          </button>
        )}
      </div>

      {/* Solo mostramos el Patrimonio global si no estamos viendo el historial */}
      {!isHistorical && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', color: 'white' }}>
          <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Patrimonio Total Estimado (ARS)</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            <Value amount={totals.granTotalArs} />
          </div>
          <p style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '0.5rem' }}>Incluye Sueldos netos, Ahorros (Pesos) y Sobrantes.</p>
        </div>
      )}

      <div className="glass-card" style={{ background: 'var(--bg-glass)', border: `1px solid ${isHistorical ? 'var(--primary)' : 'var(--glass-border)'}` }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: isHistorical ? 'var(--primary)' : 'inherit' }}>
          Flujo de Trabajo ({isHistorical ? currentDate : 'Actual'})
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Sueldos Brutos</span>
          <span style={{ fontWeight: 500 }}><Value amount={dSueldos} /></span>
        </div>
        
        {dAguinaldo > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Aguinaldo / Bonos</span>
            <span className="text-secondary" style={{ fontWeight: 500 }}>+ <Value amount={dAguinaldo} /></span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border-color)' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Viáticos/Gastos</span>
          <span className="text-danger" style={{ fontWeight: 500 }}>- <Value amount={dGastos} /></span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Sueldo Neto Disp.</span>
          <span className="text-primary" style={{ fontSize: '1.25rem', fontWeight: 700 }}><Value amount={dNeto} /></span>
        </div>

        {isHistorical && dSueldos === 0 && (
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
            No cerraste/renovaste meses durante este período histórico.
          </p>
        )}
      </div>

      {!isHistorical && (
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
      )}

      {!isHistorical && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Sobrantes Totales</p>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            <Value amount={totals.sobrantes} />
          </div>
        </div>
      )}

    </div>
  );
}
