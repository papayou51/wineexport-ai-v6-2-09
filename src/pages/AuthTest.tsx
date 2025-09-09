import AuthTestPanel from '@/components/AuthTestPanel';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthTest = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AuthTestPanel />
      </div>
    </ProtectedRoute>
  );
};

export default AuthTest;