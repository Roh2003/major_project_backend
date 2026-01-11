export { };

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      role: string;  // Can be "User", "ADMIN", "SUPERADMIN", etc.
    }
  }
}
