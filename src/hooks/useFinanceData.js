import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useStore from '../store/useStore';

export function useFinanceData() {
  const userId = useStore((state) => state.userId);
  const [data, setData] = useState({
    trabajos: [],
    ahorros: [],
    sobrantes: [],
    gastos: [],
    historialSueldos: [],
    totals: { sueldos: 0, ahorrosArs: 0, ahorrosUsd: 0, sobrantes: 0, gastos: 0, granTotalArs: 0 },
    loading: true
  });

  useEffect(() => {
    if (!userId) return;

    const baseRef = doc(db, 'users', userId);

    // Initial setup if user doc doesn't exist
    getDoc(baseRef).then((snap) => {
      if (!snap.exists()) setDoc(baseRef, { createdAt: new Date() });
    });

    const qTrabajos = query(collection(db, `users/${userId}/trabajos`));
    const qAhorros = query(collection(db, `users/${userId}/ahorros`));
    const qSobrantes = query(collection(db, `users/${userId}/sobrantes`));
    const qGastos = query(collection(db, `users/${userId}/gastos`));
    const qHistorial = query(collection(db, `users/${userId}/historial_sueldos`));

    const unsubTrabajos = onSnapshot(qTrabajos, (snap) => {
      const _trabajos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateState('trabajos', _trabajos);
    });

    const unsubAhorros = onSnapshot(qAhorros, (snap) => {
      const _ahorros = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateState('ahorros', _ahorros.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });

    const unsubSobrantes = onSnapshot(qSobrantes, (snap) => {
      const _sobrantes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateState('sobrantes', _sobrantes.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });

    const unsubGastos = onSnapshot(qGastos, (snap) => {
      const _gastos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateState('gastos', _gastos.sort((a,b) => b.date?.toMillis() - a.date?.toMillis()));
    });

    const unsubHistorial = onSnapshot(qHistorial, (snap) => {
      const _historial = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateState('historialSueldos', _historial);
    });

    return () => {
      unsubTrabajos();
      unsubAhorros();
      unsubSobrantes();
      unsubGastos();
      unsubHistorial();
    };
  }, [userId]);

  function updateState(key, arrayData) {
    setData((prev) => {
      const newState = { ...prev, [key]: arrayData };
      
      // Compute Totals
      const sueldos = newState.trabajos.reduce((acc, job) => acc + (Number(job.salary) || 0), 0);
      
      const ahorrosArs = newState.ahorros.reduce((acc, tx) => acc + (Number(tx.amountArs) || 0), 0);
      const ahorrosUsd = newState.ahorros.reduce((acc, tx) => acc + (Number(tx.amountUsd) || 0), 0);
      
      const sobrantes = newState.sobrantes.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
      
      const gastos = newState.gastos.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

      const granTotalArs = (sueldos - gastos) + ahorrosArs + sobrantes;

      return {
        ...newState,
        totals: { sueldos, ahorrosArs, ahorrosUsd, sobrantes, gastos, granTotalArs },
        loading: false
      };
    });
  }

  return data;
}
