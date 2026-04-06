'use client';

import { AppProvider, useApp } from '@/lib/store';
import Dashboard from '@/components/Dashboard';
import EditorLayout from '@/components/EditorLayout';
import TeacherMode from '@/components/TeacherMode';
import SettingsPage from '@/components/SettingsPage';
import ToastContainer from '@/components/ToastContainer';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
  const { state, dispatch } = useApp();

  return (
    <>
      <AnimatePresence mode="wait">
        {state.view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard onTeacherMode={() => dispatch({ type: 'SET_VIEW', payload: 'teacher' })} />
          </motion.div>
        ) : state.view === 'teacher' ? (
          <motion.div
            key="teacher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100vh' }}
          >
            <TeacherMode onBack={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} />
          </motion.div>
        ) : state.view === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100vh' }}
          >
            <SettingsPage onBack={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} />
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100vh' }}
          >
            <EditorLayout />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

