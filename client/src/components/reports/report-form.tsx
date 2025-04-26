import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from "jspdf";
import Chart from "chart.js/auto";
import 'chartjs-adapter-date-fns';

interface ReportFormProps {
  onGenerate: (data: FormData) => void;
  isLoading?: boolean;
}

const reportSchema = z.object({
  reportType: z.string(),
  dateRange: z.string(),
  customDateStart: z.string().optional(),
  customDateEnd: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeBranding: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
  exportFormat: z.string().default("pdf"),
});

type FormValues = z.infer<typeof reportSchema>;

export function ReportForm({ onGenerate, isLoading = false }: ReportFormProps) {
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Status' },
    { id: 'movement', name: 'Stock Movement' },
    { id: 'expiry', name: 'Expiring Items' },
    { id: 'allocation', name: 'Medical Rep Allocation' }
  ];

  const dateRanges = [
    { id: 'week', name: 'Last 7 Days' },
    { id: 'month', name: 'Last 30 Days' },
    { id: 'quarter', name: 'Last 90 Days' },
    { id: 'year', name: 'Last 12 Months' },
    { id: 'custom', name: 'Custom Range' }
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'inventory',
      dateRange: 'month',
      includeCharts: true,
      includeBranding: true,
      includeRecommendations: true,
      exportFormat: 'pdf',
    },
  });

  const handleDateRangeChange = (value: string) => {
    form.setValue('dateRange', value);
    setShowCustomDateRange(value === 'custom');
  };

  const handleSubmit = (values: FormValues) => {
    // Convert to FormData for the onGenerate callback
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('generatedAt', new Date().toISOString());
    
    onGenerate(formData);

    // Generate the appropriate report format
    if (values.exportFormat === 'pdf') {
      generatePdfReport(values);
    } else if (values.exportFormat === 'excel') {
      generateExcelReport(values);
    } else if (values.exportFormat === 'csv') {
      generateCsvReport(values);
    }
  };

  // Helper function to get mock data based on report type
  const getReportData = (reportType: string) => {
    // This would be replaced with actual data from API calls in production
    switch(reportType) {
      case 'inventory':
        return [
          ["ID", "Name", "Category", "Quantity", "Expiry Date", "Status"],
          ["1", "Sample Medicine", "Samples", "50", "2023-12-31", "Active"],
          ["2", "Promotional Brochure", "Marketing", "200", "2024-06-30", "Active"],
          ["3", "Product Leaflet", "Information", "150", "2024-03-15", "Active"],
          ["4", "Demo Kit", "Samples", "25", "2023-11-30", "Low Stock"],
          ["5", "Conference Materials", "Marketing", "75", "2024-01-31", "Active"]
        ];
      case 'movement':
        return [
          ["ID", "Item", "From", "To", "Quantity", "Date", "Status"],
          ["1", "Sample Medicine", "Warehouse", "Med Rep A", "10", "2023-10-15", "Completed"],
          ["2", "Promotional Brochure", "Marketing", "Sales Team", "50", "2023-10-20", "Completed"],
          ["3", "Product Leaflet", "Warehouse", "Med Rep B", "30", "2023-10-22", "In Transit"],
          ["4", "Demo Kit", "Warehouse", "Sales Manager", "5", "2023-10-25", "Completed"],
          ["5", "Conference Materials", "Marketing", "CEO", "20", "2023-10-27", "Pending"]
        ];
      case 'expiry':
        return [
          ["ID", "Name", "Category", "Quantity", "Expiry Date", "Days Left", "Action Needed"],
          ["1", "Sample Medicine A", "Samples", "15", "2023-11-15", "20", "Urgent Distribution"],
          ["2", "Sample Medicine B", "Samples", "25", "2023-12-05", "40", "Plan Distribution"],
          ["3", "Product Leaflet v1", "Information", "45", "2023-11-30", "35", "Plan Distribution"],
          ["4", "Demo Kit Old Version", "Samples", "10", "2023-11-10", "15", "Urgent Distribution"],
          ["5", "Brochure Summer Campaign", "Marketing", "30", "2023-12-15", "50", "Monitor"]
        ];
      case 'allocation':
        return [
          ["Rep ID", "Name", "Region", "Item", "Quantity", "Allocation Date", "Status"],
          ["101", "Med Rep A", "North", "Sample Medicine", "20", "2023-10-01", "Active"],
          ["102", "Med Rep B", "South", "Sample Medicine", "15", "2023-10-01", "Active"],
          ["103", "Med Rep C", "East", "Product Leaflet", "50", "2023-10-05", "Active"],
          ["104", "Med Rep D", "West", "Demo Kit", "5", "2023-10-10", "Low"],
          ["105", "Med Rep E", "Central", "Conference Materials", "10", "2023-10-15", "Active"]
        ];
      default:
        return [["No Data Available"]];
    }
  };

  const generateCsvReport = (values: FormValues) => {
    const reportData = getReportData(values.reportType);
    const csvContent = reportData.map(row => row.join(",")).join("\n");
    
    // Create download for the CSV
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.href = encodedUri;
    downloadLink.download = `${values.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const generateExcelReport = (values: FormValues) => {
    // For Excel, we'll generate a CSV but with an .xlsx extension
    // In a real implementation, you would use a proper Excel library
    // like SheetJS/xlsx or exceljs, but for this prototype we'll simulate it
    
    const reportData = getReportData(values.reportType);
    
    // Create a "tab-separated values" file which Excel can open
    const tsvContent = reportData.map(row => row.join("\t")).join("\n");
    
    // Create download for the Excel-compatible file
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${values.reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  };

  const generatePdfReport = (values: FormValues) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Add branding
    if (values.includeBranding) {
      doc.setFillColor(59, 130, 246); // Primary color
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('PharmStock', pageWidth / 2, 12, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 10;
    }

    // Report title
    doc.setFontSize(20);
    const reportTitle = `${reportTypes.find(r => r.id === values.reportType)?.name} Report`;
    doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Date range
    doc.setFontSize(12);
    let dateRangeText = `Date Range: ${dateRanges.find(d => d.id === values.dateRange)?.name}`;
    if (values.dateRange === 'custom' && values.customDateStart && values.customDateEnd) {
      dateRangeText = `Date Range: ${values.customDateStart} to ${values.customDateEnd}`;
    }
    doc.text(dateRangeText, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Generated date
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(10);
    doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Content based on report type
    doc.setFontSize(14);
    doc.text('Report Summary', 20, y);
    y += 10;

    doc.setFontSize(12);
    let summaryText = '';
    
    switch(values.reportType) {
      case 'inventory':
        summaryText = 'This report provides an overview of current inventory status, including stock levels by category, expiring items, and overall inventory health.';
        break;
      case 'movement':
        summaryText = 'This report tracks the movement of promotional materials between different roles, showing transfer patterns and allocation efficiency.';
        break;
      case 'expiry':
        summaryText = 'This report highlights items approaching expiry, allowing for proactive management of inventory to reduce waste.';
        break;
      case 'allocation':
        summaryText = 'This report shows how promotional materials are distributed among medical representatives, identifying patterns and potential optimization areas.';
        break;
    }
    
    doc.text(summaryText, 20, y, { maxWidth: pageWidth - 40 });
    y += 20;

    // Add recommendations if enabled
    if (values.includeRecommendations) {
      doc.setFontSize(14);
      doc.text('Recommendations', 20, y);
      y += 10;

      doc.setFontSize(12);
      let recommendationsText = '';
      
      switch(values.reportType) {
        case 'inventory':
          recommendationsText = '1. Consider redistributing underutilized items to locations with higher demand.\n2. Schedule replenishment for items below 20% of optimal inventory level.\n3. Review items with no movement in the last 60 days for potential reallocation.';
          break;
        case 'movement':
          recommendationsText = '1. Optimize transfer processes for high-volume routes.\n2. Investigate delays in material transfers between specific departments.\n3. Implement batch transfers for improved efficiency.';
          break;
        case 'expiry':
          recommendationsText = '1. Prioritize distribution of items expiring within 30 days.\n2. Review purchasing patterns to better align with usage rates.\n3. Consider implementing a first-expiry-first-out (FEFO) stock management policy.';
          break;
        case 'allocation':
          recommendationsText = '1. Balance material allocation based on representative activity levels.\n2. Provide additional materials to high-performing representatives.\n3. Review allocation patterns quarterly to ensure optimal distribution.';
          break;
      }
      
      const splitRecommendations = recommendationsText.split('\n');
      splitRecommendations.forEach(line => {
        doc.text(line, 20, y, { maxWidth: pageWidth - 40 });
        y += 8;
      });
    }

    // Save the PDF
    doc.save(`${values.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reportType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Range</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleDateRangeChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {showCustomDateRange && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customDateStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customDateEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="includeCharts"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="includeCharts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include charts and visualizations
                </label>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="includeBranding"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBranding"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="includeBranding"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include company branding
                </label>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="includeRecommendations"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRecommendations"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="includeRecommendations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include recommendations
                </label>
              </div>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="exportFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Export Format</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            "Generate Report"
          )}
        </Button>
      </form>
    </Form>
  );
}
