import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import PostDetailPage from './pages/PostDetailPage';
import SearchPage from './pages/SearchPage';
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';
import HashtagPage from './pages/HashtagPage';

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  const hideNavbarRoutes = ['/', '/login', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public landing page — always accessible */}
        <Route path="/"        element={<LandingPage />} />

        {/* Auth routes — redirect home if already logged in */}
        <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/feed" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/feed" />} />

        {/* Public app routes */}
        <Route path="/feed"                              element={<HomePage />} />
        <Route path="/post/:id"                          element={<PostDetailPage />} />
        <Route path="/profile/:username"                 element={<ProfilePage />} />

        {/* Protected app routes */}
        <Route path="/notifications"                     element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/search"                            element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/profile/:username/followers"       element={<ProtectedRoute><FollowersPage /></ProtectedRoute>} />
        <Route path="/profile/:username/following"       element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
        <Route path="/hashtag/:tag"                      element={<HashtagPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #313244',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
