import { useEffect, useMemo, useRef, useState } from 'react';

const TAB_LABELS = {
  feed: "Everyone's Goals",
  new: 'New Goal',
  mine: 'My Goals',
};

const FILTER_LABELS = {
  all: 'All',
  one: 'One-Time',
  daily: 'Daily',
  weekly: 'Weekly',
};

function Sidebar({
  activeTab,
  onTabChange,
  filter,
  onFilterChange,
  filters,
  username,
  onUsernameSave,
  onLogout,
  isOpen,
  isDesktop,
  onClose,
  drawerRef,
}) {
  const [draftName, setDraftName] = useState(username);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef(null);

  const clearSaveTimeout = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setDraftName(username);
    setIsSaved(false);
    clearSaveTimeout();
  }, [username]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      clearSaveTimeout();
    };
  }, []);

  const commitUsername = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      return;
    }

    onUsernameSave(trimmedName);
    setIsSaved(true);
    clearSaveTimeout();
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaved(false);
      saveTimeoutRef.current = null;
    }, 2000);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    commitUsername();
  };

  const handleInlineSave = () => {
    commitUsername();
  };

  const handleTabClick = (tabKey) => {
    onTabChange(tabKey);
    if (!isDesktop) {
      onClose();
    }
  };

  const drawerClasses = useMemo(() => {
    const classes = ['sidebar'];
    if (!isDesktop) {
      classes.push('drawer');
      if (isOpen) {
        classes.push('open');
      }
    }
    return classes.join(' ');
  }, [isDesktop, isOpen]);

  const assignRef = (node) => {
    if (!drawerRef) return;
    drawerRef.current = node;
  };

  const dialogProps = !isDesktop && isOpen ? { role: 'dialog', 'aria-modal': 'true' } : {};

  return (
    <aside
      id="sidebar"
      className={drawerClasses}
      ref={assignRef}
      {...dialogProps}
      tabIndex={!isDesktop ? -1 : undefined}
      aria-hidden={!isDesktop && !isOpen && hasHydrated ? 'true' : undefined}
    >
      <div className="logo-block">
        <h2>PBN Kron</h2>
        <p className="tagline">Align your goals with the crew.</p>
      </div>
      <nav className="tab-nav">
        {Object.entries(TAB_LABELS).map(([tabKey, label]) => (
          <button
            key={tabKey}
            type="button"
            className={`tab-button ${activeTab === tabKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tabKey)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="filter-chips">
        {filters.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>
      <form className="sidebar-footer" onSubmit={handleSubmit}>
        <label className="username-label">
          Username
          <div className="username-input-row">
            <input
              type="text"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                setIsSaved(false);
                clearSaveTimeout();
              }}
              placeholder="Your display name"
            />
            <button
              type="button"
              className="icon-button username-save-button"
              onClick={handleInlineSave}
              aria-label="Save username"
            >
              <span aria-hidden="true">💾</span>
            </button>
          </div>
          {isSaved ? (
            <span className="username-saved-hint" role="status">
              <span aria-hidden="true">✔</span> Saved
            </span>
          ) : null}
        </label>
        <div className="footer-actions">
          <button type="submit" className="secondary-button">
            Save
          </button>
          <button type="button" className="danger-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </form>
    </aside>
  );
}

export default Sidebar;
