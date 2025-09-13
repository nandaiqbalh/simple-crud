// DTO matches exact backend response structure
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  birth: string; // ISO date string from backend
  age: number;
  timestamp: string; // ISO datetime string from backend
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface UserListResponse extends ApiResponse<UserDto[]> {}
export interface UserResponse extends ApiResponse<UserDto> {}

export interface CreateUserDto {
  name: string;
  email: string;
  role: string;
  birth: string; // ISO date string
}

export interface UpdateUserDto extends CreateUserDto {
  id: number;
}