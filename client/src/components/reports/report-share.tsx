import { useState } from "react";
import { 
  Copy,
  Mail,
  Share2,
  Check,
  MessageSquare,
  Link as LinkIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ReportShareProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportData: any;
}

export function ReportShare({ isOpen, onClose, reportType, reportData }: ReportShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  
  // Generate a shareable link for the report
  const generateShareableLink = () => {
    // In a real app, this would generate a unique URL with the report ID
    // For this prototype, we'll simulate it by encoding the report type in the URL
    const baseUrl = window.location.origin;
    const encodedData = btoa(JSON.stringify({ type: reportType, timestamp: new Date().toISOString() }));
    return `${baseUrl}/shared-report/${encodedData}`;
  };
  
  const shareableLink = generateShareableLink();
  
  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The shareable link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };
  
  // Share via Web Share API (native sharing options)
  const shareNatively = async () => {
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reportTitle,
          text: `Check out this ${reportTitle} from PharmStock`,
          url: shareableLink,
        });
        toast({
          title: "Shared successfully",
          description: "Your report has been shared.",
        });
      } catch (error) {
        // User likely cancelled the share operation
        console.log("Sharing failed", error);
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support native sharing.",
        variant: "destructive",
      });
    }
  };
  
  // Simulate email sharing (without SendGrid)
  const shareViaEmail = () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a mailto URL
    const subject = encodeURIComponent(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report from PharmStock`);
    const body = encodeURIComponent(`I'd like to share this report with you: ${shareableLink}\n\n${message}`);
    const mailtoUrl = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    
    // Open the default email client
    window.open(mailtoUrl, '_blank');
    
    toast({
      title: "Email client opened",
      description: "Your default email client should have opened with the report details.",
    });
    
    // Reset fields
    setRecipientEmail("");
    setMessage("");
  };
  
  // Simulate messaging platform sharing
  const shareViaMessaging = () => {
    // For messaging platforms like WhatsApp, Telegram, etc.
    // These typically use URL schemes
    const text = encodeURIComponent(`Check out this ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report from PharmStock: ${shareableLink}\n\n${message}`);
    
    // For WhatsApp
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening messaging app",
      description: "WhatsApp should open with your report details.",
    });
    
    // Reset message field
    setMessage("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</DialogTitle>
          <DialogDescription>
            Choose how you want to share this report with others.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="messaging">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messaging
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="p-4 border rounded-md">
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-link">Shareable Link</Label>
                <div className="flex mt-1.5">
                  <Input 
                    id="share-link" 
                    readOnly 
                    value={shareableLink} 
                    className="flex-1 text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="ml-2" 
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {navigator.share && (
                <div className="pt-4">
                  <Button onClick={shareNatively} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share via Device
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="p-4 border rounded-md">
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input 
                  id="recipient-email" 
                  type="email" 
                  placeholder="email@example.com" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="email-message">Message (Optional)</Label>
                <textarea 
                  id="email-message" 
                  rows={3} 
                  placeholder="Add a personal message..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-1.5 p-2 border rounded-md resize-none"
                />
              </div>
              
              <Button onClick={shareViaEmail} className="w-full mt-2">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="messaging" className="p-4 border rounded-md">
            <div className="space-y-4">
              <div>
                <Label htmlFor="message-text">Message (Optional)</Label>
                <textarea 
                  id="message-text" 
                  rows={3} 
                  placeholder="Add a message to include with the report link..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-1.5 p-2 border rounded-md resize-none"
                />
              </div>
              
              <Button onClick={shareViaMessaging} className="w-full mt-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}