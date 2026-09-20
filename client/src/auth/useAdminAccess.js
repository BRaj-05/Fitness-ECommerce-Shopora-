import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "./useAuth";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { API_URL } from "../config/app";

export function useAdminAccess() {
  const { user } = useAuth();

  const [state, setState] =
    useState({
      checking: Boolean(user),
      allowed: false,
      role: null,
      details: null,
    });

  useEffect(() => {
    let active = true;

    if (!user) {
      setState({
        checking: false,
        allowed: false,
        role: null,
        details: null,
      });

      return () => {
        active = false;
      };
    }

    const check = async () => {
      setState((current) => ({
        ...current,
        checking: true,
      }));

      try {
        const headers =
          await getAuthHeaders();

        const response =
          await fetch(
            `${API_URL}/api/admin/access`,
            {
              headers,
              credentials: "include",
            },
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!active) return;

        if (!response.ok) {
          setState({
            checking: false,
            allowed: false,
            role: null,
            details: null,
          });

          return;
        }

        setState({
          checking: false,
          allowed: true,
          role:
            data.role || "admin",
          details:
            data.user || null,
        });
      } catch {
        if (!active) return;

        setState({
          checking: false,
          allowed: false,
          role: null,
          details: null,
        });
      }
    };

    check();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  return state;
}
