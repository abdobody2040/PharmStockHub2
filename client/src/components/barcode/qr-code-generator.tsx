import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  value: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ value, title = "Item QR Code", isOpen, onClose }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && value) {
      setIsGenerating(true);
      QRCode.toDataURL(value, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrDataUrl(url);
          setIsGenerating(false);
        })
        .catch((err) => {
          console.error("QR code generation error:", err);
          toast({
            title: "QR Code Generation Failed",
            description: "There was an error generating the QR code.",
            variant: "destructive",
          });
          setIsGenerating(false);
        });
    }
  }, [isOpen, value, toast]);

  const downloadQRCode = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `qrcode-${value.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been downloaded successfully.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Scan this QR code to identify the item
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {isGenerating ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            <div className="bg-white p-4 rounded-md shadow-sm">
              <img 
                src={qrDataUrl} 
                alt="QR Code" 
                className="w-full h-auto" 
              />
              <div className="mt-2 text-center text-sm text-muted-foreground break-all">
                {value}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to generate QR code</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          {qrDataUrl && (
            <Button onClick={downloadQRCode}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}