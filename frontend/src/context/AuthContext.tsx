import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, ALLOWED_EMAILS, SESSION_TIMEOUT } from "../utils/firebase";
import { User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  isAllowedEmail: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAllowedEmail: false,
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAllowedEmail, setIsAllowedEmail] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout>();

  const resetSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    const timeout = setTimeout(() => {
      auth.signOut();
    }, SESSION_TIMEOUT);
    setSessionTimeout(timeout);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAllowedEmail(
        user ? ALLOWED_EMAILS.includes(user.email || "") : false
      );
      if (user) {
        resetSessionTimeout();
      } else if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    });

    // Add event listeners for user activity
    const handleActivity = () => {
      if (user) {
        resetSessionTimeout();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      unsubscribe();
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, isAllowedEmail, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
