
import './App.css'
import { NavBar } from './components/NavBar'
import { SettingsDialog } from './components/SettingsDialog';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastDialog } from './components/dialogs/ToastDialog';
import { AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isMobileSize, setIsMobileSize] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const screenSizeChangeListener = () => {
      setIsMobileSize(window.innerWidth < 768)
    };

    screenSizeChangeListener();
    window.addEventListener('resize', screenSizeChangeListener);

    return () => window.removeEventListener('resize', screenSizeChangeListener);
  }, []);

  return (
    <div className="relative flex flex-col h-screen">
      <NavBar openSettingsDialog={() => setSettingsDialogOpen(true)} isMobileSize={isMobileSize} />
      <AnimatePresence mode="wait" initial={false}>
        <Outlet key={location.pathname.substring(0, location.pathname.lastIndexOf("/"))} context={{ isMobileSize, setShowToast, setToastMessage }} />
      </AnimatePresence>
      <SettingsDialog open={settingsDialogOpen} closeDialog={() => setSettingsDialogOpen(false)} setToastMessage={setToastMessage} setShowToast={setShowToast} />
      <ToastDialog showToast={showToast} message={toastMessage} />
    </div>
  );
}

export default App;
