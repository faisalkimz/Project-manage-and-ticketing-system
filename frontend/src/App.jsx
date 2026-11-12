import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { Menu, Layout, Briefcase, MessageSquare, Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Workspace from './pages/Workspace';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Jira from './pages/Jira';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Portfolios from './pages/Portfolios';
import PortfolioDetails from './pages/PortfolioDetails';
import Notifications from './pages/Notifications';
import Integrations from './pages/Integrations';
import Automation from './pages/Automation';
import Knowledge from './pages/Knowledge';
import Reports from './pages/Reports';
import GlobalSearch from './components/GlobalSearch';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';

const MainLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      {isAuthenticated && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex items-center justify-around px-2 shadow-lg md:hidden">
          <Link
            to="/"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <Layout size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Boards</span>
          </Link>
          <Link
            to="/projects"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <Briefcase size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Projects</span>
          </Link>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <div className="p-2.5 bg-indigo-600 text-white rounded-full shadow-md -mt-5 mb-0.5">
              <Search size={18} />
            </div>
            <span className="text-[10px] font-semibold">Search</span>
          </button>
          <Link
            to="/tickets"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Tickets</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <Menu size={20} />
            <span className="text-[10px] font-semibold mt-0.5">Menu</span>
          </button>
        </div>
      )}

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className={`flex-1 transition-all duration-300 min-w-0 overflow-x-hidden ${isAuthenticated && !isMobile ? 'pl-64' : 'pl-0'} ${isAuthenticated && isMobile ? 'pb-20' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Protected Main App Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            <Route path="portfolios" element={<ProtectedRoute><Portfolios /></ProtectedRoute>} />
            <Route path="portfolios/:id" element={<ProtectedRoute><PortfolioDetails /></ProtectedRoute>} />
            <Route path="workspace/:id" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
            <Route path="tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="tickets/:id" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
            <Route path="team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="jira" element={<ProtectedRoute><Jira /></ProtectedRoute>} />
          </Route>
        </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
