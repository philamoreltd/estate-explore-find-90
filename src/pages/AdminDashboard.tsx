import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Home, 
  Eye, 
  Edit,
  Trash2, 
  MapPin, 
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  Building,
  Shield,
  User,
  Clock
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { AddPropertyDialog } from "@/components/admin/AddPropertyDialog";
import { ActivityLogs } from "@/components/admin/ActivityLogs";

interface UserData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  role?: string;
}

interface Property {
  id: string;
  title: string;
  property_type: string;
  rent_amount: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges to access this page.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all users from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        // Fetch roles for each user
        const usersWithRoles = await Promise.all(
          (profilesData || []).map(async (profile) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.user_id)
              .single();
            
            return {
              ...profile,
              role: roleData?.role || 'user'
            };
          })
        );
        setUsers(usersWithRoles);
      }

      // Fetch all properties without the join first
      const { data: propertiesData, error: propertiesError } = await supabase
        .rpc('get_properties_with_conditional_phone')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
      } else {
        // Fetch profile data for each property owner
        const propertiesWithProfiles = await Promise.all(
          (propertiesData || []).map(async (property) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', property.user_id)
              .single();
            
            return {
              ...property,
              profiles: profileData || null
            };
          })
        );
        setProperties(propertiesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (action: string, entityType: string, entityId?: string, details?: Record<string, string>) => {
    if (!user) return;
    try {
      await supabase.from('activity_logs').insert([{
        staff_id: user.id,
        action_type: action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details as any || null,
      }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Get user info for logging
      const targetUser = users.find(u => u.user_id === userId);
      
      // First, remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: userId, 
          role: newRole as 'admin' | 'landlord' | 'tenant' | 'user', 
          assigned_by: user?.id 
        }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user role.",
          variant: "destructive",
        });
        return;
      }

      // Log the activity
      await logActivity('updated_role', newRole, userId, {
        email: targetUser?.email || '',
        full_name: targetUser?.full_name || '',
        role: newRole,
      });

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      // Get property info for logging
      const targetProperty = properties.find(p => p.id === propertyId);

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete property.",
          variant: "destructive",
        });
        return;
      }

      // Log the activity
      await logActivity('deleted_property', 'property', propertyId, {
        title: targetProperty?.title || '',
        location: targetProperty?.location || '',
      });

      toast({
        title: "Success",
        description: "Property deleted successfully.",
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'landlord': return 'bg-blue-100 text-blue-800';
      case 'tenant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-real-estate-blue mx-auto"></div>
            <p className="mt-4 text-real-estate-gray">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-real-estate-navy mb-2">
            Admin Dashboard
          </h1>
          <p className="text-real-estate-gray">
            Monitor and manage all platform activities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-xl font-bold text-foreground">{users.length}</p>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Landlords</p>
                  <p className="text-xl font-bold text-blue-600">
                    {users.filter(u => u.role === 'landlord').length}
                  </p>
                </div>
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tenants</p>
                  <p className="text-xl font-bold text-green-600">
                    {users.filter(u => u.role === 'tenant').length}
                  </p>
                </div>
                <User className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="text-xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Properties</p>
                  <p className="text-xl font-bold text-orange-600">{properties.length}</p>
                </div>
                <Home className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-xl font-bold text-teal-600">
                    {properties.filter(p => p.status === 'available').length}
                  </p>
                </div>
                <Activity className="h-6 w-6 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="landlords" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="landlords">Landlords</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="payments" onClick={() => navigate('/admin/payments')}>Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="landlords" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Landlords ({users.filter(u => u.role === 'landlord').length})
                  </CardTitle>
                  <CardDescription>
                    Manage registered landlords
                  </CardDescription>
                </div>
                <AddUserDialog defaultRole="landlord" onSuccess={fetchDashboardData} />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Phone</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'landlord').map((userData) => (
                        <tr key={userData.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{userData.full_name || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.email}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.phone || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <select
                              value={userData.role}
                              onChange={(e) => updateUserRole(userData.user_id, e.target.value)}
                              className="text-xs border rounded px-2 py-1 bg-background"
                            >
                              <option value="user">User</option>
                              <option value="tenant">Tenant</option>
                              <option value="landlord">Landlord</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role === 'landlord').length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No landlords registered</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Tenants ({users.filter(u => u.role === 'tenant').length})
                  </CardTitle>
                  <CardDescription>
                    Manage registered tenants
                  </CardDescription>
                </div>
                <AddUserDialog defaultRole="tenant" onSuccess={fetchDashboardData} />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Phone</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'tenant').map((userData) => (
                        <tr key={userData.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{userData.full_name || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.email}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.phone || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <select
                              value={userData.role}
                              onChange={(e) => updateUserRole(userData.user_id, e.target.value)}
                              className="text-xs border rounded px-2 py-1 bg-background"
                            >
                              <option value="user">User</option>
                              <option value="tenant">Tenant</option>
                              <option value="landlord">Landlord</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role === 'tenant').length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No tenants registered</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Staff / Admins ({users.filter(u => u.role === 'admin').length})
                  </CardTitle>
                  <CardDescription>
                    Manage platform administrators
                  </CardDescription>
                </div>
                <AddUserDialog defaultRole="admin" onSuccess={fetchDashboardData} />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Phone</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'admin').map((userData) => (
                        <tr key={userData.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{userData.full_name || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.email}</td>
                          <td className="p-4 text-sm text-muted-foreground">{userData.phone || 'N/A'}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <select
                              value={userData.role}
                              onChange={(e) => updateUserRole(userData.user_id, e.target.value)}
                              className="text-xs border rounded px-2 py-1 bg-background"
                            >
                              <option value="user">User</option>
                              <option value="tenant">Tenant</option>
                              <option value="landlord">Landlord</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role === 'admin').length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No staff members</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-orange-600" />
                    Properties Management ({properties.length})
                  </CardTitle>
                  <CardDescription>
                    Monitor all property listings and their status
                  </CardDescription>
                </div>
                <AddPropertyDialog 
                  landlords={users.filter(u => u.role === 'landlord').map(u => ({ user_id: u.user_id, full_name: u.full_name, email: u.email }))} 
                  onSuccess={fetchDashboardData} 
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {property.title}
                          </h3>
                          <Badge className={getStatusColor(property.status)}>
                            {property.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{property.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(property.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Owner:</span> {property.profiles?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Email:</span> {property.profiles?.email || 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(property.rent_amount)}/month
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {property.bedrooms} bed, {property.bathrooms} bath
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => navigate(`/property/${property.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => navigate(`/edit-property/${property.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteProperty(property.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;