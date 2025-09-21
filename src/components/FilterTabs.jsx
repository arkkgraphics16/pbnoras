const FILTER_LABELS = {
  all: 'All',
  one: 'One-Time',
  daily: 'Daily',
  weekly: 'Weekly',
};

function FilterTabs({ value, onChange, filters = ['all', 'one', 'daily', 'weekly'] }) {
  return (
    <div className="filter-tabs" role="group" aria-label="Filter goals by cadence">
      {filters.map((key) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            className={`filter-tab${isActive ? ' active' : ''}`}
            onClick={() => onChange(key)}
            aria-pressed={isActive}
          >
            {FILTER_LABELS[key] || key}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
