import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./components/Dashboard";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { AuthProvider } from "./context/AuthContext";
import { SignIn } from "./components/SignIn";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuth } from "./context/AuthContext";

// Firebase configuration - you'll need to add your own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

const AuthenticatedApp = () => {
  const [user, loading] = useAuthState(auth);
  const { isAllowedEmail } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-skip-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !isAllowedEmail) {
    return <SignIn />;
  }

  return <Dashboard />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <AuthenticatedApp />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
