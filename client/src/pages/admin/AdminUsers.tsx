import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  UserCheck,
  UserX,
  Trash2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@shared/schema";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/session"],
    refetchOnWindowFocus: true,
  });

  const { data: users, isLoading: usersLoading } = useQuery<AppUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(session as any)?.authenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "User status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "User deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
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

  if (sessionLoading || usersLoading) {
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
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-slate-400">View and manage registered users</p>
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
            <Button variant="ghost" className="text-blue-400" data-testid="link-users">
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Registered Users ({users?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Registered</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">First Access</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`row-user-${user.id}`}>
                        <td className="py-3 px-4 text-slate-300">{user.id}</td>
                        <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-slate-300">{user.email}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(user.registeredAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {user.firstAccessAt ? new Date(user.firstAccessAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-600' : 'bg-red-600'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: user.id, status: 'disabled' })}
                                className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-disable-${user.id}`}
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Disable
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: user.id, status: 'active' })}
                                className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-enable-${user.id}`}
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Enable
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                              disabled={deleteUserMutation.isPending}
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No registered users yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
