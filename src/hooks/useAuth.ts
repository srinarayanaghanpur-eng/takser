import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = store.initialize();
    return () => unsubscribe();
  }, []);

  return store;
}
