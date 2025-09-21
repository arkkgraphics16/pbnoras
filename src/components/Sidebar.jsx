import { useEffect, useMemo, useRef, useState } from 'react';

const TAB_LABELS = {
  feed: "Everyone's Goals",
  new: 'New Goal',
  mine: 'My Goals',
};

function Sidebar({
  activeTab,
  onTabChange,
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
  const [saveState, setSaveState] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    setDraftName(username);
  }, [username]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setSaveState('idle');
    setFeedback('');
  }, [draftName]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const normalizedUsername = (username || '').trim();
  const trimmedDraft = draftName.trim();
  const isDirty = trimmedDraft && trimmedDraft !== normalizedUsername;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isDirty) {
      return;
    }

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    try {
      const maybePromise = onUsernameSave(draftName);
      if (maybePromise && typeof maybePromise.then === 'function') {
        setSaveState('pending');
        maybePromise
          .then(() => {
            setSaveState('success');
            setFeedback('Username updated');
            feedbackTimeoutRef.current = window.setTimeout(() => {
              setSaveState('idle');
              setFeedback('');
              feedbackTimeoutRef.current = null;
            }, 2400);
          })
          .catch(() => {
            setSaveState('error');
            setFeedback('Could not save username');
          });
      } else {
        setSaveState('success');
        setFeedback('Username updated');
        feedbackTimeoutRef.current = window.setTimeout(() => {
          setSaveState('idle');
          setFeedback('');
          feedbackTimeoutRef.current = null;
        }, 2400);
      }
    } catch (err) {
      setSaveState('error');
      setFeedback('Could not save username');
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
      <form className="sidebar-footer" onSubmit={handleSubmit}>
        <label className="username-label">
          Username
          <div className="username-input-row">
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Your display name"
            />
            <button
              type="submit"
              className="username-save-button"
              title="Save username"
              aria-label="Save username"
              disabled={!isDirty || saveState === 'pending'}
              aria-busy={saveState === 'pending'}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8.5 11.086l6.543-6.543a1 1 0 0 1 1.414 0z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </label>
        <div
          className="username-feedback"
          aria-live={saveState === 'error' ? 'assertive' : 'polite'}
          role={saveState === 'error' ? 'alert' : 'status'}
        >
          {feedback && (
            <span
              className={`username-feedback__message username-feedback__message--${saveState}`}
            >
              {feedback}
            </span>
          )}
        </div>
        <div className="footer-actions">
          <button type="button" className="danger-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </form>
    </aside>
  );
}

export default Sidebar;
