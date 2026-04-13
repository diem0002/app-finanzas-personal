import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useStore from '../store/useStore';
import { useFinanceData } from '../hooks/useFinanceData';
import Value from '../components/Value';
import { PiggyBank, ArrowDownCircle, X } from 'lucide-react';

export default function Sobrantes() {
  const userId = useStore((state) => state.userId);
  const { sobrantes, totals, loading } = useFinanceData();
  const [modalType, setModalType] = useState(null); // 'convertir', 'retirar'
  
  const [amount, setAmount] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    if (!userId || !amount) return;

    const amt = Number(amount);

    if (amt > totals.sobrantes) {
      alert("No tienes suficientes sobrantes para realizar esta acción.");
      return;
    }

    if (modalType === 'retirar') {
      await addDoc(collection(db, `users/${userId}/sobrantes`), {
        amount: -amt,
        desc: 'Retiro de Sobrante',
        createdAt: serverTimestamp()
      });
    } else if (modalType === 'convertir') {
      // 1. Restar de sobrantes
      await addDoc(collection(db, `users/${userId}/sobrantes`), {
        amount: -amt,
        desc: 'Conversión a Ahorro',
        createdAt: serverTimestamp()
      });
      
      // 2. Sumar a ahorros
      await addDoc(collection(db, `users/${userId}/ahorros`), {
        amountArs: amt,
        type: 'conversion',
        desc: 'Ingreso desde Sobrantes',
        createdAt: serverTimestamp()
      });
    }

    setModalType(null);
    setAmount('');
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sobrantes</h2>

      <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Sobrantes Activos</p>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
          <Value amount={totals.sobrantes} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setModalType('convertir')} className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}>
          <PiggyBank size={16} /> Enviar a Ahorros
        </button>
        <button onClick={() => setModalType('retirar')} className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}>
          <ArrowDownCircle size={16} /> Retirar
        </button>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '1rem 0' }}>Historial</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sobrantes.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No hay movimientos aún.</p>}
          {sobrantes.map(t => (
            <div key={t.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.desc}</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>{t.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: t.amount > 0 ? 'var(--secondary)' : 'var(--text-main)' }}>
                 {t.amount > 0 ? '+' : ''}<Value amount={t.amount} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalType && (
        <Modal title={modalType === 'convertir' ? 'Mover a Ahorros' : 'Retirar Sobrante'} onClose={() => setModalType(null)}>
          <form onSubmit={handleAction}>
            <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
              Monto a {modalType === 'convertir' ? 'convertir' : 'retirar'} (Max: <Value amount={totals.sobrantes} />)
            </label>
            <input 
              className="input-field" 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              max={totals.sobrantes}
              required 
            />
            <button className="btn-primary" style={{ width: '100%' }}>Confirmar</button>
          </form>
        </Modal>
      )}

    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card animate-slide-up" style={{ width: '90%', maxWidth: '400px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="title" style={{ marginBottom: 0, fontSize: '1.2rem' }}>{title}</h3>
          <button onClick={onClose}><X size={20} color="var(--text-muted)"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
