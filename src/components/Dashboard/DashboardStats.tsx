import React from 'react';
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="text-blue-600">{icon}</div>
    </div>
  </div>
);

export const DashboardStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Students"
        value="1,234"
        icon={<Users size={32} />}
        trend="+12% from last month"
        trendUp={true}
      />
      <StatCard
        title="Active Courses"
        value="48"
        icon={<BookOpen size={32} />}
        trend="+3 new this week"
        trendUp={true}
      />
      <StatCard
        title="Upcoming Events"
        value="15"
        icon={<Calendar size={32} />}
      />
      <StatCard
        title="Engagement Rate"
        value="87%"
        icon={<TrendingUp size={32} />}
        trend="+5% from last week"
        trendUp={true}
      />
    </div>
  );
};
