import { API_URL } from "../config/app";

export async function resolvePostLoginRoute(
  user,
) {
  if (!user) {
    return "/auth";
  }

  try {
    const token =
      await user.getIdToken(
        true,
      );

    const response =
      await fetch(
        `${API_URL}/api/admin/access`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          credentials:
            "include",
        },
      );

    if (response.ok) {
      return "/admin/dashboard";
    }
  } catch (error) {
    console.error(
      "Admin route check failed:",
      error,
    );
  }

  return "/home";
}
