

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthStep, User } from './types.ts';
import { Carousel } from './components/Carousel.tsx';
import { AuthForms } from './components/AuthForms.tsx';
import { VerificationForm } from './components/VerificationForm.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { ConnectivityBanner } from './components/ConnectivityBanner.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { storageService } from './services/storageService.ts';
import { api } from './services/api.ts';
import { useParams, useNavigate } from 'react-router-dom';

const App: React.FC = () => {
  const [step, setStep] = useState<AuthStep | 'guest'>('guest');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sellit_token') || JSON.parse(localStorage.getItem('sellit_user') || '{}').token;
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res);
          setStep('authenticated');
        } catch (err) {
          console.error("Auth check failed", err);
          storageService.logout();
          // If token was invalid, we can either go to login or guest. 
          // Going to login makes it clear 'session expired'.
          setStep('login');
        }
      }
      // If no token, we stay in 'guest' (default)
    };
    checkAuth();
  }, []);

  const handleSignup = async (userData?: User) => {
    if (!userData) return;
    try {
      const res = await api.post('/auth/register', userData);
      setUser(res.user);
      if (res.token) {
        localStorage.setItem('sellit_token', res.token);
      }
      setStep('authenticated');
    } catch (err: any) {
      console.error("Signup failed", err);
      throw err; // AuthForms will catch this
    }
  };

  const handleLogin = async (credentials?: any) => {
    if (!credentials) return;
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.user) {
        setUser(res.user);
        setStep('authenticated');
        storageService.saveUser(res.user);
        if (res.token) {
          localStorage.setItem('sellit_token', res.token);
        }
      }
    } catch (err: any) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const handleGuest = () => {
    setUser(null);
    setStep('guest');
  };

  const handleVerificationSuccess = () => {
    setStep('authenticated');
    if (user) {
      storageService.saveUser(user);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStep('login');
    storageService.logout();
    localStorage.removeItem('sellit_token');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storageService.saveUser(updatedUser);
  };

  return (
    <BrowserRouter>
      <AppContent
        step={step}
        setStep={setStep}
        user={user}
        handleSignup={handleSignup}
        handleLogin={handleLogin}
        handleGuest={handleGuest}
        handleLogout={handleLogout}
        handleUpdateUser={handleUpdateUser}
        handleVerificationSuccess={handleVerificationSuccess}
      />
    </BrowserRouter>
  );
};

interface AppContentProps {
  step: AuthStep | 'guest';
  setStep: (step: AuthStep | 'guest') => void;
  user: User | null;
  handleSignup: (user?: User) => Promise<void>;
  handleLogin: (credentials?: any) => Promise<void>;
  handleGuest: () => void;
  handleLogout: () => void;
  handleUpdateUser: (user: User) => void;
  handleVerificationSuccess: () => void;
}

const AppContent: React.FC<AppContentProps> = ({
  step, setStep, user, handleSignup, handleLogin, handleGuest, handleLogout, handleUpdateUser, handleVerificationSuccess
}) => {
  const navigate = useNavigate();

  return (
    <ToastProvider>
      <ConnectivityBanner />
      <Routes>
        {/* Main App Routes */}
        <Route path="/" element={
          (step === 'authenticated' || step === 'guest') ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/product/:id" element={
          (step === 'authenticated' || step === 'guest') ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/broadcasts" element={
          (step === 'authenticated' || step === 'guest') ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        <Route path="/add" element={
          step === 'authenticated' ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/messages" element={
          step === 'authenticated' ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/notifications" element={
          step === 'authenticated' ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/profile" element={
          step === 'authenticated' ? (
            <ErrorBoundary>
              <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            </ErrorBoundary>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Auth Routes */}
        <Route path="/login" element={
          step === 'authenticated' ? <Navigate to="/" replace /> : (
          <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
            <div className="hidden md:block md:w-1/2 lg:w-[45%] h-full overflow-hidden shrink-0">
              <Carousel />
            </div>
            <div className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] scrollbar-hide">
              <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md bg-white md:bg-transparent p-8 md:p-0 rounded-[2.5rem] shadow-xl md:shadow-none my-auto">
                  <ErrorBoundary>
                    <AuthForms
                      type="login"
                      onSwitch={(newType) => navigate(`/${newType}`)}
                      onSubmit={async (creds) => { await handleLogin(creds); navigate('/'); }}
                      onGuest={() => { handleGuest(); navigate('/'); }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
          )
        } />

        <Route path="/signup" element={
          step === 'authenticated' ? <Navigate to="/" replace /> : (
          <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
            <div className="hidden md:block md:w-1/2 lg:w-[45%] h-full overflow-hidden shrink-0">
              <Carousel />
            </div>
            <div className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] scrollbar-hide">
              <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md bg-white md:bg-transparent p-8 md:p-0 rounded-[2.5rem] shadow-xl md:shadow-none my-auto">
                  <ErrorBoundary>
                    <AuthForms
                      type="signup"
                      onSwitch={(newType) => navigate(`/${newType}`)}
                      onSubmit={async (data) => { await handleSignup(data); navigate('/'); }}
                      onGuest={() => { handleGuest(); navigate('/'); }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
          )
        } />

        <Route path="/forgot_password" element={
          <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
            <div className="hidden md:block md:w-1/2 lg:w-[45%] h-full overflow-hidden shrink-0">
              <Carousel />
            </div>
            <div className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] scrollbar-hide">
              <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md bg-white md:bg-transparent p-8 md:p-0 rounded-[2.5rem] shadow-xl md:shadow-none my-auto">
                  <ErrorBoundary>
                    <AuthForms
                      type="forgot_password"
                      onSwitch={(newType) => navigate(`/${newType}`)}
                      onSubmit={handleLogin} // Reuse handleLogin for simplicity or add handler
                      onGuest={() => { handleGuest(); navigate('/'); }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        } />

        <Route path="/verify" element={
          <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
            <div className="hidden md:block md:w-1/2 lg:w-[45%] h-full overflow-hidden shrink-0">
              <Carousel />
            </div>
            <div className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] scrollbar-hide">
              <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md bg-white md:bg-transparent p-8 md:p-0 rounded-[2.5rem] shadow-xl md:shadow-none my-auto">
                  <ErrorBoundary>
                    <VerificationForm
                      email={user?.email || ''}
                      onSuccess={() => { handleVerificationSuccess(); navigate('/'); }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        } />

        {/* Referral Route */}
        <Route path="/ref/:code" element={<ReferralHandler onComplete={() => navigate('/signup')} />} />
      </Routes>
    </ToastProvider>
  );
};

// Helper component to capture referral code
const ReferralHandler: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('sellit_ref', code);
      console.log('Referral code captured:', code);
    }
    onComplete();
    navigate('/signup', { replace: true });
  }, [code, onComplete, navigate]);

  return null;
};

export default App;
