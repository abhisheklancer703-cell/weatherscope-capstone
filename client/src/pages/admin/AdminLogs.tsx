import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  LogOut,
  Settings,
  FileText,
  BarChart,
  Clock,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { UsageLog } from "@shared/schema";

export default function AdminLogs() {
  const [, setLocation] = useLocation();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/session"],
    refetchOnWindowFocus: true,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<UsageLog[]>({
    queryKey: ["/api/admin/usage-logs"],
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

  if (sessionLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'registration':
        return 'bg-green-600';
      case 'login':
        return 'bg-blue-600';
      case 'app_open':
        return 'bg-purple-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Usage Logs</h1>
              <p className="text-sm text-slate-400">Track application usage and events</p>
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
            <Button variant="ghost" className="text-slate-300" data-testid="link-dashboard">
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
            <Button variant="ghost" className="text-blue-400" data-testid="link-logs">
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Activity Logs ({logs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs && logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">User ID</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Time</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`row-log-${log.id}`}>
                        <td className="py-3 px-4 text-slate-300">{log.id}</td>
                        <td className="py-3 px-4 text-slate-300">{log.userId}</td>
                        <td className="py-3 px-4">
                          <Badge className={getActionBadgeColor(log.actionType)}>
                            {log.actionType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(log.accessTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {log.ipAddress || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No usage logs recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
