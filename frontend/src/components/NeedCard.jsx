import CategoryBadge from './CategoryBadge';

export default function NeedCard({ need }) {
  return (
    <div className="need-card">
      <div className="need-card-header">
        <h3 className="need-card-title">{need.title}</h3>
        <CategoryBadge category={need.category} />
      </div>
      <div className="need-card-meta">
        <span><span className="meta-icon">📍</span> {need.area}</span>
        <span><span className="meta-icon">👥</span> {need.affectedCount?.toLocaleString()} affected</span>
      </div>
      <p className="need-card-desc">{need.description}</p>
    </div>
  );
}