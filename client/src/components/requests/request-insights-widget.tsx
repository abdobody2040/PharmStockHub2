import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { InventoryRequest, SafeUser } from "@shared/schema";
import { cn } from "@/lib/utils";
import { addDays, format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

interface RequestInsightsWidgetProps {
  userId?: number;
  className?: string;
}

export function RequestInsightsWidget({ userId, className }: RequestInsightsWidgetProps) {
  const { data: requests = [] } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/requests"],
  });

  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  // Filter requests for current user if userId provided
  const userRequests = userId 
    ? requests.filter(req => req.requestedBy === userId)
    : requests;

  // Calculate insights
  const totalRequests = userRequests.length;
  const pendingRequests = userRequests.filter(req => req.status === "pending").length;
  const approvedRequests = userRequests.filter(req => req.status === "approved").length;
  const deniedRequests = userRequests.filter(req => req.status === "denied").length;
  const completedRequests = userRequests.filter(req => req.status === "completed").length;

  // Calculate approval rate
  const processedRequests = approvedRequests + deniedRequests;
  const approvalRate = processedRequests > 0 ? (approvedRequests / processedRequests) * 100 : 0;

  // Calculate this week's requests
  const thisWeekStart = startOfWeek(new Date());
  const thisWeekEnd = endOfWeek(new Date());
  const thisWeekRequests = userRequests.filter(req => {
    const createdAt = new Date(req.createdAt);
    return isWithinInterval(createdAt, { start: thisWeekStart, end: thisWeekEnd });
  }).length;

  // Calculate average processing time (simplified)
  const completedRequestsWithTime = userRequests.filter(req => 
    req.status === "completed" && req.completedAt
  );
  const avgProcessingTime = completedRequestsWithTime.length > 0
    ? completedRequestsWithTime.reduce((sum, req) => {
        const created = new Date(req.createdAt);
        const completed = new Date(req.completedAt!);
        return sum + (completed.getTime() - created.getTime());
      }, 0) / completedRequestsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Most active requester
  const requesterCounts = requests.reduce((acc, req) => {
    acc[req.requestedBy] = (acc[req.requestedBy] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostActiveRequester = Object.entries(requesterCounts)
    .sort(([, a], [, b]) => b - a)[0];

  const mostActiveUser = mostActiveRequester
    ? users.find(u => u.id === parseInt(mostActiveRequester[0]))
    : null;

  const insightCards = [
    {
      title: "Total Requests",
      value: totalRequests,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: thisWeekRequests > 0 ? "up" : "neutral",
      subtitle: `${thisWeekRequests} this week`
    },
    {
      title: "Approval Rate",
      value: `${Math.round(approvalRate)}%`,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: approvalRate > 70 ? "up" : approvalRate < 40 ? "down" : "neutral",
      subtitle: `${approvedRequests}/${processedRequests} approved`
    },
    {
      title: "Pending",
      value: pendingRequests,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      trend: pendingRequests > 5 ? "up" : "neutral",
      subtitle: "Awaiting action"
    },
    {
      title: "Avg Processing",
      value: `${Math.round(avgProcessingTime)}d`,
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: avgProcessingTime < 2 ? "up" : avgProcessingTime > 5 ? "down" : "neutral",
      subtitle: "Processing time"
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Request Insights</h3>
        <Badge variant="secondary" className="text-xs">
          <BarChart3 className="h-3 w-3 mr-1" />
          Analytics
        </Badge>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {insightCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === "up" ? TrendingUp : 
                           card.trend === "down" ? TrendingDown : 
                           Activity;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("p-2 rounded-lg", card.bgColor)}>
                      <Icon className={cn("h-4 w-4", card.color)} />
                    </div>
                    <TrendIcon className={cn(
                      "h-3 w-3",
                      card.trend === "up" ? "text-green-500" :
                      card.trend === "down" ? "text-red-500" :
                      "text-gray-400"
                    )} />
                  </div>
                  
                  <div className="space-y-1">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="text-2xl font-bold text-gray-900"
                    >
                      {card.value}
                    </motion.div>
                    
                    <p className="text-xs text-gray-500">{card.title}</p>
                    <p className="text-xs text-gray-400">{card.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Request Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approved
              </span>
              <span className="font-medium">{approvedRequests}</span>
            </div>
            <Progress value={(approvedRequests / totalRequests) * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </span>
              <span className="font-medium">{pendingRequests}</span>
            </div>
            <Progress value={(pendingRequests / totalRequests) * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Denied
              </span>
              <span className="font-medium">{deniedRequests}</span>
            </div>
            <Progress value={(deniedRequests / totalRequests) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Most Active Requester */}
      {mostActiveUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Most Active Requester</p>
                  <p className="text-xs text-gray-600">
                    {mostActiveUser.name} • {mostActiveRequester[1]} requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}