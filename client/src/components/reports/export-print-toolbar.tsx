import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  FileImage,
  Calendar,
  Filter
} from "lucide-react";
import jsPDF from "jspdf";

interface ExportPrintToolbarProps {
  data: Record<string, any>[];
  filename?: string;
  reportType?: string;
  columns?: { key: string; label: string; }[];
  onCustomExport?: (format: string, data: Record<string, any>[]) => void;
}

export function ExportPrintToolbar({ 
  data, 
  filename = "report", 
  reportType = "General Report",
  columns = [],
  onCustomExport 
}: ExportPrintToolbarProps) {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const formatData = (items: Record<string, any>[]) => {
    if (columns.length === 0) {
      return items;
    }
    
    return items.map(item => {
      const formatted: Record<string, any> = {};
      columns.forEach(col => {
        formatted[col.label] = item[col.key] || "-";
      });
      return formatted;
    });
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(reportType, margin, 30);
      
      // Date
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 40);
      pdf.text(`Total Records: ${data.length}`, margin, 50);
      
      // Table headers
      let yPosition = 70;
      const columnWidth = (pageWidth - 2 * margin) / Math.max(columns.length, 4);
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      
      if (columns.length > 0) {
        columns.forEach((col, index) => {
          pdf.text(col.label, margin + (index * columnWidth), yPosition);
        });
      } else {
        // Default columns for items
        const defaultCols = ['Name', 'Quantity', 'Category', 'Status'];
        defaultCols.forEach((col, index) => {
          pdf.text(col, margin + (index * columnWidth), yPosition);
        });
      }
      
      yPosition += 10;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Table data
      pdf.setFont(undefined, 'normal');
      const formattedData = formatData(data);
      
      formattedData.slice(0, 30).forEach((item, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 30;
        }
        
        if (columns.length > 0) {
          columns.forEach((col, colIndex) => {
            const text = String(item[col.label] || "-").substring(0, 20);
            pdf.text(text, margin + (colIndex * columnWidth), yPosition);
          });
        } else {
          // Default item data
          pdf.text(String(item.name || "-").substring(0, 15), margin, yPosition);
          pdf.text(String(item.quantity || "-"), margin + columnWidth, yPosition);
          pdf.text(String(item.category || "-").substring(0, 15), margin + (2 * columnWidth), yPosition);
          pdf.text(String(item.status || "Active"), margin + (3 * columnWidth), yPosition);
        }
        
        yPosition += 8;
      });
      
      if (formattedData.length > 30) {
        yPosition += 10;
        pdf.text(`... and ${formattedData.length - 30} more records`, margin, yPosition);
      }
      
      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const formattedData = formatData(data);
      
      let csvContent = "";
      
      // Headers
      if (columns.length > 0) {
        csvContent += columns.map(col => col.label).join(",") + "\n";
      } else {
        csvContent += "Name,Quantity,Category,Created,Notes\n";
      }
      
      // Data
      formattedData.forEach(item => {
        if (columns.length > 0) {
          const row = columns.map(col => {
            const value = item[col.label] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(",");
          csvContent += row + "\n";
        } else {
          const row = [
            `"${String(item.name || "").replace(/"/g, '""')}"`,
            `"${String(item.quantity || "").replace(/"/g, '""')}"`,
            `"${String(item.category || "").replace(/"/g, '""')}"`,
            `"${String(item.createdAt || "").replace(/"/g, '""')}"`,
            `"${String(item.notes || "").replace(/"/g, '""')}"`
          ].join(",");
          csvContent += row + "\n";
        }
      });
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const printReport = () => {
    const formattedData = formatData(data);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .meta { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { margin-top: 20px; font-size: 12px; color: #666; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${reportType}</div>
            <div class="meta">Generated: ${new Date().toLocaleDateString()} | Total Records: ${data.length}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.length > 0 
                  ? columns.map(col => `<th>${col.label}</th>`).join('') 
                  : '<th>Name</th><th>Quantity</th><th>Category</th><th>Status</th>'
                }
              </tr>
            </thead>
            <tbody>
              ${formattedData.map(item => `
                <tr>
                  ${columns.length > 0 
                    ? columns.map(col => `<td>${item[col.label] || "-"}</td>`).join('') 
                    : `<td>${item.name || "-"}</td><td>${item.quantity || "-"}</td><td>${item.category || "-"}</td><td>${item.status || "Active"}</td>`
                  }
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            Report generated from Pharmaceutical Inventory Management System
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const handleExport = () => {
    if (onCustomExport) {
      onCustomExport(exportFormat, data);
      return;
    }

    switch (exportFormat) {
      case "pdf":
        exportToPDF();
        break;
      case "csv":
        exportToCSV();
        break;
      case "print":
        printReport();
        break;
      default:
        exportToPDF();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" />
          Export & Print Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Format:</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="print">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting || data.length === 0}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {data.length} Records
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {data.length} records
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {data.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            No data available for export
          </p>
        )}
      </CardContent>
    </Card>
  );
}