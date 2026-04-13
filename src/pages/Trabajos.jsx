import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useStore from '../store/useStore';
import { useFinanceData } from '../hooks/useFinanceData';
import Value from '../components/Value';
import { Plus, Briefcase, RefreshCw, X, Edit2, Trash2, Receipt } from 'lucide-react';

export default function Trabajos() {
  const userId = useStore((state) => state.userId);
  const { trabajos, gastos, loading } = useFinanceData();
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // id
  const [showRenewModal, setShowRenewModal] = useState(null); // id
  const [showExpModal, setShowExpModal] = useState(null); // id
  
  // States
  const [title, setTitle] = useState('');
  const [salary, setSalary] = useState('');
  
  const [leftoverAmt, setLeftoverAmt] = useState('');
  const [nextSalary, setNextSalary] = useState('');

  const [expAmt, setExpAmt] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [editingExpId, setEditingExpId] = useState(null); // id del gasto a editar

  // CREATE JOB
  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!title || !salary) return;
    await addDoc(collection(db, `users/${userId}/trabajos`), {
      name: title,
      salary: Number(salary),
      createdAt: serverTimestamp(),
      lastUpdated: new Date().toISOString()
    });
    closeModals();
  };

  // EDIT JOB
  const handleEditJob = async (e) => {
    e.preventDefault();
    if (!showEditModal || !title) return;
    await updateDoc(doc(db, `users/${userId}/trabajos`, showEditModal), {
      name: title
    });
    closeModals();
  };

  // DELETE JOB
  const handleDelete = async (jobId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarjeta? (No afectará tu historial pasado)')) {
      await deleteDoc(doc(db, `users/${userId}/trabajos`, jobId));
    }
  };

  // RENEW MONTH
  const handleRenew = async (e) => {
    e.preventDefault();
    if (!showRenewModal) return;

    const job = trabajos.find(t => t.id === showRenewModal);
    const amt = Number(leftoverAmt);

    // 1. Guardar sobrantes si hay
    if (amt > 0) {
      await addDoc(collection(db, `users/${userId}/sobrantes`), {
        amount: amt,
        desc: `Sobrante mes anterior - ${job.name}`,
        createdAt: serverTimestamp()
      });
    }

    // 2. Crear snapshot del mes cerrado en "historial_sueldos"
    const jobExpenses = gastos.filter(g => g.jobId === showRenewModal).reduce((acc, g) => acc + Number(g.amount), 0);
    const mesSnapshot = new Date().toISOString().substring(0, 7); // "YYYY-MM"

    await addDoc(collection(db, `users/${userId}/historial_sueldos`), {
      jobId: job.id,
      name: job.name,
      salary: job.salary,
      gastosTotales: jobExpenses,
      mes: mesSnapshot,
      createdAt: serverTimestamp()
    });

    // 3. Actualizar el trabajo con el nuevo sueldo
    await updateDoc(doc(db, `users/${userId}/trabajos`, showRenewModal), {
      salary: Number(nextSalary),
      lastUpdated: new Date().toISOString()
    });

    // Nota: Idealmente al renovar un mes podrías archivar los "gastos" viejos 
    // pero como ahora permitimos ver meses anteriores, la consulta del dashboard 
    // lo filtrará todo por fechas.

    closeModals();
  };

  // ADD OR EDIT EXPENSE
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!showExpModal || !expAmt) return;

    if (editingExpId) {
      // Editar
      await updateDoc(doc(db, `users/${userId}/gastos`, editingExpId), {
        amount: Number(expAmt),
        desc: expDesc || 'Gasto/Viático'
      });
    } else {
      // Nuevo
      await addDoc(collection(db, `users/${userId}/gastos`), {
        jobId: showExpModal,
        amount: Number(expAmt),
        desc: expDesc || 'Gasto/Viático',
        date: serverTimestamp()
      });
    }
    
    closeModals();
  };

  const handleDeleteExpense = async (expId) => {
    if (window.confirm('¿Seguro que deseas eliminar este gasto? Se recalculará tu sueldo neto y patrimonio.')) {
      await deleteDoc(doc(db, `users/${userId}/gastos`, expId));
    }
  };

  const openEditExpense = (gasto) => {
    setExpAmt(gasto.amount.toString());
    setExpDesc(gasto.desc);
    setEditingExpId(gasto.id);
    setShowExpModal(gasto.jobId);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(null);
    setShowRenewModal(null);
    setShowExpModal(null);
    setEditingExpId(null);
    setTitle('');
    setSalary('');
    setLeftoverAmt('');
    setNextSalary('');
    setExpAmt('');
    setExpDesc('');
  };

  const getExpensesForJob = (jobId) => {
    return gastos.filter(g => g.jobId === jobId);
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

      {trabajos.map(job => {
        const jobExpensesList = getExpensesForJob(job.id);
        const jobExpensesTotal = jobExpensesList.reduce((acc, g) => acc + Number(g.amount), 0);
        const netto = job.salary - jobExpensesTotal;

        return (
          <div key={job.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-app)', borderRadius: '0.5rem' }}>
                  <Briefcase size={20} color="var(--primary)" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{job.name}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => {setTitle(job.name); setShowEditModal(job.id);}} className="text-muted"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(job.id)} className="text-danger"><Trash2 size={16} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Sueldo Bruto</p>
                <p style={{ fontWeight: 600 }}><Value amount={job.salary} /></p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Gastos Totales</p>
                <p className="text-danger" style={{ fontWeight: 600 }}>- <Value amount={jobExpensesTotal} /></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Neto Disp.</p>
                <p className="text-success" style={{ fontWeight: 700 }}><Value amount={netto} /></p>
              </div>
            </div>
            
            {/* Lista detallada de Gastos */}
            {jobExpensesList.length > 0 && (
              <div style={{ marginTop: '0.25rem', padding: '0.5rem', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Detalle de Viáticos</p>
                {jobExpensesList.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{g.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <p className="text-danger" style={{ fontWeight: 600, fontSize: '0.875rem' }}>- <Value amount={g.amount} /></p>
                      <button onClick={() => openEditExpense(g)} className="text-muted"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteExpense(g.id)} className="text-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowExpModal(job.id)} className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-app)' }}>
                <Receipt size={14} /> Añadir Gasto
              </button>
              <button onClick={() => setShowRenewModal(job.id)} className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>
                <RefreshCw size={14} /> Renovar Mes
              </button>
            </div>
            
          </div>
        );
      })}

      {/* Adding/Editing Modals */}
      {showAddModal && (
        <Modal title="Nuevo Trabajo" onClose={closeModals}>
          <form onSubmit={handleAddJob}>
            <input className="input-field" placeholder="Nombre (Ej: Oficina)" value={title} onChange={e => setTitle(e.target.value)} required />
            <input className="input-field" type="number" placeholder="Sueldo" value={salary} onChange={e => setSalary(e.target.value)} required />
            <button className="btn-primary" style={{ width: '100%' }}>Crear</button>
          </form>
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Editar Nombre" onClose={closeModals}>
          <form onSubmit={handleEditJob}>
            <input className="input-field" placeholder="Nuevo Nombre" value={title} onChange={e => setTitle(e.target.value)} required />
            <button className="btn-primary" style={{ width: '100%' }}>Guardar</button>
          </form>
        </Modal>
      )}

      {showExpModal && (
        <Modal title={editingExpId ? "Editar Gasto" : "Registrar Gasto/Viático"} onClose={closeModals}>
          <form onSubmit={handleAddExpense}>
            <input className="input-field" type="number" placeholder="Monto del gasto" value={expAmt} onChange={e => setExpAmt(e.target.value)} required />
            <input className="input-field" placeholder="Descripción (Ej: Nafta)" value={expDesc} onChange={e => setExpDesc(e.target.value)} required />
            <button className="btn-primary" style={{ width: '100%' }}>{editingExpId ? 'Guardar Cambios' : 'Guardar Gasto'}</button>
          </form>
        </Modal>
      )}

      {showRenewModal && (
        <Modal title="Cerrar y Renovar Mes" onClose={closeModals}>
          <form onSubmit={handleRenew}>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Esta acción guardará el mes actual en el historial.</p>
            <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>¿Sobrante del mes anterior?</label>
            <input className="input-field" type="number" placeholder="0 si no sobró nada" value={leftoverAmt} onChange={e => setLeftoverAmt(e.target.value)} required />
            <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Sueldo del NUEVO mes</label>
            <input className="input-field" type="number" placeholder="Sueldo a cobrar" value={nextSalary} onChange={e => setNextSalary(e.target.value)} required />
            <button className="btn-primary" style={{ width: '100%' }}>Renovar</button>
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
          <button type="button" onClick={onClose}><X size={20} color="var(--text-muted)"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
