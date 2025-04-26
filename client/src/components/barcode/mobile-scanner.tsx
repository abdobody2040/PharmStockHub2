import { useState, useEffect } from "react";
import { useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MobileScannerProps {
  onScan: (data: string) => void;
}

export function MobileScanner({ onScan }: MobileScannerProps) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const { toast } = useToast();

  const {
    ref,
    torch: { on: turnOnTorch, off: turnOffTorch, isAvailable: torchAvailable },
  } = useZxing({
    onDecodeResult(result) {
      const scannedValue = result.getText();
      onScan(scannedValue);
      toast({
        title: "Barcode scanned successfully",
        description: `Scanned value: ${scannedValue}`,
      });
    },
    timeBetweenDecodingAttempts: 300,
    constraints: {
      video: {
        facingMode: "environment",
      },
    },
  });

  useEffect(() => {
    // Check camera permissions
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setPermissionGranted(true);
      })
      .catch((err) => {
        console.error("Camera permission error:", err);
        setPermissionGranted(false);
        toast({
          title: "Camera permission denied",
          description: "Please allow camera access to scan barcodes",
          variant: "destructive",
        });
      });
  }, [toast]);

  const toggleTorch = async () => {
    if (isTorchOn) {
      await turnOffTorch();
      setIsTorchOn(false);
    } else {
      await turnOnTorch();
      setIsTorchOn(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {permissionGranted === false && (
        <div className="p-4 text-center">
          <p className="text-red-500">Camera access is required to scan barcodes</p>
        </div>
      )}
      
      {permissionGranted === null && (
        <div className="p-10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {permissionGranted === true && (
        <div className="relative">
          <div className="w-full max-w-sm aspect-[4/3] bg-muted rounded-md overflow-hidden relative">
            <video 
              ref={ref as React.RefObject<HTMLVideoElement>} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-primary/50 pointer-events-none"></div>
          </div>
          
          {torchAvailable && (
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={toggleTorch}
                className="rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}