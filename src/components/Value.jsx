import useStore from '../store/useStore';

export default function Value({ amount, isCurrency = true, currencySymbol = '$' }) {
  const isHidden = useStore((state) => state.isHidden);

  if (isHidden) {
    return <span>***</span>;
  }

  const formattedAmount = isCurrency 
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount).replace('ARS', currencySymbol)
    : amount;

  return <span>{formattedAmount}</span>;
}
