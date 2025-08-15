
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ForecastData {
  itemId: number;
  itemName: string;
  currentStock: number;
  predictedStock: number[];
  reorderPoint: number;
  suggestedOrderQuantity: number;
  daysUntilStockout: number;
}

export function InventoryForecasting() {
  const { data: forecastData = [] } = useQuery<ForecastData[]>({
    queryKey: ['/api/analytics/forecast'],
  });

  const criticalItems = forecastData.filter(item => item.daysUntilStockout <= 7);
  const lowStockItems = forecastData.filter(item => item.currentStock <= item.reorderPoint);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inventory Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
              <p className="text-sm text-red-700">Critical Items (≤7 days)</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <TrendingDown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-sm text-yellow-700">Below Reorder Point</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {forecastData.reduce((sum, item) => sum + item.suggestedOrderQuantity, 0)}
              </div>
              <p className="text-sm text-green-700">Suggested Order Quantity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {criticalItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Critical Items Requiring Immediate Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalItems.map(item => (
                <div key={item.itemId} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.itemName}</h4>
                    <p className="text-sm text-gray-600">
                      Current: {item.currentStock} | Days until stockout: {item.daysUntilStockout}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">Order: {item.suggestedOrderQuantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
