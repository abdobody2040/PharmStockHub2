
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Calendar, DollarSign, QrCode } from 'lucide-react';
import { StockItem } from '@shared/schema';
import { formatDate } from '@/lib/utils';

interface MobileInventoryCardProps {
  item: StockItem;
  availableQuantity?: number;
  onTransfer?: () => void;
  onScan?: () => void;
}

export function MobileInventoryCard({ 
  item, 
  availableQuantity, 
  onTransfer, 
  onScan 
}: MobileInventoryCardProps) {
  const displayQuantity = availableQuantity ?? item.quantity;
  const isLowStock = displayQuantity <= 10;
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Package className="h-4 w-4 text-gray-500" />
              <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                {displayQuantity} units
              </span>
              {isLowStock && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {onScan && (
              <Button size="sm" variant="outline" onClick={onScan}>
                <QrCode className="h-4 w-4" />
              </Button>
            )}
            {onTransfer && (
              <Button size="sm" onClick={onTransfer}>
                Transfer
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          {item.price && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>${(item.price / 100).toFixed(2)}</span>
            </div>
          )}
          
          {item.expiry && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Expires: {formatDate(item.expiry)}</span>
            </div>
          )}
          
          {item.uniqueNumber && (
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              #{item.uniqueNumber}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
