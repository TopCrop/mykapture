import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { Navigate } from "react-router-dom";
import type { AppRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const { hasOrg, orgStatus, loading: orgLoading, orgFetchFailed } = useOrg();

  if (loading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only redirect to /org-setup when the membership query SUCCEEDED with no org.
  // If the lookup failed (offline / network error) and we have no cached org,
  // render children anyway — the offline banner already signals the issue.
  if (!hasOrg && !orgFetchFailed && userRole !== "super_admin") {
    if (window.location.pathname !== "/org-setup") {
      return <Navigate to="/org-setup" replace />;
    }
  }

  // If org is pending approval, redirect to pending page
  if (hasOrg && orgStatus === "pending" && userRole !== "super_admin") {
    if (window.location.pathname !== "/org-pending") {
      return <Navigate to="/org-pending" replace />;
    }
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
