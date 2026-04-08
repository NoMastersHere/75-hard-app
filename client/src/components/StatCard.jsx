export default function StatCard({ label, value, icon, color = '#f4ffc6' }) {
  return (
    <div
      className="glass-panel rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="material-symbols-outlined text-[28px]" style={{ color }}>
            {icon}
          </span>
        )}
        <div>
          <p className="font-display font-black text-2xl text-on-surface leading-none">
            {value}
          </p>
          <p className="label-text text-on-surface-variant mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}
