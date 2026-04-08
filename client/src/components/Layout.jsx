import SideNav from './SideNav';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <SideNav />
      <BottomNav />

      <main className="lg:ml-60 pb-20 lg:pb-0 px-4 lg:px-8 pt-6 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
