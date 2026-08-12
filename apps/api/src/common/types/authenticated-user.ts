import { UserRole } from "../enums";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: UserRole;
};
