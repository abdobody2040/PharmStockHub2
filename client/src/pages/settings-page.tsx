import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import CategoryManagement from "@/components/settings/category-management";
import { SpecialtyManagement } from "@/components/settings/specialty-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Settings, 
  AlertTriangle as AlertTriangleIcon, 
  Save,
  Bell,
  Shield,
  Database,
  User,
  FileOutput,
  LogOut
} from "lucide-react";

// Form Schemas
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  region: z.string().optional(),
  avatar: z.any().optional(),
});

const notificationFormSchema = z.object({
  stockAlerts: z.boolean().default(true),
  expiryAlerts: z.boolean().default(true),
  movementAlerts: z.boolean().default(false),
  expiryAlertDays: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Must be a valid number",
  }),
});

const systemFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(1, "Please select a language"),
  autoLogout: z.boolean(),
  expandSidebar: z.boolean(),
});

const securityFormSchema = z.object({
  passwordLength: z.string().min(1, "Required"),
  passwordExpiry: z.string().min(1, "Required"),
  sessionTimeout: z.string().min(1, "Required"),
  twoFactorEnabled: z.boolean(),
});

const dataManagementSchema = z.object({
  autoBackupEnabled: z.boolean(),
  backupFrequency: z.string().min(1, "Required"),
  backupRetention: z.string().min(1, "Required"),
  autoExportEnabled: z.boolean(),
  exportFormat: z.string().min(1, "Required"),
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar || null
  );

  // Profile Form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      region: user?.region || "",
    },
  });

  // Notification Form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      stockAlerts: true,
      expiryAlerts: true,
      movementAlerts: false,
      expiryAlertDays: "30",
    },
  });

  // System Form
  const systemForm = useForm<z.infer<typeof systemFormSchema>>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      autoLogout: true,
      expandSidebar: true,
    },
  });

  // Security Form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      passwordLength: "8",
      passwordExpiry: "90",
      sessionTimeout: "30",
      twoFactorEnabled: false,
    },
  });

  // Data Management Form
  const dataManagementForm = useForm<z.infer<typeof dataManagementSchema>>({
    resolver: zodResolver(dataManagementSchema),
    defaultValues: {
      autoBackupEnabled: true,
      backupFrequency: "7",
      backupRetention: "90",
      autoExportEnabled: false,
      exportFormat: "xlsx",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        username: user.username || "",
        region: user.region || "",
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("username", data.username);
      if (data.region) {
        formData.append("region", data.region);
      }
      if (data.avatar && data.avatar instanceof FileList && data.avatar.length > 0) {
        formData.append("avatar", data.avatar[0]);
      }

      const response = await apiRequest("PUT", `/api/users/${user?.id}`, formData, true);
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        });
        // Invalidate user query to update user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  const onNotificationSubmit = async (data: z.infer<typeof notificationFormSchema>) => {
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const onSystemSubmit = async (data: z.infer<typeof systemFormSchema>) => {
    toast({
      title: "System Settings Updated",
      description: "Your system preferences have been saved.",
    });
  };

  const onSecuritySubmit = async (data: z.infer<typeof securityFormSchema>) => {
    toast({
      title: "Security Settings Updated",
      description: "Your security preferences have been saved.",
    });
  };

  const onDataManagementSubmit = async (data: z.infer<typeof dataManagementSchema>) => {
    toast({
      title: "Data Management Settings Updated",
      description: "Your data management preferences have been saved.",
    });
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      profileForm.setValue("avatar", event.target.files);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="md:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="profile"
                  className="w-full"
                  orientation="vertical"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList className="flex flex-col items-start space-y-1 w-full">
                    <TabsTrigger value="profile" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="system" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      System
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="data" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Data Management
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="md:w-3/4">
            <Tabs
              defaultValue="profile"
              value={activeTab}
              className="w-full"
              onValueChange={setActiveTab}
            >
              {/* Profile Settings */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Manage your personal information and account settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="space-y-6">
                          <div className="flex flex-col items-center space-y-4">
                            <div
                              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 cursor-pointer"
                              onClick={handleAvatarClick}
                            >
                              {avatarPreview ? (
                                <img
                                  src={avatarPreview}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <User size={40} />
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={handleAvatarClick}
                            >
                              Change Avatar
                            </Button>
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="johndoe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="region"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a region" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="north">North</SelectItem>
                                    <SelectItem value="south">South</SelectItem>
                                    <SelectItem value="east">East</SelectItem>
                                    <SelectItem value="west">West</SelectItem>
                                    <SelectItem value="central">Central</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Profile
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Manage how and when you receive notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Stock Notifications</h3>
                          <div className="space-y-4">
                            <FormField
                              control={notificationForm.control}
                              name="stockAlerts"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      id="stock-alerts"
                                    />
                                  </FormControl>
                                  <FormLabel htmlFor="stock-alerts">Low Stock Alerts</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="expiryAlerts"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      id="expiry-alerts"
                                    />
                                  </FormControl>
                                  <FormLabel htmlFor="expiry-alerts">Expiry Date Alerts</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={notificationForm.control}
                              name="expiryAlertDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days Before Expiry to Alert</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      max="90" 
                                      {...field}
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <h3 className="text-lg font-medium pt-4">Movement Notifications</h3>
                          <FormField
                            control={notificationForm.control}
                            name="movementAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                    id="movement-alerts"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="movement-alerts">Stock Movement Alerts</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Notification Settings
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings */}
              <TabsContent value="system">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                      Customize system appearance and behavior.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...systemForm}>
                      <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Display Settings</h3>
                          <FormField
                            control={systemForm.control}
                            name="theme"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Theme</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={systemForm.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="ar">Arabic</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <h3 className="text-lg font-medium pt-4">Behavior</h3>
                          <FormField
                            control={systemForm.control}
                            name="autoLogout"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                    id="auto-logout"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="auto-logout">Auto Logout on Inactivity</FormLabel>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={systemForm.control}
                            name="expandSidebar"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                    id="expand-sidebar"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="expand-sidebar">Expand Sidebar by Default</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save System Settings
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security">
                {user?.role === 'ceo' || user?.role === 'admin' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage security settings and access controls.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Form {...securityForm}>
                        <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Password Policy</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={securityForm.control}
                                name="passwordLength"
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Minimum Password Length</FormLabel>
                                      <FormDescription>
                                        Minimum characters required
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="6" 
                                        max="20" 
                                        className="w-20" 
                                        {...field}
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={securityForm.control}
                                name="passwordExpiry"
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Password Expiry</FormLabel>
                                      <FormDescription>
                                        Days before passwords expire
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="0" 
                                        className="w-20" 
                                        {...field}
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={securityForm.control}
                              name="sessionTimeout"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Session Timeout</FormLabel>
                                    <FormDescription>
                                      Minutes of inactivity before logout
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="5" 
                                      max="120" 
                                      className="w-20" 
                                      {...field}
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={securityForm.control}
                              name="twoFactorEnabled"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 pt-2">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      id="two-factor-auth"
                                    />
                                  </FormControl>
                                  <FormLabel htmlFor="two-factor-auth">Enable Two-Factor Authentication</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Save Security Settings
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertTitle>Restricted Access</AlertTitle>
                    <AlertDescription>
                      Only CEO and Admin can access security settings.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Data Management */}
              <TabsContent value="data">
                {user?.role === 'ceo' || user?.role === 'admin' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Management</CardTitle>
                      <CardDescription>
                        Manage system data, backups, and exports.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Category Management Section */}
                      <div className="space-y-4 pt-2 pb-8 border-b">
                        <h3 className="text-lg font-medium">Categories</h3>
                        <CategoryManagement />
                      </div>
                      
                      {/* Specialty Management Section */}
                      <div className="space-y-4 pt-2 pb-8 border-b">
                        <h3 className="text-lg font-medium">Specialties</h3>
                        {hasPermission("canManageSpecialties") ? (
                          <SpecialtyManagement />
                        ) : (
                          <Alert variant="destructive">
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertTitle>Restricted Access</AlertTitle>
                            <AlertDescription>
                              You don't have permission to manage specialties.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Backup & Export Settings</h3>
                        <Form {...dataManagementForm}>
                          <form onSubmit={dataManagementForm.handleSubmit(onDataManagementSubmit)} className="space-y-6">
                            <div className="space-y-4 border-b pb-6">
                              <FormField
                                control={dataManagementForm.control}
                                name="autoBackupEnabled"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                        id="auto-backup"
                                      />
                                    </FormControl>
                                    <FormLabel htmlFor="auto-backup">Enable Automatic Backups</FormLabel>
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FormField
                                  control={dataManagementForm.control}
                                  name="backupFrequency"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Backup Frequency (Days)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1" 
                                          max="30" 
                                          {...field}
                                          value={field.value}
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={dataManagementForm.control}
                                  name="backupRetention"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Backup Retention (Days)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1" 
                                          max="365" 
                                          {...field}
                                          value={field.value}
                                          onChange={(e) => field.onChange(e.target.value)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <FormField
                                control={dataManagementForm.control}
                                name="autoExportEnabled"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                        id="auto-export"
                                      />
                                    </FormControl>
                                    <FormLabel htmlFor="auto-export">Enable Automatic Data Exports</FormLabel>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={dataManagementForm.control}
                                name="exportFormat"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Export Format</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a format" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="csv">CSV</SelectItem>
                                        <SelectItem value="xlsx">Excel</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="json">JSON</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-between">
                              <Button type="submit">
                                <Save className="h-4 w-4 mr-2" />
                                Save Data Settings
                              </Button>

                              <div className="space-x-2">
                                <Button type="button" variant="outline">
                                  <FileOutput className="h-4 w-4 mr-2" />
                                  Manual Export
                                </Button>
                                <Button type="button" variant="outline">
                                  Manual Backup
                                </Button>
                              </div>
                            </div>
                          </form>
                        </Form>
                      </div>

                      <Alert variant="destructive" className="mt-6">
                        <AlertTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Danger Zone</AlertTitle>
                        <AlertDescription>
                          These actions are destructive and cannot be undone.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4 border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Reset All Settings</h4>
                            <p className="text-sm text-muted-foreground">
                              Reset all settings to their default values.
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Reset Settings
                          </Button>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div>
                            <h4 className="font-medium">Purge All Data</h4>
                            <p className="text-sm text-muted-foreground">
                              Delete all data from the system permanently.
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Purge Data
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertTitle>Restricted Access</AlertTitle>
                    <AlertDescription>
                      Only CEO and Admin can access data management settings.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}