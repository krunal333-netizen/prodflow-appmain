import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file from the current directory
  const env = loadEnv(mode, '.', '');
  
  // Create a clean object of environment variables we want to expose to the client
  // Providing defaults to avoid 'undefined' string replacement issues
  const envConfig = {
    API_KEY: env.API_KEY || '',
    FIREBASE_API_KEY: env.FIREBASE_API_KEY || '',
    FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN || '',
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || '',
    FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET || '',
    FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID || '',
    FIREBASE_APP_ID: env.FIREBASE_APP_ID || '',
    FIREBASE_MEASUREMENT_ID: env.FIREBASE_MEASUREMENT_ID || '',
  };

  return {
    plugins: [react()],
    define: {
      // Define individual keys for direct access (process.env.KEY)
      // This ensures that 'process.env.FIREBASE_API_KEY' is replaced with the literal value
      'process.env.API_KEY': JSON.stringify(envConfig.API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(envConfig.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(envConfig.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(envConfig.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(envConfig.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(envConfig.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(envConfig.FIREBASE_APP_ID),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(envConfig.FIREBASE_MEASUREMENT_ID),
      
      // Also define 'process.env' as a whole object to handle direct access to the object itself
      'process.env': JSON.stringify(envConfig)
    },
    build: {
      outDir: 'dist',
    }
  };
});