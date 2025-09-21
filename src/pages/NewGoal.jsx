import { useEffect, useMemo, useState } from 'react';
import useCountdown, { formatCountdown } from '../hooks/useCountdown';

const typeOptions = [
  { value: 'one', label: 'One-Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function NewGoal({ onCreate, submitting, defaultType }) {
  const [text, setText] = useState('');
  const [type, setType] = useState(
    typeOptions.some((option) => option.value === defaultType) ? defaultType : 'one'
  );
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const deadlineDateTime = useMemo(
    () => combineDateAndTime(deadlineDate, deadlineTime),
    [deadlineDate, deadlineTime]
  );

  const countdown = useCountdown(deadlineDateTime);

  const countdownLabel = useMemo(() => {
    if (!deadlineDateTime || !countdown) return '';
    if (countdown.isExpired) return 'Deadline passed';
    return `Time remaining: ${formatCountdown(countdown)}`;
  }, [deadlineDateTime, countdown]);

  useEffect(() => {
    if (typeOptions.some((option) => option.value === defaultType)) {
      setType(defaultType);
    }
  }, [defaultType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      setError('Please describe your goal.');
      return;
    }
    setError('');
    await onCreate({
      text: text.trim(),
      type,
      deadline: deadlineDateTime,
      isPublic,
    });
    setText('');
    setDeadlineDate('');
    setDeadlineTime('');
    setIsPublic(true);
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>Launch a new goal</h1>
        <p>Set the intention. Let others keep you accountable.</p>
      </header>
      <form className="goal-form" onSubmit={handleSubmit}>
        <label>
          Goal statement
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="Ship the new onboarding flow by Friday"
            required
          />
        </label>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Deadline
          <div className="deadline-inputs">
            <input
              type="date"
              value={deadlineDate}
              onChange={(event) => setDeadlineDate(event.target.value)}
            />
            <input
              type="time"
              value={deadlineTime}
              onChange={(event) => setDeadlineTime(event.target.value)}
            />
          </div>
        </label>
        {deadlineDateTime && countdownLabel && (
          <p className="deadline-preview" aria-live="polite">
            {countdownLabel}
          </p>
        )}
        <label className="public-toggle">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          Share with everyone
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create goal'}
        </button>
      </form>
    </section>
  );
}

export default NewGoal;

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
