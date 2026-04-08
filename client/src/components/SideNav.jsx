import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'bolt', label: 'Evolution' },
  { to: '/log', icon: 'shield', label: 'Fortress' },
  { to: '/trends', icon: 'psychology', label: 'Intelligence' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function SideNav() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col glass-panel border-r border-outline/20 z-50">
      <div className="px-6 py-8">
        <h1 className="font-display text-primary text-xl font-black uppercase tracking-tight">
          75 HARD
        </h1>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-higher'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-6 py-6 border-t border-outline/20">
        <p className="label-text text-on-surface-variant">Stay the course</p>
      </div>
    </aside>
  );
}
