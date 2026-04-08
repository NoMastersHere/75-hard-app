import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: 'home', label: 'Daily' },
  { to: '/log', icon: 'edit_note', label: 'Log' },
  { to: '/trends', icon: 'trending_up', label: 'Trends' },
  { to: '/settings', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-outline/20 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
            <span className="label-text">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
