import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../App";
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              Sorry, you don't have permission to access this dashboard. Please
              contact the administrator if you believe this is a mistake.
            </p>
            <button
              onClick={() => auth.signOut()}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Skip Go Fast Solver Dashboard
          </h2>
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
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
