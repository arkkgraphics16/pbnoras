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
  const [deadline, setDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const deadlineDate = useMemo(() => {
    if (!deadline) return null;
    const parsed = new Date(deadline);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [deadline]);

  const countdown = useCountdown(deadlineDate);

  const countdownLabel = useMemo(() => {
    if (!deadlineDate || !countdown) return '';
    if (countdown.isExpired) return 'Deadline passed';
    return `Time remaining: ${formatCountdown(countdown)}`;
  }, [deadlineDate, countdown]);

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
    await onCreate({ text: text.trim(), type, deadline: deadlineDate, isPublic });
    setText('');
    setDeadline('');
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
            rows={4}
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
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>
        {deadlineDate && countdownLabel && (
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
