import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "sales_rep" | "manager" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isSalesRep: boolean;
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  isAdmin: false,
  isManager: false,
  isSalesRep: false,
  isPasswordRecovery: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setUserRole((data?.role as AppRole) ?? "sales_rep");
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer role fetch to avoid Supabase auth deadlock
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set loading false once role is fetched (for onAuthStateChange path)
  useEffect(() => {
    if (user && userRole !== null) {
      setLoading(false);
    }
  }, [user, userRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isSalesRep = userRole === "sales_rep";

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, isAdmin, isManager, isSalesRep, isPasswordRecovery, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
