import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useStore from '../store/useStore';
import { useFinanceData } from '../hooks/useFinanceData';
import Value from '../components/Value';
import { DollarSign, ArrowDownCircle, Banknote, X, Edit2, Trash2 } from 'lucide-react';

export default function Ahorros() {
  const userId = useStore((state) => state.userId);
  const { ahorros, totals, loading } = useFinanceData();
  
  const [modalType, setModalType] = useState(null); // 'cargar_ars', 'comprar_usd', 'retirar', 'editar_ars', 'editar_usd'
  const [editingId, setEditingId] = useState(null);
  
  // States
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [usdBought, setUsdBought] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    if (!userId || !amount) return;

    if (modalType === 'editar_ars' || modalType === 'editar_retirar') {
      let finalAmount = modalType === 'editar_retirar' ? -Math.abs(Number(amount)) : Number(amount);
      await updateDoc(doc(db, `users/${userId}/ahorros`, editingId), {
        amountArs: finalAmount,
        desc: desc || 'Movimiento'
      });
      closeModal();
      return;
    }

    let tx = {
      createdAt: serverTimestamp(),
      desc: desc || 'Movimiento'
    };

    if (modalType === 'cargar_ars') {
      tx.amountArs = Number(amount);
      tx.type = 'manual_in';
    } 
    else if (modalType === 'retirar') {
      tx.amountArs = -Number(amount);
      tx.type = 'withdrawal';
    }

    await addDoc(collection(db, `users/${userId}/ahorros`), tx);
    closeModal();
  };

  const handleBuyUsd = async (e) => {
    e.preventDefault();
    if (!userId || !usdBought || !exchangeRate) return;

    const usd = Number(usdBought);
    const rate = Number(exchangeRate);
    const totalArsCost = usd * rate;

    if (modalType === 'editar_usd') {
      await updateDoc(doc(db, `users/${userId}/ahorros`, editingId), {
        desc: `Compra Dólar (Cotiz: ${rate})`,
        amountArs: -totalArsCost,
        amountUsd: usd
      });
    } else {
      await addDoc(collection(db, `users/${userId}/ahorros`), {
        type: 'usd_buy',
        desc: `Compra Dólar (Cotiz: ${rate})`,
        amountArs: -totalArsCost,
        amountUsd: usd,
        createdAt: serverTimestamp()
      });
    }
    closeModal();
  };

  const handleDelete = async (txId) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      await deleteDoc(doc(db, `users/${userId}/ahorros`, txId));
    }
  };

  const openEdit = (tx) => {
    setEditingId(tx.id);
    setDesc(tx.desc);
    
    if (tx.type === 'usd_buy' || tx.amountUsd) {
      setUsdBought(Math.abs(tx.amountUsd).toString());
      setExchangeRate(Math.abs(tx.amountArs / tx.amountUsd).toString());
      setModalType('editar_usd');
    } else {
      setAmount(Math.abs(tx.amountArs).toString());
      if (tx.amountArs < 0) {
         setModalType('editar_retirar');
      } else {
         setModalType('editar_ars');
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setAmount('');
    setDesc('');
    setUsdBought('');
    setExchangeRate('');
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mis Ahorros</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Ahorros (ARS)</p>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            <Value amount={totals.ahorrosArs} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderTop: '4px solid var(--secondary)' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Ahorros (USD)</p>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--secondary)' }}>
            <Value amount={totals.ahorrosUsd} currencySymbol="U$D " />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button onClick={() => setModalType('cargar_ars')} className="btn-primary" style={{ flex: '1 0 auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <ArrowDownCircle size={16} /> Cargar ARS
        </button>
        <button onClick={() => setModalType('comprar_usd')} className="btn-outline" style={{ flex: '1 0 auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <DollarSign size={16} /> Comprar USD
        </button>
        <button onClick={() => setModalType('retirar')} className="btn-outline" style={{ flex: '1 0 auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
           <Banknote size={16}/> Retirar
        </button>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '1rem 0' }}>Movimientos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ahorros.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No hay movimientos aún.</p>}
          {ahorros.map(t => (
            <div key={t.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.desc}</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{t.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {t.amountUsd ? <p style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem' }}>+ U$D {Math.abs(t.amountUsd)}</p> : null}
                  {t.amountArs ? (
                    <p style={{ color: t.amountArs < 0 ? 'var(--danger)' : 'currentColor', fontWeight: 600, fontSize: '0.875rem' }}>
                      {t.amountArs > 0 ? '+' : ''}<Value amount={t.amountArs} />
                    </p>
                  ) : null}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <button onClick={() => openEdit(t)} className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Edit2 size={14}/></button>
                <button onClick={() => handleDelete(t.id)} className="btn-outline text-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalType && (
        <Modal title={modalType.includes('cargar_ars') || modalType === 'editar_ars' ? 'Cargar Ahorros (ARS)' : modalType.includes('retirar') ? 'Retirar Fondos (ARS)' : 'Comprar Dólares'} onClose={closeModal}>
          {modalType.includes('usd') ? (
            <form onSubmit={handleBuyUsd}>
              <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Cantidad de USD comprados</label>
              <input className="input-field" type="number" value={usdBought} onChange={e => setUsdBought(e.target.value)} required />
              
              <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Cotización que pagaste (1 USD = X ARS)</label>
              <input className="input-field" type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} required />
              
              {usdBought && exchangeRate && (
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                  Se restarán <Value amount={usdBought * exchangeRate} /> de tus Ahorros en Pesos.
                </p>
              )}
              <button className="btn-primary" style={{ width: '100%' }}>Confirmar Compra</button>
            </form>
          ) : (
            <form onSubmit={handleAction}>
               <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Monto (ARS)</label>
              <input className="input-field" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
              
              <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Concepto (Opcional)</label>
              <input className="input-field" type="text" placeholder={modalType.includes('cargar_ars') ? "Ej: Regalo" : "Ej: Compra compu"} value={desc} onChange={e => setDesc(e.target.value)} />
              
              <button className="btn-primary" style={{ width: '100%' }}>Confirmar</button>
            </form>
          )}
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
