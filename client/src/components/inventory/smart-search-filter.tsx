import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar, Package, AlertTriangle } from "lucide-react";
import { StockItem, Category, Specialty } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface SmartSearchFilterProps {
  items: StockItem[];
  onFilteredItems: (items: StockItem[]) => void;
}

interface FilterState {
  searchQuery: string;
  category: string;
  specialty: string;
  stockLevel: string;
  expiryStatus: string;
  priceRange: string;
}

export function SmartSearchFilter({ items, onFilteredItems }: SmartSearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "all",
    specialty: "all",
    stockLevel: "all",
    expiryStatus: "all",
    priceRange: "all"
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: specialties = [] } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
  });

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.uniqueNumber?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(item => item.categoryId === parseInt(filters.category));
    }

    if (filters.specialty !== "all") {
      filtered = filtered.filter(item => item.specialtyId === parseInt(filters.specialty));
    }

    if (filters.stockLevel !== "all") {
      filtered = filtered.filter(item => {
        const quantity = item.quantity;
        switch (filters.stockLevel) {
          case "low": return quantity <= 10;
          case "normal": return quantity > 10 && quantity <= 50;
          case "high": return quantity > 50;
          default: return true;
        }
      });
    }

    if (filters.expiryStatus !== "all") {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(item => {
        if (!item.expiry) return filters.expiryStatus === "fresh";
        const expiryDate = new Date(item.expiry);
        
        switch (filters.expiryStatus) {
          case "expired": return expiryDate < now;
          case "expiring": return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
          case "fresh": return expiryDate > thirtyDaysFromNow;
          default: return true;
        }
      });
    }

    if (filters.priceRange !== "all") {
      filtered = filtered.filter(item => {
        if (!item.price) return false;
        const price = item.price;
        switch (filters.priceRange) {
          case "low": return price <= 50;
          case "medium": return price > 50 && price <= 200;
          case "high": return price > 200;
          default: return true;
        }
      });
    }

    return filtered;
  }, [items, filters]);

  useMemo(() => {
    onFilteredItems(filteredItems);
  }, [filteredItems, onFilteredItems]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      category: "all",
      specialty: "all",
      stockLevel: "all",
      expiryStatus: "all",
      priceRange: "all"
    });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== "searchQuery" && value !== "all"
    ).length + (filters.searchQuery.trim() ? 1 : 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items by name, number, or notes..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={showAdvancedFilters ? "bg-primary text-primary-foreground" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        {getActiveFilterCount() > 0 && (
          <Button variant="ghost" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Specialty</label>
                <Select value={filters.specialty} onValueChange={(value) => updateFilter("specialty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map(specialty => (
                      <SelectItem key={specialty.id} value={specialty.id.toString()}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Level
                </label>
                <Select value={filters.stockLevel} onValueChange={(value) => updateFilter("stockLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Stock (≤10)</SelectItem>
                    <SelectItem value="normal">Normal (11-50)</SelectItem>
                    <SelectItem value="high">High Stock (&gt;50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredItems.length} of {items.length} items
          {getActiveFilterCount() > 0 && " (filtered)"}
        </span>
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-4">
            {filteredItems.filter(item => item.quantity <= 10).length > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                {filteredItems.filter(item => item.quantity <= 10).length} low stock
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}