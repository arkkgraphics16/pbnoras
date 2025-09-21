import GoalCard from '../components/GoalCard.jsx';
import FilterTabs from '../components/FilterTabs.jsx';

function MyGoals({ goals, loading, onUpdate, onDelete, filter, onFilterChange, filters }) {
  return (
    <section className="page">
      <header className="page-header">
        <div className="page-header__title-row">
          <h1>My Goals</h1>
          <FilterTabs value={filter} onChange={onFilterChange} filters={filters} />
        </div>
        <p>Track, adjust, and broadcast your personal commitments.</p>
      </header>
      {loading ? (
        <p className="page-empty">Loading your goals…</p>
      ) : goals.length === 0 ? (
        <p className="page-empty">No goals yet. Create one to get moving!</p>
      ) : (
        <div className="goal-grid">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              editable
              onSave={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default MyGoals;
