export { };

declare global {
  namespace Express {
    interface User {
      id: number;
      tutorId?: number;  // For tutor authentication
      email: string;
      username: string;
      role: string;  // Can be "User", "ADMIN", "SUPERADMIN", "TUTOR", etc.
    }
  }
}
