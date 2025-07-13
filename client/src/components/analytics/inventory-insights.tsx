
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, Calendar } from 'lucide-react';

interface InventoryInsights {
  topMovingItems: Array<{ name: string; movementCount: number }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  userActivityStats: Array<{ userName: string; requestCount: number; transferCount: number }>;
  monthlyTrends: Array<{ month: string; inbound: number; outbound: number }>;
}

export function InventoryInsights() {
  const { data: insights } = useQuery<InventoryInsights>({
    queryKey: ['/api/analytics/insights'],
  });

  if (!insights) return <div>Loading insights...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Moving Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.topMovingItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="movementCount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insights.categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {insights.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.userActivityStats.map(user => (
              <div key={user.userName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{user.userName}</span>
                <div className="text-sm text-gray-600">
                  {user.requestCount} requests | {user.transferCount} transfers
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="inbound" fill="#10b981" name="Inbound" />
              <Bar dataKey="outbound" fill="#ef4444" name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
