import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  ArrowRight, 
  Package, 
  FileText, 
  Users, 
  BarChart3,
  Play,
  BookOpen,
  Target,
  Lightbulb
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: any;
  completed?: boolean;
  roleSpecific?: string[];
}

export function PersonalizedOnboarding() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`onboarding_${user?.id}`);
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, [user?.id]);

  const markStepCompleted = (stepId: string) => {
    const updated = [...completedSteps, stepId];
    setCompletedSteps(updated);
    localStorage.setItem(`onboarding_${user?.id}`, JSON.stringify(updated));
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(`onboarding_dismissed_${user?.id}`, 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding_dismissed_${user?.id}`);
    if (dismissed) {
      setShowOnboarding(false);
    }
  }, [user?.id]);

  const getOnboardingSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        id: "welcome",
        title: "Welcome to the System",
        description: "Get familiar with your dashboard and key features",
        action: "Explore Dashboard",
        href: "/",
        icon: BookOpen,
        roleSpecific: ["all"]
      }
    ];

    if (!user) return baseSteps;

    switch (user.role) {
      case "productManager":
        return [
          ...baseSteps,
          {
            id: "create_request",
            title: "Create Your First Request",
            description: "Learn how to request inventory items for your projects",
            action: "Create Request",
            href: "/requests",
            icon: FileText,
            roleSpecific: ["productManager"]
          },
          {
            id: "track_requests",
            title: "Track Request Status",
            description: "Monitor the approval status of your requests",
            action: "View Requests",
            href: "/requests",
            icon: Target,
            roleSpecific: ["productManager"]
          }
        ];

      case "stockKeeper":
        return [
          ...baseSteps,
          {
            id: "manage_inventory",
            title: "Manage Inventory Items",
            description: "Add, edit, and organize your inventory",
            action: "Manage Inventory",
            href: "/inventory",
            icon: Package,
            roleSpecific: ["stockKeeper"]
          },
          {
            id: "approve_requests",
            title: "Review Pending Requests",
            description: "Approve or deny incoming inventory requests",
            action: "Review Requests",
            href: "/requests",
            icon: FileText,
            roleSpecific: ["stockKeeper"]
          }
        ];

      default:
        return baseSteps;
    }
  };

  const steps = getOnboardingSteps();
  const activeSteps = steps.filter(step => 
    step.roleSpecific?.includes("all") || step.roleSpecific?.includes(user?.role || "")
  );
  
  const progress = (completedSteps.length / activeSteps.length) * 100;
  const isCompleted = completedSteps.length === activeSteps.length;

  if (!showOnboarding || !user || isCompleted) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Welcome, {user.name}!
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Let's get you started with the inventory system.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={dismissOnboarding}>
            Dismiss
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Setup Progress</span>
            <span className="text-muted-foreground">
              {completedSteps.length} of {activeSteps.length} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {activeSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep && !isCompleted;
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                  isCompleted 
                    ? "bg-green-50 border-green-200" 
                    : isCurrent 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/50 border-muted"
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isCompleted 
                    ? "bg-green-100 text-green-600" 
                    : isCurrent 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <IconComponent className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className={`font-medium ${
                    isCompleted ? "text-green-800" : "text-foreground"
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Complete
                    </Badge>
                  ) : (
                    <Link href={step.href}>
                      <Button
                        size="sm"
                        variant={isCurrent ? "default" : "outline"}
                        className="flex items-center gap-2"
                        onClick={() => {
                          if (!isCompleted) {
                            markStepCompleted(step.id);
                            setCurrentStep(index + 1);
                          }
                        }}
                      >
                        {step.action}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}