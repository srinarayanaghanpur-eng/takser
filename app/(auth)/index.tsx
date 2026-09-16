import { Redirect } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function AuthIndex() {
  const appUser = useAuthStore((s) => s.appUser);

  if (appUser?.role === "admin") {
    return <Redirect href="/(auth)/(admin)/dashboard" />;
  }
  return <Redirect href="/(auth)/(teacher)/dashboard" />;
}
