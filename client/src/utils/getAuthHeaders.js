export async function getAuthHeaders() {
  // Development: prefer a local dev token if present
  if (import.meta.env.MODE === 'development') {
    const devToken = localStorage.getItem('dev_token');
    if (devToken) {
      return { "Content-Type": "application/json", "Authorization": `Bearer ${devToken}` };
    }
  }

  return { "Content-Type": "application/json" };
}
