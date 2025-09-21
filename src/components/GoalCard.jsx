import { useEffect, useMemo, useState } from 'react';
import useCountdown, { formatCountdown } from '../hooks/useCountdown';

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

  useEffect(() => {
    setForm(mapGoalToForm(goal));
    setIsExpanded(false);
  }, [goal]);

  const deadlineDate = useMemo(() => {
    if (!goal.deadline) return null;
    try {
      if (goal.deadline instanceof Date) {
        return Number.isNaN(goal.deadline.getTime()) ? null : goal.deadline;
      }

      if (typeof goal.deadline.toDate === 'function') {
        const fromTimestamp = goal.deadline.toDate();
        return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp;
      }

      const parsed = new Date(goal.deadline);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch (err) {
      return null;
    }
  }, [goal.deadline]);

  const deadlineText = useMemo(() => {
    if (!deadlineDate) return 'No deadline';
    try {
      return deadlineDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch (err) {
      try {
        return deadlineDate.toLocaleString();
      } catch (error) {
        return 'No deadline';
      }
    }
  }, [deadlineDate]);

  const countdown = useCountdown(deadlineDate);

  const countdownLabel = useMemo(() => {
    if (!deadlineDate || !countdown) return '';
    if (countdown.isExpired) return 'Deadline passed';
    return `Time remaining: ${formatCountdown(countdown)}`;
  }, [deadlineDate, countdown]);

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
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!onSave) return;
    const payload = {
      text: form.text,
      type: form.type,
      status: form.status,
      public: form.public,
      deadline: combineDateAndTime(form.deadlineDate, form.deadlineTime),
    };
    const maybePromise = onSave(goal.id, payload, goal);
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
            {isEditing ? (
              <textarea
                className="goal-edit-textarea"
                name="text"
                value={form.text}
                onChange={handleChange}
                rows={10}
                aria-label="Goal statement"
              />
            ) : (
              <h3
                className={`goal-text ${
                  isExpanded ? 'goal-text--expanded' : 'goal-text--collapsed'
                }`}
              >
                {goal.text}
              </h3>
            )}
            {!isEditing && (
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
            )}
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
        {deadlineDate && countdownLabel && (
          <span className="goal-countdown" aria-live="polite">
            {countdownLabel}
          </span>
        )}
        <span>Status: {statusLabel}</span>
        {createdAtText && <span>Created: {createdAtText}</span>}
        {goal.authorName && <span>By: {goal.authorName}</span>}
      </div>
      {editable && isEditing && (
        <div className="goal-edit-form">
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
            <div className="deadline-inputs">
              <input
                type="date"
                name="deadlineDate"
                value={form.deadlineDate}
                onChange={handleChange}
              />
              <input
                type="time"
                name="deadlineTime"
                value={form.deadlineTime}
                onChange={handleChange}
              />
            </div>
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
  const baseDeadline = getDateValue(goal.deadline);
  return {
    text: goal.text || '',
    type: goal.type || 'one',
    status: goal.status || 'doing',
    deadlineDate: baseDeadline ? formatDateInput(baseDeadline) : '',
    deadlineTime: baseDeadline ? formatTimeInput(baseDeadline) : '',
    public: Boolean(goal.public),
  };
}

function getDateValue(deadline) {
  if (!deadline) return null;
  try {
    if (deadline instanceof Date) {
      return Number.isNaN(deadline.getTime()) ? null : deadline;
    }
    if (typeof deadline.toDate === 'function') {
      const fromTimestamp = deadline.toDate();
      return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp;
    }
    const parsed = new Date(deadline);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    return null;
  }
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date) {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function combineDateAndTime(dateString, timeString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  let hours = 0;
  let minutes = 0;
  if (timeString) {
    const [timeHours, timeMinutes] = timeString.split(':').map(Number);
    if (!Number.isNaN(timeHours)) hours = timeHours;
    if (!Number.isNaN(timeMinutes)) minutes = timeMinutes;
  }
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default GoalCard;
