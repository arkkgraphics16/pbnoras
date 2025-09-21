import { useEffect, useState } from 'react';

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
}) {
  const [draftName, setDraftName] = useState(username);

  useEffect(() => {
    setDraftName(username);
  }, [username]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (draftName.trim()) {
      onUsernameSave(draftName);
    }
  };

  return (
    <aside className="sidebar">
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
            onClick={() => onTabChange(tabKey)}
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
