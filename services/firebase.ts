
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy,
  updateDoc
} from "firebase/firestore";
import { User, UserRole, ServiceRequest, Bid, Review, ChatMessage, AppNotification } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDbCTXNOnlErbtI-mpalVai2g1B7L9u8P4",
  authDomain: "warsha-plus0.firebaseapp.com",
  projectId: "warsha-plus0",
  storageBucket: "warsha-plus0.firebasestorage.app",
  messagingSenderId: "547037038835",
  appId: "1:547037038835:web:d2c287ba497ec395290f86",
  measurementId: "G-ZN82XBS443"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Helper to convert Firestore snapshots to Typed Arrays
const mapDocs = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((d: any) => d.data() as T);
};

export const db = {
  users: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'users'));
        const snap = await getDocs(q);
        return mapDocs<User>(snap);
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
    getById: async (id: string) => {
      try {
        const ref = doc(firestore, 'users', id);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as User) : undefined;
      } catch (error) {
        console.error("Error fetching user:", error);
        return undefined;
      }
    },
    save: async (user: User) => {
      await setDoc(doc(firestore, 'users', user.id), user, { merge: true });
    },
    getByEmail: async (email: string) => {
      try {
        const q = query(collection(firestore, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        return snap.empty ? undefined : (snap.docs[0].data() as User);
      } catch (error) {
        console.error("Error fetching user by email:", error);
        return undefined;
      }
    }
  },
  requests: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'requests'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return mapDocs<ServiceRequest>(snap);
      } catch (error) {
        console.error("Error fetching requests:", error);
        return [];
      }
    },
    save: async (req: ServiceRequest) => {
      await setDoc(doc(firestore, 'requests', req.id), req, { merge: true });
    },
    getById: async (id: string) => {
      try {
        const ref = doc(firestore, 'requests', id);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as ServiceRequest) : undefined;
      } catch (error) {
        console.error("Error fetching request:", error);
        return undefined;
      }
    }
  },
  bids: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'bids'));
        const snap = await getDocs(q);
        return mapDocs<Bid>(snap);
      } catch (error) {
        return [];
      }
    },
    save: async (bid: Bid) => {
      await setDoc(doc(firestore, 'bids', bid.id), bid, { merge: true });
    },
    getByRequest: async (requestId: string) => {
      try {
        const q = query(collection(firestore, 'bids'), where('requestId', '==', requestId));
        const snap = await getDocs(q);
        return mapDocs<Bid>(snap);
      } catch (error) {
        return [];
      }
    },
    getById: async (id: string) => {
      try {
        const ref = doc(firestore, 'bids', id);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as Bid) : undefined;
      } catch (error) {
        return undefined;
      }
    }
  },
  reviews: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'reviews'));
        const snap = await getDocs(q);
        return mapDocs<Review>(snap);
      } catch (error) {
        return [];
      }
    },
    save: async (review: Review) => {
      await setDoc(doc(firestore, 'reviews', review.id), review);
      
      // Calculate new rating
      try {
        const q = query(collection(firestore, 'reviews'), where('technicianId', '==', review.technicianId));
        const snap = await getDocs(q);
        const reviews = mapDocs<Review>(snap);
        
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          const techRef = doc(firestore, 'users', review.technicianId);
          await updateDoc(techRef, { rating: avg, reviewCount: reviews.length });
        }
      } catch (error) {
        console.error("Error updating rating:", error);
      }
    }
  },
  messages: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'messages'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        return mapDocs<ChatMessage>(snap);
      } catch (error) {
        return [];
      }
    },
    getByRequest: async (requestId: string) => {
      try {
        // Removed server-side sorting to avoid missing index issue
        const q = query(collection(firestore, 'messages'), where('requestId', '==', requestId));
        const snap = await getDocs(q);
        const msgs = mapDocs<ChatMessage>(snap);
        // Sort client-side
        return msgs.sort((a, b) => a.createdAt - b.createdAt);
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    send: async (message: ChatMessage) => {
      await setDoc(doc(firestore, 'messages', message.id), message);
    }
  },
  notifications: {
    getAll: async () => {
      try {
        const q = query(collection(firestore, 'notifications'));
        const snap = await getDocs(q);
        return mapDocs<AppNotification>(snap);
      } catch (error) {
        return [];
      }
    },
    getByUser: async (userId: string) => {
      try {
        // Removed server-side sorting to avoid missing index issue
        const q = query(collection(firestore, 'notifications'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const notifs = mapDocs<AppNotification>(snap);
        // Sort client-side
        return notifs.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    add: async (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const id = `ntf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newN: AppNotification = {
        ...n,
        id,
        createdAt: Date.now(),
        read: false
      };
      await setDoc(doc(firestore, 'notifications', id), newN);
    },
    markAsRead: async (id: string) => {
      await updateDoc(doc(firestore, 'notifications', id), { read: true });
    },
    markAllRead: async (userId: string) => {
      try {
        // For markAllRead, we need to iterate carefully.
        // If we query with where('read', '==', false), we might need an index if combined with userId.
        // Let's try to query just by userId client side filtering for robustness in this demo environment.
        const q = query(collection(firestore, 'notifications'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const batch = snap.docs
          .filter(d => d.data().read === false)
          .map(d => updateDoc(d.ref, { read: true }));
        await Promise.all(batch);
      } catch (error) {
        console.error("Error marking all read:", error);
      }
    }
  }
};
