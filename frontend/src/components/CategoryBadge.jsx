const CATEGORY_STYLES = {
  health: { bg: '#e8f5e9', color: '#2e7d32' },
  water: { bg: '#e3f2fd', color: '#1565c0' },
  education: { bg: '#fff3e0', color: '#e65100' },
  food: { bg: '#fce4ec', color: '#c62828' },
};

export default function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || { bg: '#eee', color: '#333' };
  return (
    <span className="badge" style={{ background: style.bg, color: style.color }}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}