import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const LoginRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/auth");
  }, [navigate]);

  return null;
};