import { useEffect, useMemo, useRef, useState } from 'react';

const TYPE_LABELS = {
  one: 'One-Time',
  daily: 'Daily',
  weekly: 'Weekly',
};

const STATUS_LABELS = {
  doing: 'In Progress',
  done: 'Completed',
  miss: 'Missed',
};

function GoalCard({ goal, editable = false, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState(() => mapGoalToForm(goal));
  const textAreaRef = useRef(null);

  const adjustTextareaHeight = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    const { lineHeight } = window.getComputedStyle(textarea);
    const parsedLineHeight = parseFloat(lineHeight) || 0;
    textarea.style.height = 'auto';
    const maxHeight = parsedLineHeight ? parsedLineHeight * 10 : textarea.scrollHeight;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    setForm(mapGoalToForm(goal));
    setIsExpanded(false);
  }, [goal]);

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [form.text, isEditing]);

  const deadlineText = useMemo(() => {
    if (!goal.deadline) return 'No deadline';
    try {
      const date = goal.deadline.toDate ? goal.deadline.toDate() : goal.deadline;
      return date.toLocaleDateString();
    } catch (err) {
      return 'No deadline';
    }
  }, [goal.deadline]);

  const createdAtText = useMemo(() => {
    if (!goal.createdAt) return '';
    try {
      const date = goal.createdAt.toDate ? goal.createdAt.toDate() : goal.createdAt;
      return date.toLocaleString();
    } catch (err) {
      return '';
    }
  }, [goal.createdAt]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'deadline') {
      setForm((prev) => ({ ...prev, deadline: value ? new Date(value) : null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!onSave) return;
    const maybePromise = onSave(goal.id, form, goal);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(() => setIsEditing(false));
    } else {
      setIsEditing(false);
    }
  };

  const typeLabel = TYPE_LABELS[goal.type] || 'Goal';
  const statusLabel = STATUS_LABELS[goal.status] || goal.status;

  return (
    <article className={`goal-card ${goal.status}`}>
      <header className="goal-header">
        <div>
          <p className="goal-type">{typeLabel}</p>
          <div className="goal-text-row">
            <h3
              className={`goal-text ${
                isExpanded ? 'goal-text--expanded' : 'goal-text--collapsed'
              }`}
            >
              {isEditing ? form.text : goal.text}
            </h3>
            <button
              type="button"
              className="goal-text-toggle"
              aria-label={isExpanded ? 'Collapse goal text' : 'Expand goal text'}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              <span aria-hidden="true" className="goal-text-toggle__icon">
                ▾
              </span>
            </button>
          </div>
        </div>
        {editable && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </header>
      <div className="goal-meta">
        <span>Deadline: {deadlineText}</span>
        <span>Status: {statusLabel}</span>
        {createdAtText && <span>Created: {createdAtText}</span>}
        {goal.authorName && <span>By: {goal.authorName}</span>}
      </div>
      {editable && isEditing && (
        <div className="goal-edit-form">
          <label>
            Text
            <textarea
              ref={textAreaRef}
              name="text"
              value={form.text}
              onChange={handleChange}
              onInput={adjustTextareaHeight}
              rows={3}
            />
          </label>
          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="one">One-Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="doing">In Progress</option>
              <option value="done">Completed</option>
              <option value="miss">Missed</option>
            </select>
          </label>
          <label>
            Deadline
            <input
              type="date"
              name="deadline"
              value={form.deadline ? formatDateInput(form.deadline) : ''}
              onChange={handleChange}
            />
          </label>
          <label className="public-toggle">
            <input
              type="checkbox"
              name="public"
              checked={form.public}
              onChange={handleChange}
            />
            Share publicly
          </label>
          <div className="goal-edit-actions">
            <button type="button" className="primary-button" onClick={handleSave}>
              Save
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => onDelete && onDelete(goal.id, goal.public)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function mapGoalToForm(goal) {
  return {
    text: goal.text || '',
    type: goal.type || 'one',
    status: goal.status || 'doing',
    deadline: goal.deadline
      ? goal.deadline.toDate
        ? goal.deadline.toDate()
        : new Date(goal.deadline)
      : null,
    public: Boolean(goal.public),
  };
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default GoalCard;
