import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./components/Dashboard";
import { auth } from "./utils/firebase";
import { AuthProvider } from "./context/AuthContext";
import { SignIn } from "./components/SignIn";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuth } from "./context/AuthContext";

// Firebase configuration - you'll need to add your own config

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
      <div className="min-h-screen bg-black flex items-center justify-center">
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
        <div className="min-h-screen bg-black">
          <AuthenticatedApp />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
