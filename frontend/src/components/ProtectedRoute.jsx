import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-4 border-[#0079BF] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
