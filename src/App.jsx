import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, persistenceReady } from './firebase.js';
import AuthGate from './auth/AuthGate.jsx';
import Sidebar from './components/Sidebar.jsx';
import Feed from './pages/Feed.jsx';
import NewGoal from './pages/NewGoal.jsx';
import MyGoals from './pages/MyGoals.jsx';

const TABS = {
  FEED: 'feed',
  NEW: 'new',
  MINE: 'mine',
};

const FILTERS = ['all', 'one', 'daily', 'weekly'];

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.FEED);
  const [publicFilter, setPublicFilter] = useState('all');
  const [myFilter, setMyFilter] = useState('all');
  const [publicGoals, setPublicGoals] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [myGoals, setMyGoals] = useState([]);
  const [myGoalsLoading, setMyGoalsLoading] = useState(true);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1025px)').matches;
  });
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);
  const wasDrawerOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(min-width: 1025px)');
    const handleChange = (event) => {
      setIsDesktop(event.matches);
    };
    media.addEventListener('change', handleChange);
    setIsDesktop(media.matches);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setIsDrawerOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    persistenceReady.finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, [authReady]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return undefined;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPublicGoals([]);
      setMyGoals([]);
      setPublicLoading(false);
      setMyGoalsLoading(false);
      return;
    }

    setPublicLoading(true);
    const publicQuery = query(collection(db, 'public_goals'), orderBy('createdAt', 'desc'));
    const unsubPublic = onSnapshot(publicQuery, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setPublicGoals(list);
      setPublicLoading(false);
    });

    setMyGoalsLoading(true);
    const goalsQuery = query(
      collection(db, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );
    const unsubMyGoals = onSnapshot(goalsQuery, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setMyGoals(list);
      setMyGoalsLoading(false);
    });

    return () => {
      unsubPublic();
      unsubMyGoals();
    };
  }, [user]);

  const filteredPublicGoals = useMemo(() => {
    if (publicFilter === 'all') return publicGoals;
    const typeValue = publicFilter === 'one' ? 'one' : publicFilter;
    return publicGoals.filter((goal) => goal.type === typeValue);
  }, [publicGoals, publicFilter]);

  const filteredMyGoals = useMemo(() => {
    if (myFilter === 'all') return myGoals;
    const typeValue = myFilter === 'one' ? 'one' : myFilter;
    return myGoals.filter((goal) => goal.type === typeValue);
  }, [myGoals, myFilter]);

  const handleCreateGoal = async ({ text, type, deadline, isPublic }) => {
    if (!user || creatingGoal) return;
    setCreatingGoal(true);
    const goalsCollection = collection(db, 'users', user.uid, 'goals');
    const goalRef = doc(goalsCollection);
    const now = serverTimestamp();
    const payload = {
      text,
      type,
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      status: 'doing',
      public: isPublic,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(goalRef, payload);

      if (isPublic) {
        await upsertPublicGoal(goalRef.id, {
          authorUid: user.uid,
          authorName: profile?.username || user.email?.split('@')[0] || 'Anonymous',
          text,
          type,
          deadline: deadline ? Timestamp.fromDate(deadline) : null,
          status: 'doing',
          createdAt: now,
        });
      }
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleUpdateGoal = async (goalId, updates, existingGoal) => {
    if (!user) return;
    const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    if (typeof updates.deadline !== 'undefined') {
      payload.deadline = updates.deadline ? Timestamp.fromDate(updates.deadline) : null;
    }
    if (typeof updates.public !== 'undefined') {
      payload.public = updates.public;
    }

    await updateDoc(goalRef, payload);

    const shouldBePublic =
      typeof updates.public === 'boolean' ? updates.public : existingGoal.public;

    if (shouldBePublic) {
      await upsertPublicGoal(goalId, {
        authorUid: user.uid,
        authorName: profile?.username || user.email?.split('@')[0] || 'Anonymous',
        text: updates.text ?? existingGoal.text,
        type: updates.type ?? existingGoal.type,
        deadline:
          typeof updates.deadline !== 'undefined'
            ? updates.deadline
              ? Timestamp.fromDate(updates.deadline)
              : null
            : existingGoal.deadline ?? null,
        status: updates.status ?? existingGoal.status,
        createdAt: existingGoal.createdAt ?? serverTimestamp(),
      });
    } else if (existingGoal.public || updates.public === false) {
      await deleteDoc(doc(db, 'public_goals', goalId));
    }
  };

  const handleDeleteGoal = async (goalId, wasPublic) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
    if (wasPublic) {
      await deleteDoc(doc(db, 'public_goals', goalId));
    }
  };

  const upsertPublicGoal = async (goalId, data) => {
    const publicRef = doc(db, 'public_goals', goalId);
    await setDoc(publicRef, { ...data }, { merge: true });
  };

  const handleUsernameChange = async (nextUsername) => {
    if (!user) return;
    const trimmed = nextUsername.trim();
    if (!trimmed) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        username: trimmed,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const publicQuery = query(
      collection(db, 'public_goals'),
      where('authorUid', '==', user.uid)
    );
    const snapshot = await getDocs(publicQuery);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, { authorName: trimmed });
      });
      await batch.commit();
    }
    setProfile((prev) => (prev ? { ...prev, username: trimmed } : prev));
  };

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!isDrawerOpen || isDesktop) {
      document.body.classList.remove('drawer-open');
      if (wasDrawerOpenRef.current && !isDrawerOpen && !isDesktop) {
        hamburgerRef.current?.focus();
      }
      wasDrawerOpenRef.current = false;
      return undefined;
    }

    wasDrawerOpenRef.current = true;
    document.body.classList.add('drawer-open');
    const focusableSelector =
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusDrawer = () => {
      const focusable = drawerRef.current?.querySelectorAll(focusableSelector);
      const first = focusable && focusable.length > 0 ? focusable[0] : null;
      if (first && 'focus' in first) {
        first.focus({ preventScroll: true });
      } else if (drawerRef.current) {
        drawerRef.current.focus({ preventScroll: true });
      }
    };
    const focusTimeout = window.setTimeout(focusDrawer, 0);
    return () => {
      window.clearTimeout(focusTimeout);
      document.body.classList.remove('drawer-open');
    };
  }, [isDrawerOpen, isDesktop]);

  useEffect(() => {
    if (!isDrawerOpen || isDesktop) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, isDesktop]);

  useEffect(() => {
    if (!isDrawerOpen || isDesktop) return undefined;
    const focusableSelector =
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const drawerEl = drawerRef.current;
    if (!drawerEl) return undefined;
    const handleTrap = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = drawerEl.querySelectorAll(focusableSelector);
      if (!focusable.length) {
        event.preventDefault();
        drawerEl.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTrap);
    return () => document.removeEventListener('keydown', handleTrap);
  }, [isDrawerOpen, isDesktop]);

  useEffect(
    () => () => {
      document.body.classList.remove('drawer-open');
    },
    []
  );

  if (!authReady) {
    return (
      <div className="loading-screen">
        <p>Loading PBN Kron...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  const sidebarUsername = profile?.username || user.email?.split('@')[0] || '';

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
    if (!isDrawerOpen) {
      wasDrawerOpenRef.current = true;
    }
  };

  return (
    <div className="app-shell">
      {!isDesktop && (
        <header className="app-bar">
          <button
            type="button"
            className="hamburger"
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
            aria-controls="sidebar"
            aria-expanded={isDrawerOpen}
            onClick={toggleDrawer}
            ref={hamburgerRef}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="app-bar__title">PBN Kron</div>
          <div className="app-bar__spacer" aria-hidden="true" />
        </header>
      )}

      {!isDesktop && (
        <div
          className={`backdrop ${isDrawerOpen ? 'visible' : ''}`}
          onClick={handleCloseDrawer}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        username={sidebarUsername}
        onUsernameSave={handleUsernameChange}
        onLogout={handleLogout}
        isOpen={isDrawerOpen}
        isDesktop={isDesktop}
        onClose={handleCloseDrawer}
        drawerRef={drawerRef}
      />

      <main className="content-area">
        {activeTab === TABS.FEED && (
          <Feed
            goals={filteredPublicGoals}
            loading={publicLoading}
            filter={publicFilter}
            onFilterChange={setPublicFilter}
            filters={FILTERS}
          />
        )}
        {activeTab === TABS.NEW && (
          <NewGoal
            onCreate={handleCreateGoal}
            submitting={creatingGoal}
            defaultType="one"
          />
        )}
        {activeTab === TABS.MINE && (
          <MyGoals
            goals={filteredMyGoals}
            loading={myGoalsLoading}
            onUpdate={handleUpdateGoal}
            onDelete={handleDeleteGoal}
            filter={myFilter}
            onFilterChange={setMyFilter}
            filters={FILTERS}
          />
        )}
      </main>
    </div>
  );
}

export default App;
