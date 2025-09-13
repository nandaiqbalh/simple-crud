import { ApiClient } from '@/utils/apiUtils';
import { UserDto, UserListResponse, UserResponse, CreateUserDto, UpdateUserDto } from '@/dtos/user.dto';
import { User, CreateUserForm, UpdateUserForm, UserSearchParams } from '@/entities/user.entity';
import { UserMapper } from '@/mappers/user.mapper';

export class UserService {
  private static readonly BASE_ENDPOINT = '/api/go/users';
  
  /**
   * Get all users with optional search and sorting
   */
  static async getUsers(params?: UserSearchParams): Promise<User[]> {
    const queryParams: Record<string, string> = {};
    
    if (params?.search) {
      queryParams.search = params.search;
    }
    
    if (params?.sort) {
      queryParams.sort = params.sort;
    }
    
    if (params?.order) {
      queryParams.order = params.order;
    }
    
    const response = await ApiClient.get<UserListResponse>(
      this.BASE_ENDPOINT,
      queryParams
    );
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return UserMapper.toEntityList(response.data);
  }
  
  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User> {
    const response = await ApiClient.get<UserResponse>(
      `${this.BASE_ENDPOINT}/${id}`
    );
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Create new user
   */
  static async createUser(form: CreateUserForm): Promise<User> {
    const dto = UserMapper.toCreateDto(form);
    
    const response = await ApiClient.post<UserResponse>(
      this.BASE_ENDPOINT,
      dto
    );
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Update existing user
   */
  static async updateUser(form: UpdateUserForm): Promise<User> {
    const dto = UserMapper.toUpdateDto(form);
    
    const response = await ApiClient.put<UserResponse>(
      `${this.BASE_ENDPOINT}/${form.id}`,
      dto
    );
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Delete user
   */
  static async deleteUser(id: number): Promise<void> {
    const response = await ApiClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_ENDPOINT}/${id}`
    );
    
    if (!response.success) {
      throw new Error(response.message);
    }
  }
  
  /**
   * Check database health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await ApiClient.get<{ success: boolean; message: string }>(
        '/api/go/healthdb'
      );
      return response.success;
    } catch {
      return false;
    }
  }
}