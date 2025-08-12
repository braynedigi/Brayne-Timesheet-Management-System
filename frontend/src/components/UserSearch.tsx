import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';
import { Search, X } from 'lucide-react';

interface UserSearchProps {
  onUserSelect: (user: { id: string; firstName: string; lastName: string; email: string }) => void;
  onClose: () => void;
  searchTerm: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, onClose, searchTerm }) => {
  const { users, fetchUsers } = useUserStore();
  const [filteredUsers, setFilteredUsers] = useState<typeof users>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch users if not already loaded
    if (users.length === 0) {
      setIsLoading(true);
      fetchUsers().finally(() => setIsLoading(false));
    }
  }, [users.length, fetchUsers]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered.slice(0, 5)); // Limit to 5 results
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    // Close on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleUserSelect = (user: typeof users[0]) => {
    onUserSelect({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    onClose();
  };

  if (filteredUsers.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      ref={searchRef}
      className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{ top: '100%', left: 0 }}
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Search className="h-4 w-4 mr-2" />
            <span>Select user to mention</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">
          Loading users...
        </div>
      ) : (
        <div className="py-1">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-blue-800">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
