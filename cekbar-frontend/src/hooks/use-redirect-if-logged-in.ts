import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export function useRedirectIfLoggedIn() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.role === "admin" || data.user.role === "superadmin") {
              navigate("/admin", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }
        }
      } catch {}
    }
    checkSession();
  }, [navigate]);
}
