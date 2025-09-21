import GoalCard from '../components/GoalCard.jsx';

function Feed({ goals, loading }) {
  return (
    <section className="page">
      <header className="page-header">
        <h1>Everyone's Goals</h1>
        <p>See what the crew is committing to this cycle.</p>
      </header>
      {loading ? (
        <p className="page-empty">Loading public goals…</p>
      ) : goals.length === 0 ? (
        <p className="page-empty">No public goals yet. Be the first to share!</p>
      ) : (
        <div className="goal-grid">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Feed;
