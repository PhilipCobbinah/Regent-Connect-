import React from 'react';
import { MessageSquare, UserPlus, BookOpen, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  type: 'message' | 'user' | 'course' | 'event';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message from John Doe',
    description: 'Regarding the upcoming mathematics exam',
    time: '5 minutes ago',
  },
  {
    id: '2',
    type: 'user',
    title: 'New student enrolled',
    description: 'Jane Smith joined Computer Science program',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'course',
    title: 'Course material updated',
    description: 'Physics 101 - Chapter 5 added',
    time: '3 hours ago',
  },
  {
    id: '4',
    type: 'event',
    title: 'Event scheduled',
    description: 'Annual Sports Day on March 15th',
    time: '1 day ago',
  },
];

const getIcon = (type: Activity['type']) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="text-blue-600" size={20} />;
    case 'user':
      return <UserPlus className="text-green-600" size={20} />;
    case 'course':
      return <BookOpen className="text-purple-600" size={20} />;
    case 'event':
      return <Calendar className="text-orange-600" size={20} />;
  }
};

export const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
            <div className="mt-1">{getIcon(activity.type)}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{activity.title}</p>
              <p className="text-gray-600 text-sm">{activity.description}</p>
              <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
