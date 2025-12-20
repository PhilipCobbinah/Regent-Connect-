import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'academic' | 'sports' | 'cultural' | 'other';
}

const events: Event[] = [
  {
    id: '1',
    title: 'Mid-term Examinations',
    date: 'March 15-20, 2024',
    time: '9:00 AM',
    location: 'Examination Hall',
    type: 'academic',
  },
  {
    id: '2',
    title: 'Annual Sports Day',
    date: 'March 22, 2024',
    time: '8:00 AM',
    location: 'Main Sports Ground',
    type: 'sports',
  },
  {
    id: '3',
    title: 'Cultural Festival',
    date: 'March 28, 2024',
    time: '5:00 PM',
    location: 'Auditorium',
    type: 'cultural',
  },
];

const getTypeColor = (type: Event['type']) => {
  switch (type) {
    case 'academic':
      return 'bg-blue-100 text-blue-800';
    case 'sports':
      return 'bg-green-100 text-green-800';
    case 'cultural':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const UpcomingEvents: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border-l-4 border-blue-600 pl-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{event.title}</h3>
              <span className={`px-2 py-1 rounded text-xs ${getTypeColor(event.type)}`}>
                {event.type}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={14} className="mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-2" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={14} className="mr-2" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-semibold">
        View All Events
      </button>
    </div>
  );
};
