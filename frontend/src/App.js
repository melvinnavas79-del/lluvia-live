import React, { useState, useEffect } from 'react';
import "@/App.css";
import { UserProvider, useUser } from './contexts/UserContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RoomView from './pages/RoomView';
import ProfileView from './pages/ProfileView';
import GamesView from './pages/GamesView';
import SlotMachine from './pages/SlotMachine';
import AdminPanel from './pages/AdminPanel';
import ControlPanel from './pages/ControlPanel';
import ReelsView from './pages/ReelsView';
import PhotosView from './pages/PhotosView';
import StorePage from './pages/StorePage';

function AppContent() {
  const { isAuthenticated, login } = useUser();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      login(JSON.parse(savedUser));
    }
  }, []);

  const handleNavigate = (view, data) => {
    if (view === 'room') {
      setSelectedRoomId(data);
      setCurrentView('room');
    } else {
      setCurrentView(view);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'room' && selectedRoomId) {
    return <RoomView roomId={selectedRoomId} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'profile') {
    return <ProfileView onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
  }

  if (currentView === 'games') {
    return <GamesView onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
  }

  if (currentView === 'slots') {
    return <SlotMachine onBack={() => setCurrentView('games')} />;
  }

  if (currentView === 'admin') {
    return <ControlPanel onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'reels') {
    return <ReelsView onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'photos') {
    return <PhotosView onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'store') {
    return <StorePage onBack={() => setCurrentView('dashboard')} />;
  }

  return <Dashboard onNavigate={handleNavigate} />;
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
