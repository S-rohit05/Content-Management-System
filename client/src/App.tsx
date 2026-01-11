import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProgramsList } from './pages/ProgramsList';
import { ProgramDetail } from './pages/ProgramDetail';
import { LessonEditor } from './pages/LessonEditor';
import { LessonView } from './pages/LessonView';
import { UsersList } from './pages/UsersList';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-50">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/programs" replace />} />
              <Route path="/programs" element={<ProgramsList />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/lessons/:id/view" element={<LessonView />} />
              <Route path="/lessons/:id/edit" element={<LessonEditor />} />
              <Route path="/lessons/:id" element={<Navigate to="view" replace />} />
              <Route path="/users" element={<UsersList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
