import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import CategoryManagement from "@/components/settings/category-management";
import { SpecialtyManagement } from "@/components/settings/specialty-management";
import { RoleActivation } from "@/components/settings/role-activation";
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
  Users,
  Bell,
  Shield,
  Database,
  User,
  FileText,
  Info,
  Upload
} from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  region: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  stockAlerts: z.boolean().default(true),
  expiryAlerts: z.boolean().default(true),
  movementAlerts: z.boolean().default(false),
  dailyReports: z.boolean().default(false),
});

const systemFormSchema = z.object({
  lowStockThreshold: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Must be a number",
  }),
  expiryAlertDays: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Must be a number",
  }),
  defaultCategory: z.string(),
  companyName: z.string(),
  companyLogo: z.any().optional(),
  appName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type SystemFormValues = z.infer<typeof systemFormSchema>;

export default function SettingsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // State variables for data settings section
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [retentionPeriod, setRetentionPeriod] = useState("30");
  const [compressBackups, setCompressBackups] = useState(true);
  const [encryptBackups, setEncryptBackups] = useState(false);
  const [dataSettings, setDataSettings] = useState<any>(null);

  // Load saved data settings from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('data_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setAutoBackupEnabled(parsedSettings.autoBackupEnabled);
          setBackupFrequency(parsedSettings.backupFrequency);
          setRetentionPeriod(parsedSettings.retentionPeriod.toString());
          setCompressBackups(parsedSettings.compressBackups);
          setEncryptBackups(parsedSettings.encryptBackups || false);
          setDataSettings(parsedSettings);
        } catch (error) {
          console.error('Error parsing saved data settings:', error);
        }
      }
    }
  }, []);

  // Profile form - load stored values from localStorage if available
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      region: user?.region || "",
    },
  });

  // Load saved profile settings from localStorage if available
  useEffect(() => {
    const savedProfileSettings = localStorage.getItem('profileSettings');
    if (savedProfileSettings) {
      try {
        const parsedSettings = JSON.parse(savedProfileSettings);
        profileForm.reset(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved profile settings:', error);
      }
    }
  }, [profileForm]);

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: (() => {
      // Try to load saved settings from localStorage
      if (typeof window !== 'undefined' && user) {
        const savedSettings = localStorage.getItem(`notifications_${user.id}`);
        if (savedSettings) {
          try {
            return JSON.parse(savedSettings);
          } catch (e) {
            console.error('Error parsing saved notification settings', e);
          }
        }
      }
      // Default values if nothing saved
      return {
        emailNotifications: true,
        stockAlerts: true,
        expiryAlerts: true,
        movementAlerts: false,
        dailyReports: false,
      };
    })(),
  });

  // System settings form
  const systemForm = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: (() => {
      // Try to load saved settings from localStorage
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('system_settings');
        if (savedSettings) {
          try {
            return JSON.parse(savedSettings);
          } catch (e) {
            console.error('Error parsing saved system settings', e);
          }
        }
      }
      // Default values if nothing saved
      return {
        lowStockThreshold: "10",
        expiryAlertDays: "30",
        defaultCategory: "1",
        companyName: "PharmStock",
        appName: "PharmStock Pro",
      };
    })(),
  });

  // Handle form submissions
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      if (!user) return;

      // Send updated profile data to the server
      await apiRequest("PATCH", `/api/users/${user.id}`, {
        name: data.name,
        region: data.region
      });

      // Save profile settings to localStorage for persistence
      localStorage.setItem('profileSettings', JSON.stringify(data));

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });

      // Update the local cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const onNotificationSubmit = async (data: NotificationFormValues) => {
    try {
      if (!user) return;

      // In a real app, we would save to backend storage
      // For now, store settings in localStorage for persistence
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(data));

      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const onSystemSubmit = async (data: SystemFormValues) => {
    try {
      // Create a copy of the data to modify before storage
      const storageData = { ...data };

      // Handle company logo File object by creating a URL
      if (data.companyLogo instanceof File) {
        // Create blob URL for the company logo image
        const companyLogoUrl = URL.createObjectURL(data.companyLogo);

        // Add a special property for the URL that's not in the form data structure
        // @ts-ignore - We're adding a property not in the type
        storageData.companyLogoUrl = companyLogoUrl;
      }

      // In a real app, we would save to backend storage
      // For now, store settings in localStorage for persistence
      localStorage.setItem('system_settings', JSON.stringify(storageData));

      toast({
        title: "System settings updated",
        description: "System settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update system settings",
        variant: "destructive",
      });
    }
  };

  // Security settings schema
  const securityFormSchema = z.object({
    passwordLength: z.string().or(z.number()).transform(val => Number(val)),
    passwordExpiry: z.string().or(z.number()).transform(val => Number(val)),
    requireSpecialChars: z.boolean().default(false),
    requireUppercase: z.boolean().default(true),
    requireNumbers: z.boolean().default(true),
    twoFactorEnabled: z.boolean().default(false),
    sessionTimeout: z.string().or(z.number()).transform(val => Number(val)),
  });

  type SecurityFormValues = z.infer<typeof securityFormSchema>;

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: (() => {
      // Try to load saved settings from localStorage
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('security_settings');
        if (savedSettings) {
          try {
            return JSON.parse(savedSettings);
          } catch (e) {
            console.error('Error parsing saved security settings', e);
          }
        }
      }
      // Default values if nothing saved
      return {
        passwordLength: 8,
        passwordExpiry: 90,
        requireSpecialChars: false,
        requireUppercase: true,
        requireNumbers: true,
        twoFactorEnabled: false,
        sessionTimeout: 30,
      };
    })(),
  });

  // Security form submit handler
  const onSecuritySubmit = async (data: SecurityFormValues) => {
    try {
      localStorage.setItem('security_settings', JSON.stringify(data));

      toast({
        title: "Security settings updated",
        description: "Your security settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update security settings",
        variant: "destructive",
      });
    }
  };

  // Data management settings schema
  const dataManagementSchema = z.object({
    autoBackupEnabled: z.boolean().default(false),
    backupFrequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
    retentionPeriod: z.string().or(z.number()).transform(val => Number(val)),
    exportFormat: z.enum(["json", "csv", "excel"]).default("json"),
    compressionEnabled: z.boolean().default(true),
  });

  type DataManagementValues = z.infer<typeof dataManagementSchema>;

  // Data management form
  const dataManagementForm = useForm<DataManagementValues>({
    resolver: zodResolver(dataManagementSchema),
    defaultValues: {
      autoBackupEnabled: false,
      backupFrequency: "weekly",
      retentionPeriod: 30,
      exportFormat: "json",
      compressionEnabled: true,
    },
  });

  // Load saved data management settings from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('data_management_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          dataManagementForm.reset(parsedSettings);
        } catch (error) {
          console.error('Error parsing saved data management settings:', error);
        }
      }
    }
  }, [dataManagementForm]);

  // Data management form submit handler
  const onDataManagementSubmit = async (data: DataManagementValues) => {
    try {
      localStorage.setItem('data_management_settings', JSON.stringify(data));

      toast({
        title: "Data management settings updated",
        description: "Your data management settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update data management settings",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <Tabs 
        defaultValue="profile" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          {hasPermission("canAccessSettings") && (
            <>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
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
                          <Input placeholder="Your username" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Username cannot be changed once account is created.
                        </FormDescription>
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
                        <FormControl>
                          <Input placeholder="Your region" {...field} />
                        </FormControl>
                        <FormDescription>
                          This information helps with stock allocation and reporting.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                Configure how you want to receive notifications and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive system notifications via email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="stockAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Low Stock Alerts</FormLabel>
                          <FormDescription>
                            Get notified when stock items are running low
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="expiryAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Expiry Alerts</FormLabel>
                          <FormDescription>
                            Get notified when items are about to expire
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="movementAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Stock Movement Alerts</FormLabel>
                          <FormDescription>
                            Get notified when stock is transferred
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="dailyReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Daily Reports</FormLabel>
                          <FormDescription>
                            Receive daily summary reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Activation Settings - Only for CEO/Admin */}
        {hasPermission("canAccessSettings") && (
          <>
            <TabsContent value="roles">
              <RoleActivation />
            </TabsContent>

            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemForm}>
                    <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                      <FormField
                        control={systemForm.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Low Stock Threshold</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Items with quantity below this value will be flagged as low stock
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="expiryAlertDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Alert Days</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of days before expiry to display warnings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="defaultCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select default category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Brochures</SelectItem>
                                <SelectItem value="2">Samples</SelectItem>
                                <SelectItem value="3">Gifts</SelectItem>
                                <SelectItem value="4">Banners</SelectItem>
                                <SelectItem value="5">Digital Media</SelectItem>
                                <SelectItem value="6">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Default category for new stock items
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="appName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              The name shown in the sidebar and throughout the app
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Used in reports and branding
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="companyLogo"
                        render={({ field }) => {
                          // State to track the preview URL
                          const [previewUrl, setPreviewUrl] = useState<string | null>(
                            field.value instanceof File 
                              ? URL.createObjectURL(field.value)
                              : typeof field.value === 'string' 
                                ? field.value
                                : null
                          );

                          // File input ref to allow resetting
                          const fileInputRef = useRef<HTMLInputElement>(null);

                          // Handle file selection
                          const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Revoke previous object URL to avoid memory leaks
                              if (previewUrl && previewUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(previewUrl);
                              }

                              // Create a preview URL for the selected file
                              const objectUrl = URL.createObjectURL(file);
                              setPreviewUrl(objectUrl);

                              // Update the form field
                              field.onChange(file);
                            }
                          };

                          // Reset the file input and preview
                          const handleReset = () => {
                            // Revoke object URL if exists
                            if (previewUrl && previewUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(previewUrl);
                            }

                            setPreviewUrl(null);
                            field.onChange(null);

                            // Reset the file input
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          };

                          // Clean up on unmount
                          useEffect(() => {
                            return () => {
                              if (previewUrl && previewUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(previewUrl);
                              }
                            };
                          }, [previewUrl]);

                          return (
                            <FormItem>
                              <FormLabel>Company Logo</FormLabel>
                              <div className="space-y-4">
                                {previewUrl && (
                                  <div className="mt-2">
                                    <div className="w-32 h-32 rounded border overflow-hidden">
                                      <img 
                                        src={previewUrl} 
                                        alt="Company logo preview" 
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={handleReset}
                                      className="mt-2"
                                    >
                                      Remove Logo
                                    </Button>
                                  </div>
                                )}

                                <FormControl>
                                  <div className="flex items-center">
                                    <Input 
                                      ref={fileInputRef}
                                      type="file" 
                                      accept="image/*" 
                                      onChange={handleFileChange}
                                      className={previewUrl ? "hidden" : ""}
                                    />
                                    {!previewUrl && (
                                      <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="ml-2"
                                      >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Logo
                                      </Button>
                                    )}
                                  </div>
                                </FormControl>

                                <FormDescription>
                                  Used in reports and branding. Max size 2MB.
                                </FormDescription>
                                <FormMessage />
                              </div>
                            </FormItem>
                          );
                        }}
                      />

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
                          name="requireSpecialChars"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 pt-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="require-special-chars"
                                />
                              </FormControl>
                              <FormLabel htmlFor="require-special-chars">Require special characters</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="requireUppercase"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="require-uppercase"
                                />
                              </FormControl>
                              <FormLabel htmlFor="require-uppercase">Require uppercase letters</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="requireNumbers"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="require-numbers"
                                />
                              </FormControl>
                              <FormLabel htmlFor="require-numbers">Require numbers</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Session Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

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
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data">
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
                    {(user?.role === 'ceo' || user?.role === 'admin') ? (
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
                              <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Automatic Backups</FormLabel>
                                  <FormDescription>
                                    Enable scheduled automatic backups
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {dataManagementForm.watch("autoBackupEnabled") && (
                            <>
                              <FormField
                                control={dataManagementForm.control}
                                name="backupFrequency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Backup Frequency</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      How often backups should be created
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={dataManagementForm.control}
                                name="retentionPeriod"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Retention Period (Days)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        {...field}
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Number of days to keep backups before deletion
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-md font-medium">Export Settings</h4>

                          <FormField
                            control={dataManagementForm.control}
                            name="exportFormat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Export Format</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="excel">Excel</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Default format used when exporting data
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={dataManagementForm.control}
                            name="compressionEnabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Enable Compression</FormLabel>
                                  <FormDescription>
                                    Compress exported files to reduce size
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Data Settings
                        </Button>
                      </form>
                    </Form>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-medium">Backup & Export Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Manual Backup</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create a backup of all system data.
                          </p>
                          <div className="flex flex-col space-y-2">
                            <Button onClick={() => {
                              // Generate sample backup data
                              const backupData = {
                                timestamp: new Date().toISOString(),
                                version: "1.0",
                                data: {
                                  users: [],
                                  stockItems: [],
                                  categories: [],
                                  movements: [],
                                  settings: {}
                                }
                              };

                              // Convert to JSON and create download
                              const dataStr = JSON.stringify(backupData, null, 2);
                              const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

                              // Create download link
                              const downloadLink = document.createElement("a");
                              downloadLink.setAttribute("href", dataUri);
                              downloadLink.setAttribute("download", `pharmstock-backup-${new Date().toISOString().split('T')[0]}.json`);
                              document.body.appendChild(downloadLink);
                              downloadLink.click();
                              document.body.removeChild(downloadLink);

                              toast({
                                title: "Backup created",
                                description: "System backup has been created and downloaded.",
                              });
                            }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Backup
                            </Button>

                            {/* File upload button for restoring backups */}
                            <div className="mt-2">
                              <label htmlFor="restore-backup-file" className="cursor-pointer">
                                <div className="flex items-center justify-center px-4 py-2 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Restore Backup
                                </div>
                              </label>
                              <input
                                id="restore-backup-file"
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      const content = event.target?.result;
                                      if (typeof content === 'string') {
                                        // Parse backup data
                                        const backupData = JSON.parse(content);

                                        // Validate backup format
                                        if (!backupData.version || !backupData.timestamp || !backupData.data) {
                                          throw new Error("Invalid backup file format");
                                        }

                                        // Here you would actually restore the data
                                        // For now, just show success
                                        toast({
                                          title: "Backup restored",
                                          description: `Backup from ${new Date(backupData.timestamp).toLocaleString()} has been restored.`,
                                          variant: "default",
                                        });
                                      }
                                    } catch (err) {
                                      toast({
                                        title: "Error restoring backup",
                                        description: err instanceof Error ? err.message : "Invalid backup file",
                                        variant: "destructive",
                                      });
                                    }

                                    // Reset file input
                                    e.target.value = '';
                                  };
                                  reader.readAsText(file);
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Export Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Export all system data as CSV.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Create mock data for export example
                                // In a real app, we would fetch actual data from the backend
                                const mockStockItems = [
                                  ["ID", "Name", "Category", "Quantity", "Expiry Date", "Status"],
                                  ["1", "Sample Medicine", "Samples", "50", "2023-12-31", "Active"],
                                  ["2", "Promotional Brochure", "Marketing", "200", "2024-06-30", "Active"]
                                ];

                                // Convert array to CSV string
                                const csvContent = mockStockItems.map(row => row.join(",")).join("\n");

                                // Create download for the CSV
                                const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
                                const downloadLink = document.createElement("a");
                                downloadLink.href = encodedUri;
                                downloadLink.download = `pharmstock-export-${new Date().toISOString().split('T')[0]}.csv`;
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);

                                toast({
                                  title: "Data exported",
                                  description: "All system data has been exported as CSV and downloaded.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Export failed",
                                  description: error instanceof Error ? error.message : "Failed to export data",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export All Data
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <h3 className="text-lg font-medium">Automated Backups</h3>
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-backup" checked={autoBackupEnabled} onCheckedChange={setAutoBackupEnabled} />
                      <Label htmlFor="auto-backup">Enable automated backups</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Backup Frequency</Label>
                          <p className="text-sm text-muted-foreground">
                            How often to create backups
                          </p>
                        </div>
                        <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Retention Period</Label>
                          <p className="text-sm text-muted-foreground">
                            How long to keep backups
                          </p>
                        </div>
                        <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={compressBackups} onCheckedChange={setCompressBackups} id="compress-backups" />
                        <Label htmlFor="compress-backups">Compress backups</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={encryptBackups} onCheckedChange={setEncryptBackups} id="encrypt-backups" />
                        <Label htmlFor="encrypt-backups">Encrypt backups</Label>
                      </div>
                    </div>
                  </div>

                  <Alert variant="destructive" className="mt-6">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertTitle>Danger Zone</AlertTitle>
                    <AlertDescription>
                      These actions are destructive and cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-red-600">Clear All Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete all system data.
                        </p>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            // Show confirmation dialog
                            if (window.confirm("WARNING: This will permanently delete all data in the system. This action cannot be undone. Are you sure you want to continue?")) {
                              try {
                                // Here we would call an API to clear all data
                                // For now we'll just invalidate any queries to refresh the UI
                                queryClient.invalidateQueries();

                                toast({
                                  title: "Action completed",
                                  description: "All system data has been cleared.",
                                  variant: "destructive"
                                });
                              } catch (error) {
                                toast({
                                  title: "Action failed",
                                  description: error instanceof Error ? error.message : "Failed to clear data",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          Clear All Data
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-red-600">Reset System</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Reset the system to factory defaults.
                        </p>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            // Show confirmation dialog
                            if (window.confirm("WARNING: This will reset all system settings to factory defaults. All customized settings will be lost. Are you sure you want to continue?")) {
                              try {
                                // Clear all local storage settings
                                localStorage.removeItem('security_settings');
                                localStorage.removeItem('data_settings');
                                localStorage.removeItem('system_settings');

                                // Here we would call an API to reset the system
                                // For now we'll just invalidate any queries to refresh the UI
                                queryClient.invalidateQueries();

                                toast({
                                  title: "System reset",
                                  description: "The system has been reset to factory defaults.",
                                  variant: "destructive"
                                });

                                // Reload the page to reflect reset state
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1500);
                              } catch (error) {
                                toast({
                                  title: "Reset failed",
                                  description: error instanceof Error ? error.message : "Failed to reset system",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          Reset System
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button
                    onClick={async () => {
                      try {
                        // Get values from state variables
                        const settings = {
                          autoBackupEnabled: autoBackupEnabled,
                          backupFrequency: backupFrequency,
                          retentionPeriod: Number(retentionPeriod),
                          compressBackups: compressBackups,
                          encryptBackups: encryptBackups
                        };

                        // In a real app, we would save to backend storage
                        // For now, store settings in localStorage for persistence
                        localStorage.setItem('data_settings', JSON.stringify(settings));

                        // Force the component to update after saving
                        setDataSettings(settings);

                        toast({
                          title: "Settings saved",
                          description: "Your data management settings have been saved successfully.",
                        });
                      } catch (error) {
                        toast({
                          title: "Update failed",
                          description: error instanceof Error ? error.message : "Failed to update data settings",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Data Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </MainLayout>
  );
}