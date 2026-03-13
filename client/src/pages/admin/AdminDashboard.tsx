import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Activity, 
  UserCheck, 
  UserX, 
  Calendar, 
  LogOut,
  Download,
  Settings,
  FileText,
  BarChart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

type DashboardStats = {
  totalUsers: number;
  totalVisits: number;
  activeUsers: number;
  disabledUsers: number;
  todayVisits: number;
  usageByDate: { date: string; count: number }[];
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/session"],
    refetchOnWindowFocus: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!(session as any)?.authenticated,
  });

  useEffect(() => {
    if (!sessionLoading && !(session as any)?.authenticated) {
      setLocation("/admin");
    }
  }, [session, sessionLoading, setLocation]);

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    setLocation("/admin");
  };

  if (sessionLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BarChart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">WeatherScope Analytics</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-3">
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-400" data-testid="link-dashboard">
              <BarChart className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="text-slate-300" data-testid="link-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
          </Link>
          <Link href="/admin/logs">
            <Button variant="ghost" className="text-slate-300" data-testid="link-logs">
              <FileText className="w-4 h-4 mr-2" />
              Usage Logs
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="text-slate-300" data-testid="link-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </nav>

      <main className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Visits</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-visits">{stats?.totalVisits || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-active-users">{stats?.activeUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Today's Visits</CardTitle>
              <Calendar className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-today-visits">{stats?.todayVisits || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Usage by Date (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.usageByDate && stats.usageByDate.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.usageByDate.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300 text-sm">{new Date(item.date).toLocaleDateString()}</span>
                      <span className="text-blue-400 font-medium">{item.count} visits</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No usage data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">
                Download user data and usage logs as CSV files.
              </p>
              <div className="flex flex-col gap-3">
                <a href="/api/admin/export/users" download>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-export-users">
                    <Download className="w-4 h-4 mr-2" />
                    Export Users CSV
                  </Button>
                </a>
                <a href="/api/admin/export/logs" download>
                  <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-export-logs">
                    <Download className="w-4 h-4 mr-2" />
                    Export Usage Logs CSV
                  </Button>
                </a>
              </div>
              
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <p className="text-amber-400 text-xs">
                  Note: Web applications track access events, not Play Store-style installs. 
                  First access dates represent when users first opened the application.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
