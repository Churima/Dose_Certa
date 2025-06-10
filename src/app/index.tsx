import { Redirect } from "expo-router";
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return null;
  }

  // Redirect to private area if authenticated, otherwise to public area
  return <Redirect href={user ? "/(private)" : "/(public)"} />;
}
