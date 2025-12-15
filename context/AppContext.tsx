import React, { createContext, useContext, useState, useEffect } from 'react';
import { Firm, Model, Shoot, Invoice, ViewState, FloorManager, User } from '../types';
import { INITIAL_FIRMS, PAGE_TO_FIRM_MAP } from '../constants';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

interface AppContextType {
  loading: boolean;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  firms: Firm[];
  addFirm: (firm: Firm) => void;
  updateFirm: (firm: Firm) => void;
  pageFirmMap: Record<string, string>;
  updatePageMapping: (page: string, firmId: string) => void;
  models: Model[];
  addModel: (model: Model) => void;
  updateModel: (model: Model) => void;
  floorManagers: FloorManager[];
  addFloorManager: (fm: FloorManager) => void;
  updateFloorManager: (fm: FloorManager) => void;
  deleteFloorManager: (id: string) => void;
  shoots: Shoot[];
  addShoot: (shoot: Shoot) => void;
  updateShoot: (shoot: Shoot) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  // Auth
  currentUser: User | null;
  users: User[]; // List of all users (admin only view)
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User, pass: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // View State (Local Only)
  const [activeView, setActiveView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('prod_active_view');
    return Object.values(ViewState).includes(saved as ViewState) ? (saved as ViewState) : ViewState.DASHBOARD;
  });

  useEffect(() => localStorage.setItem('prod_active_view', activeView), [activeView]);

  // Theme (Local Only)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('prod_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('prod_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- DATA STATE (FIRESTORE) ---
  const [firms, setFirms] = useState<Firm[]>([]);
  const [pageFirmMap, setPageFirmMap] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Model[]>([]);
  const [floorManagers, setFloorManagers] = useState<FloorManager[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setAllUsers] = useState<User[]>([]); // For UserManagement UI
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role details from Firestore 'users' collection
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // Fallback if doc missing (should not happen if created correctly)
          setCurrentUser({ id: firebaseUser.uid, name: firebaseUser.email || 'User', role: 'USER', username: firebaseUser.email || '' } as User);
        }
      } else {
        setCurrentUser(null);
        setActiveView(ViewState.DASHBOARD);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listeners (Only when authenticated)
  useEffect(() => {
    if (!currentUser) return;

    // FIRMS
    const unsubFirms = onSnapshot(collection(db, 'firms'), (snap) => {
      const data = snap.docs.map(d => d.data() as Firm);
      if (data.length === 0) {
         // Seeding Initial Firms if DB is empty
         INITIAL_FIRMS.forEach(f => setDoc(doc(db, 'firms', f.id), f));
      } else {
         setFirms(data);
      }
    });

    // PAGE MAPPING (Stored as a single config doc)
    const unsubMap = onSnapshot(doc(db, 'config', 'pageFirmMap'), (snap) => {
      if (snap.exists()) {
         setPageFirmMap(snap.data() as Record<string, string>);
      } else {
         // Seed initial map
         setDoc(doc(db, 'config', 'pageFirmMap'), PAGE_TO_FIRM_MAP);
      }
    });

    // MODELS
    const unsubModels = onSnapshot(collection(db, 'models'), (snap) => {
      setModels(snap.docs.map(d => d.data() as Model));
    });

    // CREW
    const unsubCrew = onSnapshot(collection(db, 'floorManagers'), (snap) => {
      setFloorManagers(snap.docs.map(d => d.data() as FloorManager));
    });

    // SHOOTS
    const unsubShoots = onSnapshot(collection(db, 'shoots'), (snap) => {
      setShoots(snap.docs.map(d => d.data() as Shoot));
    });

    // INVOICES
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => d.data() as Invoice));
    });
    
    // USERS LIST (Admin View)
    let unsubUsers = () => {};
    if (currentUser.role === 'ADMIN') {
       unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
          setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
       });
    }

    return () => {
      unsubFirms();
      unsubMap();
      unsubModels();
      unsubCrew();
      unsubShoots();
      unsubInvoices();
      unsubUsers();
    };
  }, [currentUser]);

  // --- ACTIONS (FIRESTORE) ---

  const login = async (u: string, p: string) => {
    try {
      await signInWithEmailAndPassword(auth, u, p);
      return true;
    } catch (e) {
      console.error("Login Failed", e);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('prod_active_view');
  };

  // Complex: Creating a user without logging out the current admin
  const addUser = async (user: User, pass: string) => {
    // 1. Create in Auth (Requires Secondary App trick to avoid logging out admin)
    // Using placeholder config here to match services/firebase.ts
    const tempApp = initializeApp({
  apiKey: "AIzaSyCrPSYaFnfITSzqsuB_ITxMB39D3-0qMg",
  authDomain: "prodflow-731b1.firebaseapp.com",
  projectId: "prodflow-731b1",
  storageBucket: "prodflow-731b1.firebasestorage.app",
  messagingSenderId: "874150900796",
  appId: "1:874150900796:web:98fdc6227455bcbc87ff39"
}, 'secondaryApp'); // Pass a name for secondary app
    
    const tempAuth = getAuth(tempApp);
    
    try {
      const cred = await createUserWithEmailAndPassword(tempAuth, user.username, pass); // Username here is Email
      // 2. Create Profile in Main Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
         username: user.username,
         name: user.name,
         role: user.role,
         password: 'HIDDEN' // Don't store actual password in DB
      });
      // Cleanup
      await signOut(tempAuth);
    } catch (e) {
       console.error("Error creating user", e);
       alert("Failed to create user. Ensure email is unique.");
    }
  };

  const deleteUser = async (id: string) => {
     // Note: Admin SDK needed to delete from Auth. 
     // Client SDK can only delete Firestore doc effectively for logic blocking.
     try {
       await deleteDoc(doc(db, 'users', id));
       alert("User profile deleted. Ask sysadmin to remove from Auth if needed.");
     } catch (e) {
       console.error("Delete failed", e);
     }
  };

  const addFirm = async (firm: Firm) => {
    await setDoc(doc(db, 'firms', firm.id), firm);
  };

  const updateFirm = async (firm: Firm) => {
    await setDoc(doc(db, 'firms', firm.id), firm);
  };

  const updatePageMapping = async (page: string, firmId: string) => {
    // Merge update
    await setDoc(doc(db, 'config', 'pageFirmMap'), { [page]: firmId }, { merge: true });
  };

  const addModel = async (model: Model) => {
    await setDoc(doc(db, 'models', model.id), model);
  };
  const updateModel = async (model: Model) => {
    await setDoc(doc(db, 'models', model.id), model);
  };

  const addFloorManager = async (fm: FloorManager) => {
    await setDoc(doc(db, 'floorManagers', fm.id), fm);
  };
  const updateFloorManager = async (fm: FloorManager) => {
    await setDoc(doc(db, 'floorManagers', fm.id), fm);
  };
  const deleteFloorManager = async (id: string) => {
    await deleteDoc(doc(db, 'floorManagers', id));
  };

  const addShoot = async (shoot: Shoot) => {
    await setDoc(doc(db, 'shoots', shoot.id), shoot);
  };
  const updateShoot = async (shoot: Shoot) => {
    await setDoc(doc(db, 'shoots', shoot.id), shoot);
  };

  const addInvoice = async (invoice: Invoice) => {
    await setDoc(doc(db, 'invoices', invoice.id), invoice);
  };

  return (
    <AppContext.Provider value={{
      loading,
      activeView, setActiveView,
      firms, addFirm, updateFirm,
      pageFirmMap, updatePageMapping,
      models, addModel, updateModel,
      floorManagers, addFloorManager, updateFloorManager, deleteFloorManager,
      shoots, addShoot, updateShoot,
      invoices, addInvoice,
      theme, toggleTheme,
      currentUser, users, login, logout, addUser, deleteUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};