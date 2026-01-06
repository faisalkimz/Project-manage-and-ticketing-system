import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
import GlobalSearch from './components/GlobalSearch';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ToastProvider } from './components/Toast';

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

      {/* Mobile Toggle Button */}
      {isAuthenticated && isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#0079BF] text-white rounded-full shadow-lg z-[80] flex items-center justify-center hover:bg-[#026AA7] active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      )}

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className={`flex-1 transition-all duration-300 min-w-0 overflow-x-hidden ${isAuthenticated && !isMobile ? 'pl-64' : 'pl-0'}`}>
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
            <Route path="jira" element={<ProtectedRoute><Jira /></ProtectedRoute>} />
          </Route>
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
