import { useEffect, useRef, useState } from 'react';

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
  const textareaRef = useRef(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { lineHeight } = window.getComputedStyle(textarea);
    const parsedLineHeight = parseFloat(lineHeight) || 0;
    textarea.style.height = 'auto';
    const maxHeight = parsedLineHeight ? parsedLineHeight * 10 : textarea.scrollHeight;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    if (typeOptions.some((option) => option.value === defaultType)) {
      setType(defaultType);
    }
  }, [defaultType]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      setError('Please describe your goal.');
      return;
    }
    setError('');
    const deadlineDate = deadline ? new Date(deadline) : null;
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
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onInput={adjustTextareaHeight}
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
