import './src/tasks/backgroundTask';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { requestNotificationPermissions } from './src/services/alertService';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
