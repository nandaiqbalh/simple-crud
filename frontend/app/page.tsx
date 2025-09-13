'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { User, CreateUserForm, UpdateUserForm, UserSearchParams } from '@/entities/user.entity';
import { UserList } from '@/components/user-list';
import { UserSearch } from '@/components/user-search';
import { UserForm } from '@/components/user-form';
import { DeleteUserDialog } from '@/components/delete-user-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserMapper } from '@/mappers/user.mapper';
import { Toaster } from '@/components/ui/sonner';

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    setSearchParams
  } = useUser();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Handle create user
  const handleCreateUser = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (form: CreateUserForm) => {
    const success = await createUser(form);
    if (success) {
      setIsCreateDialogOpen(false);
    }
    return success;
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (form: UpdateUserForm) => {
    const success = await updateUser(form);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    }
    return success;
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      const success = await deleteUser(selectedUser.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle search
  const handleSearch = (params: UserSearchParams) => {
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-gray-500">
              Manage your application users, roles, and permissions.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Component */}
        <UserSearch onSearch={handleSearch} loading={loading} />

        {/* User List */}
        <UserList
          users={users}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onCreate={handleCreateUser}
        />

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm
              onSubmit={handleCreateSubmit as (data: CreateUserForm | UpdateUserForm) => Promise<boolean>}
              onCancel={() => setIsCreateDialogOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <UserForm
                initialData={UserMapper.fromEntityToUpdateForm(selectedUser)}
                onSubmit={handleEditSubmit as (data: CreateUserForm | UpdateUserForm) => Promise<boolean>}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                }}
                loading={loading}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteUserDialog
          user={selectedUser}
          open={isDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={loading}
        />
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
