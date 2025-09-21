import { useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    setDraftName(username);
  }, [username]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (draftName.trim()) {
      onUsernameSave(draftName);
    }
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
          <input
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Your display name"
          />
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
