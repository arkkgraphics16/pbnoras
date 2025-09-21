import GoalCard from '../components/GoalCard.jsx';
import FilterTabs from '../components/FilterTabs.jsx';

function Feed({ goals, loading, filter, onFilterChange, filters }) {
  return (
    <section className="page">
      <header className="page-header">
        <div className="page-header__title-row">
          <h1>Everyone's Goals</h1>
          <FilterTabs value={filter} onChange={onFilterChange} filters={filters} />
        </div>
        <p>See what the crew is committing to this cycle.</p>
      </header>
      {loading ? (
        <p className="page-empty">Loading public goals…</p>
      ) : goals.length === 0 ? (
        <p className="page-empty">No public goals yet. Be the first to share!</p>
      ) : (
        <div className="goal-grid goal-grid--single">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Feed;
