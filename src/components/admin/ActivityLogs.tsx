import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, Building, Home, Shield } from "lucide-react";

interface ActivityLog {
  id: string;
  staff_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  staff_name?: string;
  staff_email?: string;
}

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return;
      }

      // Fetch staff profiles
      const logsWithStaff = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', log.staff_id)
            .maybeSingle();

          return {
            ...log,
            staff_name: profile?.full_name || 'Unknown',
            staff_email: profile?.email || '',
          };
        })
      );

      setLogs(logsWithStaff);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (entityType: string) => {
    switch (entityType) {
      case 'landlord': return <Building className="h-4 w-4 text-blue-600" />;
      case 'tenant': return <User className="h-4 w-4 text-green-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'property': return <Home className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'created_user': return <Badge className="bg-green-100 text-green-800">Created User</Badge>;
      case 'created_property': return <Badge className="bg-blue-100 text-blue-800">Created Property</Badge>;
      case 'updated_role': return <Badge className="bg-yellow-100 text-yellow-800">Updated Role</Badge>;
      case 'deleted_property': return <Badge className="bg-red-100 text-red-800">Deleted Property</Badge>;
      default: return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  const formatDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    const parts: string[] = [];
    if (details.email) parts.push(`Email: ${details.email}`);
    if (details.full_name) parts.push(`Name: ${details.full_name}`);
    if (details.title) parts.push(`Title: ${details.title}`);
    if (details.location) parts.push(`Location: ${details.location}`);
    if (details.role) parts.push(`Role: ${details.role}`);
    return parts.join(' • ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading activity logs...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          Track all staff activities on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No activities recorded yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="mt-1">{getActionIcon(log.entity_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action_type)}
                    <span className="text-sm font-medium">{log.staff_name}</span>
                    <span className="text-xs text-muted-foreground">({log.staff_email})</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {formatDetails(log.details)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
