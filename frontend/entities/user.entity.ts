// Entity for UI components - user-friendly data types
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  birth: Date;
  age: number;
  timestamp: Date;
  formattedBirth: string; // for display
  formattedTimestamp: string; // for display
}

export type UserRole = 'admin' | 'user' | 'moderator';

export interface CreateUserForm {
  name: string;
  email: string;
  role: UserRole;
  birth: Date;
}

export interface UpdateUserForm extends CreateUserForm {
  id: number;
}

export interface UserSearchParams {
  search?: string;
  sort?: 'name' | 'email' | 'role' | 'age' | 'timestamp';
  order?: 'asc' | 'desc';
}