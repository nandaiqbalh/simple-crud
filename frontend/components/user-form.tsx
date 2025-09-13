'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CreateUserForm, UpdateUserForm, UserRole } from '@/entities/user.entity';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface UserFormProps {
  initialData?: UpdateUserForm;
  onSubmit: (data: CreateUserForm | UpdateUserForm) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function UserForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = initialData ? 'edit' : 'create'
}: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserForm | UpdateUserForm>({
    id: initialData?.id || 0,
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'user',
    birth: initialData?.birth || new Date(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.birth) {
      newErrors.birth = 'Birth date is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Create the proper data structure based on mode
      const submitData = mode === 'edit' && initialData 
        ? { ...formData, id: initialData.id } as UpdateUserForm
        : formData as CreateUserForm;
        
      const success = await onSubmit(submitData);
      if (success) {
        onCancel(); // Close form on success
      }
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isEditing = mode === 'edit';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter user name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="Enter email address"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) => handleInputChange('role', value)}
        >
          <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <span className="text-red-500 text-sm">{errors.role}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth">Birth Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="birth"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.birth && "text-muted-foreground",
                errors.birth && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.birth ? format(formData.birth, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.birth}
              onSelect={(date) => {
                if (date) {
                  handleInputChange('birth', date);
                  setIsCalendarOpen(false);
                }
              }}
              initialFocus
              captionLayout="dropdown"
              className="rounded-md border shadow-sm"
            />
          </PopoverContent>
        </Popover>
        {errors.birth && <span className="text-red-500 text-sm">{errors.birth}</span>}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
