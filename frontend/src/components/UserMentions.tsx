import React from 'react';
import { User, AtSign } from 'lucide-react';

interface UserMentionProps {
  mentions: {
    id: string;
    mentionedUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
}

const UserMentions: React.FC<UserMentionProps> = ({ mentions }) => {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      <div className="flex items-center text-xs text-gray-500 mr-1">
        <AtSign className="h-3 w-3 mr-1" />
        <span>Mentioned:</span>
      </div>
      {mentions.map((mention) => (
        <div
          key={mention.id}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          title={`${mention.mentionedUser.firstName} ${mention.mentionedUser.lastName} (${mention.mentionedUser.email})`}
        >
          <User className="h-3 w-3 mr-1" />
          {mention.mentionedUser.firstName} {mention.mentionedUser.lastName}
        </div>
      ))}
    </div>
  );
};

export default UserMentions;
