
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Firm, Model, Shoot, Invoice, ViewState, FloorManager, User, AccessConfig } from '../types';
import { INITIAL_FIRMS, PAGE_TO_FIRM_MAP, EXPENSE_CATEGORIES } from '../constants';
import { auth, db, firebaseConfig } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface AppContextType {
  loading: boolean;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  firms: Firm[];
  addFirm: (firm: Firm) => Promise<void>;
  updateFirm: (firm: Firm) => Promise<void>;
  deleteFirm: (id: string) => Promise<void>;
  pageFirmMap: Record<string, string>;
  updatePageMapping: (page: string, firmId: string) => void;
  models: Model[];
  addModel: (model: Model) => void;
  updateModel: (model: Model) => void;
  deleteModel: (id: string) => void;
  floorManagers: FloorManager[];
  addFloorManager: (fm: FloorManager) => void;
  updateFloorManager: (fm: FloorManager) => void;
  deleteFloorManager: (id: string) => void;
  shoots: Shoot[];
  addShoot: (shoot: Shoot) => void;
  updateShoot: (shoot: Shoot) => void;
  deleteShoot: (id: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  accessConfig: AccessConfig;
  updateAccessConfig: (config: AccessConfig) => Promise<void>;
  // Auth
  currentUser: User | null;
  users: User[]; // List of all users (admin only view)
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  addUser: (user: User, pass: string) => Promise<void>;
  emergencySignUp: (user: User, pass: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // UI Notifications
  toast: Toast | null;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ACCESS_CONFIG: AccessConfig = {
  userPermissions: [
    { category: 'Talent', visible: true, editable: true },
    { category: 'Makeup Artist', visible: true, editable: true },
    { category: 'Hairstylist', visible: true, editable: true },
    { category: 'Stylist', visible: true, editable: true },
    ...EXPENSE_CATEGORIES.map(cat => ({ category: cat, visible: false, editable: false }))
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
  const [users, setAllUsers] = useState<User[]>([]); 
  const [accessConfig, setAccessConfig] = useState<AccessConfig>(DEFAULT_ACCESS_CONFIG);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
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

    // ACCESS CONFIG
    const unsubAccess = onSnapshot(doc(db, 'config', 'accessControl'), (snap) => {
      if (snap.exists()) {
        setAccessConfig(snap.data() as AccessConfig);
      } else if (currentUser.role === 'ADMIN') {
        setDoc(doc(db, 'config', 'accessControl'), DEFAULT_ACCESS_CONFIG);
      }
    });

    // FIRMS
    const unsubFirms = onSnapshot(collection(db, 'firms'), (snap) => {
      const data = snap.docs.map(d => d.data() as Firm);
      if (data.length === 0 && currentUser.role === 'ADMIN') {
         INITIAL_FIRMS.forEach(f => setDoc(doc(db, 'firms', f.id), f));
      } else {
         setFirms(data);
      }
    });

    // PAGE MAPPING
    const unsubMap = onSnapshot(doc(db, 'config', 'pageFirmMap'), (snap) => {
      if (snap.exists()) {
         setPageFirmMap(snap.data() as Record<string, string>);
      } else if (currentUser.role === 'ADMIN') {
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
      unsubAccess();
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

  const updateAccessConfig = async (config: AccessConfig) => {
    await setDoc(doc(db, 'config', 'accessControl'), config);
  };

  const login = async (u: string, p: string) => {
    const cleanUsername = u.trim().toLowerCase();
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@prodflow.local`;
    await signInWithEmailAndPassword(auth, email, p);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('prod_active_view');
  };

  const emergencySignUp = async (user: User, pass: string) => {
    const cleanUsername = user.username.trim().toLowerCase();
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@prodflow.local`;
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
       username: cleanUsername,
       name: user.name,
       role: user.role,
       password: 'HIDDEN'
    });
  };

  const addUser = async (user: User, pass: string) => {
    const tempApp = initializeApp(firebaseConfig, 'secondaryApp'); 
    const tempAuth = getAuth(tempApp);
    try {
      const cleanUsername = user.username.trim().toLowerCase();
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@prodflow.local`;
      const cred = await createUserWithEmailAndPassword(tempAuth, email, pass);
      await setDoc(doc(db, 'users', cred.user.uid), {
         username: cleanUsername,
         name: user.name,
         role: user.role,
         password: 'HIDDEN'
      });
      await signOut(tempAuth);
    } catch (e) {
       console.error("Error creating user", e);
       alert("Failed to create user. Ensure username is unique.");
    }
  };

  const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  };

  const addFirm = async (firm: Firm) => {
    await setDoc(doc(db, 'firms', firm.id), firm);
  };

  const updateFirm = async (firm: Firm) => {
    await setDoc(doc(db, 'firms', firm.id), firm);
  };

  const deleteFirm = async (id: string) => {
    await deleteDoc(doc(db, 'firms', id));
  };

  const updatePageMapping = async (page: string, firmId: string) => {
    await setDoc(doc(db, 'config', 'pageFirmMap'), { [page]: firmId }, { merge: true });
  };

  const addModel = async (model: Model) => {
    await setDoc(doc(db, 'models', model.id), model);
  };
  const updateModel = async (model: Model) => {
    await setDoc(doc(db, 'models', model.id), model);
  };
  const deleteModel = async (id: string) => {
    await deleteDoc(doc(db, 'models', id));
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
  const deleteShoot = async (id: string) => {
    await deleteDoc(doc(db, 'shoots', id));
  };

  const addInvoice = async (invoice: Invoice) => {
    await setDoc(doc(db, 'invoices', invoice.id), invoice);
  };

  return (
    <AppContext.Provider value={{
      loading,
      activeView, setActiveView,
      globalSearch, setGlobalSearch,
      firms, addFirm, updateFirm, deleteFirm,
      pageFirmMap, updatePageMapping,
      models, addModel, updateModel, deleteModel,
      floorManagers, addFloorManager, updateFloorManager, deleteFloorManager,
      shoots, addShoot, updateShoot, deleteShoot,
      invoices, addInvoice,
      theme, toggleTheme,
      accessConfig, updateAccessConfig,
      currentUser, users, login, logout, addUser, emergencySignUp, deleteUser,
      toast, notify
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
