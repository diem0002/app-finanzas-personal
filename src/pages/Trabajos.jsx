import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useStore from '../store/useStore';
import { useFinanceData } from '../hooks/useFinanceData';
import Value from '../components/Value';
import { Plus, Briefcase, RefreshCw, X } from 'lucide-react';

export default function Trabajos() {
  const userId = useStore((state) => state.userId);
  const { trabajos, loading } = useFinanceData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(null); // id del trabajo a renovar
  
  // States for Add
  const [newTitle, setNewTitle] = useState('');
  const [newSalary, setNewSalary] = useState('');

  // States for Renew
  const [leftoverAmt, setLeftoverAmt] = useState('');
  const [nextSalary, setNextSalary] = useState('');

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newTitle || !newSalary) return;

    await addDoc(collection(db, `users/${userId}/trabajos`), {
      name: newTitle,
      salary: Number(newSalary),
      createdAt: serverTimestamp(),
      lastUpdated: new Date().toISOString()
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewSalary('');
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!showRenewModal) return;

    const amt = Number(leftoverAmt);
    // 1. Si hay sobrante, guardarlo en la coleccion sobrantes
    if (amt > 0) {
      await addDoc(collection(db, `users/${userId}/sobrantes`), {
        amount: amt,
        desc: `Sobrante mes anterior - Trabajo`,
        createdAt: serverTimestamp()
      });
    }

    // 2. Actualizar el sueldo de la tarjeta y la fecha
    await updateDoc(doc(db, `users/${userId}/trabajos`, showRenewModal), {
      salary: Number(nextSalary),
      lastUpdated: new Date().toISOString()
    });

    setShowRenewModal(null);
    setLeftoverAmt('');
    setNextSalary('');
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mis Trabajos</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {trabajos.map(job => (
        <div key={job.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '0.5rem' }}>
                <Briefcase size={20} color="var(--primary)" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{job.name}</span>
            </div>
            
            <button onClick={() => setShowRenewModal(job.id)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-app)' }}>
              <RefreshCw size={14} /> Renovar Mes
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sueldo Actual</p>
              <p style={{ fontWeight: 600 }}><Value amount={job.salary} /></p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Última Actualización</p>
              <p style={{ fontSize: '0.875rem' }}>{new Date(job.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Add Job Modal */}
      {showAddModal && (
        <Modal title="Nuevo Trabajo Fijo" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddJob}>
            <input className="input-field" placeholder="Ej: Trabajo Oficina" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
            <input className="input-field" type="number" placeholder="Sueldo inicial" value={newSalary} onChange={e => setNewSalary(e.target.value)} required />
            <button className="btn-primary" style={{ width: '100%' }}>Crear Tarjeta</button>
          </form>
        </Modal>
      )}

      {/* Renew Job Modal */}
      {showRenewModal && (
        <Modal title="Cargar Nuevo Mes" onClose={() => setShowRenewModal(null)}>
          <form onSubmit={handleRenew}>
            <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>¿Te sobró dinero del mes anterior?</label>
            <input className="input-field" type="number" placeholder="Monto sobrante (0 si nada)" value={leftoverAmt} onChange={e => setLeftoverAmt(e.target.value)} required />
            
            <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Sueldo del Nuevo Mes</label>
            <input className="input-field" type="number" placeholder="Sueldo" value={nextSalary} onChange={e => setNextSalary(e.target.value)} required />
            
            <button className="btn-primary" style={{ width: '100%' }}>Confirmar Renovación</button>
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
