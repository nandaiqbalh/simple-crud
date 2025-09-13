import { ApiClient } from '@/utils/apiUtils';
import { UserListResponse, UserResponse } from '@/dtos/user.dto';
import { User, CreateUserForm, UpdateUserForm, UserSearchParams } from '@/entities/user.entity';
import { UserMapper } from '@/mappers/user.mapper';

function log(...args: any[]) {
  if (typeof window !== 'undefined') {
    // Log to browser console
    console.log('[UserService]', ...args);
  }
}

export class UserService {
  private static readonly BASE_ENDPOINT = '/api/go/users';
  
  /**
   * Get all users with optional search and sorting
   */
  static async getUsers(params?: UserSearchParams): Promise<User[]> {
    log('getUsers called with params:', params);
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.sort) queryParams.sort = params.sort;
    if (params?.order) queryParams.order = params.order;
    log('getUsers queryParams:', queryParams);
    const response = await ApiClient.get<UserListResponse>(
      this.BASE_ENDPOINT,
      queryParams
    );
    log('getUsers response:', response);
    if (!response.success) {
      log('getUsers error:', response.message);
      throw new Error(response.message);
    }
    return UserMapper.toEntityList(response.data);
  }
  
  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User> {
    log('getUserById called with id:', id);
    const response = await ApiClient.get<UserResponse>(
      `${this.BASE_ENDPOINT}/${id}`
    );
    log('getUserById response:', response);
    if (!response.success) {
      log('getUserById error:', response.message);
      throw new Error(response.message);
    }
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Create new user
   */
  static async createUser(form: CreateUserForm): Promise<User> {
    log('createUser called with form:', form);
    const dto = UserMapper.toCreateDto(form);
    log('createUser dto:', dto);
    const response = await ApiClient.post<UserResponse>(
      this.BASE_ENDPOINT,
      dto
    );
    log('createUser response:', response);
    if (!response.success) {
      log('createUser error:', response.message);
      throw new Error(response.message);
    }
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Update existing user
   */
  static async updateUser(form: UpdateUserForm): Promise<User> {
    log('updateUser called with form:', form);
    const dto = UserMapper.toUpdateDto(form);
    log('updateUser dto:', dto);
    const response = await ApiClient.put<UserResponse>(
      `${this.BASE_ENDPOINT}/${form.id}`,
      dto
    );
    log('updateUser response:', response);
    if (!response.success) {
      log('updateUser error:', response.message);
      throw new Error(response.message);
    }
    return UserMapper.toEntity(response.data);
  }
  
  /**
   * Delete user
   */
  static async deleteUser(id: number): Promise<void> {
    log('deleteUser called with id:', id);
    const response = await ApiClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_ENDPOINT}/${id}`
    );
    log('deleteUser response:', response);
    if (!response.success) {
      log('deleteUser error:', response.message);
      throw new Error(response.message);
    }
  }
  
  /**
   * Check database health
   */
  static async checkHealth(): Promise<boolean> {
    log('checkHealth called');
    try {
      const response = await ApiClient.get<{ success: boolean; message: string }>(
        '/api/go/healthdb'
      );
      log('checkHealth response:', response);
      return response.success;
    } catch (err) {
      log('checkHealth error:', err);
      return false;
    }
  }
}