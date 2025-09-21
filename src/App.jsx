import { useEffect, useMemo, useState } from 'react';
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [publicGoals, setPublicGoals] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [myGoals, setMyGoals] = useState([]);
  const [myGoalsLoading, setMyGoalsLoading] = useState(true);
  const [creatingGoal, setCreatingGoal] = useState(false);

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
    if (typeFilter === 'all') return publicGoals;
    const typeValue = typeFilter === 'one' ? 'one' : typeFilter;
    return publicGoals.filter((goal) => goal.type === typeValue);
  }, [publicGoals, typeFilter]);

  const filteredMyGoals = useMemo(() => {
    if (typeFilter === 'all') return myGoals;
    const typeValue = typeFilter === 'one' ? 'one' : typeFilter;
    return myGoals.filter((goal) => goal.type === typeValue);
  }, [myGoals, typeFilter]);

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

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filter={typeFilter}
        onFilterChange={setTypeFilter}
        filters={FILTERS}
        username={sidebarUsername}
        onUsernameSave={handleUsernameChange}
        onLogout={handleLogout}
      />
      <main className="content-area">
        {activeTab === TABS.FEED && (
          <Feed goals={filteredPublicGoals} loading={publicLoading} />
        )}
        {activeTab === TABS.NEW && (
          <NewGoal
            onCreate={handleCreateGoal}
            submitting={creatingGoal}
            defaultType={typeFilter}
          />
        )}
        {activeTab === TABS.MINE && (
          <MyGoals
            goals={filteredMyGoals}
            loading={myGoalsLoading}
            onUpdate={handleUpdateGoal}
            onDelete={handleDeleteGoal}
          />
        )}
      </main>
    </div>
  );
}

export default App;
