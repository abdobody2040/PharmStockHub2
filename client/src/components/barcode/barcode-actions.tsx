import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "./barcode-scanner";
import { QRCodeGenerator } from "./qr-code-generator";
import { QrCode, ScanLine } from "lucide-react";

interface BarcodeActionsProps {
  onScan?: (barcodeData: string) => void;
  value?: string;
  showScan?: boolean;
  showGenerate?: boolean;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
}

export function BarcodeActions({
  onScan,
  value = "",
  showScan = true,
  showGenerate = true,
  buttonVariant = "outline",
  buttonSize = "default",
}: BarcodeActionsProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const handleScan = (data: string) => {
    if (onScan) {
      onScan(data);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {showScan && (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            onClick={() => setIsScannerOpen(true)}
            aria-label="Scan Barcode"
            className={buttonSize === "icon" ? "" : "flex gap-2"}
          >
            <ScanLine className="h-4 w-4" />
            {buttonSize !== "icon" && "Scan"}
          </Button>
        )}
        
        {showGenerate && value && (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            onClick={() => setIsGeneratorOpen(true)}
            aria-label="Generate QR Code"
            className={buttonSize === "icon" ? "" : "flex gap-2"}
          >
            <QrCode className="h-4 w-4" />
            {buttonSize !== "icon" && "QR Code"}
          </Button>
        )}
      </div>

      {showScan && (
        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleScan}
        />
      )}

      {showGenerate && value && (
        <QRCodeGenerator
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          value={value}
        />
      )}
    </>
  );
}