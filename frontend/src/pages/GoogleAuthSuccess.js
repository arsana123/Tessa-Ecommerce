import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleAuthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const user = {
        id:   payload.id,
        role: payload.role,
      };

      login(token, user);

      // Small delay so AuthContext state updates before redirect
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);

    } catch {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "40vh" }}>
      <p>Signing you in...</p>
    </div>
  );
}