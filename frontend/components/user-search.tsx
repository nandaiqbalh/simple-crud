'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';
import { UserSearchParams } from '@/entities/user.entity';

interface UserSearchProps {
  loading: boolean;
  onSearch: (params: UserSearchParams) => void;
}

export function UserSearch({ loading, onSearch }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<UserSearchParams['sort']>('timestamp');
  const [order, setOrder] = useState<UserSearchParams['order']>('desc');

  const handleSearch = () => {
    onSearch({
      search: searchTerm.trim() || undefined,
      sort: sortBy,
      order: order,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSortBy('timestamp');
    setOrder('desc');
    onSearch({
      sort: 'timestamp',
      order: 'desc',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as UserSearchParams['sort'])}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="email">Sort by Email</SelectItem>
                <SelectItem value="role">Sort by Role</SelectItem>
                <SelectItem value="age">Sort by Age</SelectItem>
                <SelectItem value="timestamp">Sort by Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={order} onValueChange={(value: string) => setOrder(value as UserSearchParams['order'])}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
