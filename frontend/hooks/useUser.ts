'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, CreateUserForm, UpdateUserForm, UserSearchParams } from '@/entities/user.entity';
import { UserService } from '@/services/user.service';
import { toast } from 'sonner';

interface UseUserState {
  users: User[];
  loading: boolean;
  error: string | null;
  searchParams: UserSearchParams;
}

interface UseUserActions {
  fetchUsers: () => Promise<void>;
  createUser: (form: CreateUserForm) => Promise<boolean>;
  updateUser: (form: UpdateUserForm) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  setSearchParams: (params: UserSearchParams) => void;
  clearError: () => void;
}

export function useUser(): UseUserState & UseUserActions {
  const [state, setState] = useState<UseUserState>({
    users: [],
    loading: false,
    error: null,
    searchParams: {
      search: '',
      sort: 'timestamp',
      order: 'desc'
    }
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setUsers = (users: User[]) => {
    setState(prev => ({ ...prev, users }));
  };

  const setSearchParams = (searchParams: UserSearchParams) => {
    setState(prev => ({ ...prev, searchParams }));
  };

  const clearError = () => setError(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const users = await UserService.getUsers(state.searchParams);
      setUsers(users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.searchParams]);

  const createUser = async (form: CreateUserForm): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await UserService.createUser(form);
      toast.success('User created successfully');
      
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (form: UpdateUserForm): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await UserService.updateUser(form);
      toast.success('User updated successfully');
      
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await UserService.deleteUser(id);
      toast.success('User deleted successfully');
      
      // Refresh users list
      await fetchUsers();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when search params change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    searchParams: state.searchParams,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setSearchParams,
    clearError
  };
}