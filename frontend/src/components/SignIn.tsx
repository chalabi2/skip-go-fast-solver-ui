import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";

export const SignIn: React.FC = () => {
  const { user, isAllowedEmail } = useAuth();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  if (user && !isAllowedEmail) {
    return (
      <div className="min-h-screen bg-vercel-background flex items-center justify-center">
        <div className="bg-vercel-card-background border border-vercel-border p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h2>
            <p className="text-vercel-foreground mb-4">
              Sorry, you don't have permission to access this dashboard. Please
              contact the administrator if you believe this is a mistake.
            </p>
            <button
              onClick={() => auth.signOut()}
              className="bg-vercel-card-background border border-vercel-border text-vercel-foreground px-4 py-2 rounded-lg hover:bg-vercel-card-hovered transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vercel-background flex items-center justify-center">
      <div className="bg-vercel-card-background border border-vercel-border p-8 rounded-lg shadow-md max-w-lg w-full">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="/favicon.svg"
              alt="Skip Go Fast Solver"
              className="w-22 h-22"
            />
            <h2 className="text-2xl font-bold text-vercel-foreground">
              Skip Go Fast Solver Dashboard
            </h2>
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-2 text-vercel-tertiary">
              <p className="text-sm">
                • Monitor real-time settlement performance
              </p>
              <p className="text-sm">
                • Track gas usage across multiple chains
              </p>
              <p className="text-sm">
                • Analyze profit metrics and fee optimization
              </p>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center w-full px-4 py-2 border border-vercel-border rounded-lg shadow-sm bg-vercel-card-background text-sm font-medium text-vercel-foreground hover:bg-vercel-card-hovered transition-colors"
          >
            <img
              className="h-5 w-5 mr-2"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};
