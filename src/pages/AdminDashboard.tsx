import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Home, 
  Eye, 
  Trash2, 
  MapPin, 
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  Building
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
        .from('properties')
        .select('*')
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Total Users</p>
                  <p className="text-2xl font-bold text-real-estate-navy">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-real-estate-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Total Properties</p>
                  <p className="text-2xl font-bold text-green-600">{properties.length}</p>
                </div>
                <Building className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Available Properties</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.status === 'available').length}
                  </p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-real-estate-gray">Total Revenue</p>
                  <p className="text-2xl font-bold text-real-estate-blue">
                    {formatPrice(properties.filter(p => p.status === 'rented').reduce((sum, p) => sum + p.rent_amount, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-real-estate-blue" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="properties">Properties Management</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Users Management
                </CardTitle>
                <CardDescription>
                  View and manage all registered users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Phone</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userData) => (
                        <tr key={userData.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{userData.full_name || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-real-estate-gray">
                            {userData.email}
                          </td>
                          <td className="p-4 text-sm text-real-estate-gray">
                            {userData.phone || 'N/A'}
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleColor(userData.role)}>
                              {userData.role}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-real-estate-gray">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <select
                                value={userData.role}
                                onChange={(e) => updateUserRole(userData.user_id, e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value="user">User</option>
                                <option value="tenant">Tenant</option>
                                <option value="landlord">Landlord</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Properties Management
                </CardTitle>
                <CardDescription>
                  Monitor all property listings and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-real-estate-navy line-clamp-2">
                            {property.title}
                          </h3>
                          <Badge className={getStatusColor(property.status)}>
                            {property.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-1 text-real-estate-gray text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{property.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-real-estate-gray text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(property.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-real-estate-gray">
                            <span className="font-medium">Owner:</span> {property.profiles?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-real-estate-gray">
                            <span className="font-medium">Email:</span> {property.profiles?.email || 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold text-real-estate-blue">
                            {formatPrice(property.rent_amount)}/month
                          </span>
                          <span className="text-sm text-real-estate-gray">
                            {property.bedrooms} bed, {property.bathrooms} bath
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;