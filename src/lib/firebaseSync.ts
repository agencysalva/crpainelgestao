import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export interface FirebaseStoreData {
  customers?: any[];
  locations?: any[];
  services?: any[];
  quotes?: any[];
  workOrders?: any[];
  technicians?: any[];
  financialTransactions?: any[];
  notifications?: any[];
  settings?: any;
  auditLogs?: any[];
  users?: any[];
}

/**
 * Conexão em tempo real direta com o Firebase Firestore.
 * Ouve o documento central "app_data/cr_store" via onSnapshot (<100ms)
 * para sincronização bidirecional instantânea entre o Funcionário (campo)
 * e o Administrador (dashboard).
 */
export function subscribeToFirestoreStore(
  onData: (data: FirebaseStoreData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const storeDocRef = doc(db, 'app_data', 'cr_store');

  return onSnapshot(
    storeDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FirebaseStoreData;
        onData(data);
      }
    },
    (error) => {
      console.warn('Firebase realtime sync warning:', error?.message || error);
      if (onError) onError(error);
    }
  );
}
