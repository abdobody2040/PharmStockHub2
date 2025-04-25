import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function calculateDaysRemaining(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  
  const expiryDate = new Date(date);
  const today = new Date();
  
  // Reset time part to compare just dates
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const differenceInTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
}

export function getExpiryStatus(date: Date | string | null | undefined): 'critical' | 'warning' | 'safe' | 'expired' | 'unknown' {
  if (!date) return 'unknown';
  
  const daysRemaining = calculateDaysRemaining(date);
  
  if (daysRemaining === null) return 'unknown';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 14) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'safe';
}

export function getExpiryStatusColor(status: ReturnType<typeof getExpiryStatus>): string {
  switch (status) {
    case 'critical': return 'text-red-500 bg-red-100';
    case 'warning': return 'text-orange-500 bg-orange-100';
    case 'safe': return 'text-green-500 bg-green-100';
    case 'expired': return 'text-gray-100 bg-gray-800';
    default: return 'text-gray-500 bg-gray-100';
  }
}

export function getCategoryColorClass(categoryName: string): string {
  const colorMap: Record<string, string> = {
    'Brochures': 'bg-blue-100 text-blue-800',
    'Samples': 'bg-green-100 text-green-800',
    'Gifts': 'bg-purple-100 text-purple-800',
    'Banners': 'bg-yellow-100 text-yellow-800',
    'Digital Media': 'bg-indigo-100 text-indigo-800',
    'Other': 'bg-gray-100 text-gray-800'
  };
  
  return colorMap[categoryName] || 'bg-gray-100 text-gray-800';
}

export function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    'ceo': 'bg-purple-500',
    'marketer': 'bg-blue-500',
    'salesManager': 'bg-green-500',
    'stockManager': 'bg-yellow-500',
    'admin': 'bg-pink-500',
    'medicalRep': 'bg-indigo-500'
  };
  
  return colorMap[role] || 'bg-gray-500';
}

export function getRoleName(role: string): string {
  const nameMap: Record<string, string> = {
    'ceo': 'CEO',
    'marketer': 'Marketer',
    'salesManager': 'Sales Manager',
    'stockManager': 'Stock Manager',
    'admin': 'Admin',
    'medicalRep': 'Medical Rep'
  };
  
  return nameMap[role] || role;
}

export function truncateText(text: string, maxLength: number = 30): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Generate a random placeholder avatar URL
export function getPlaceholderAvatar(name: string): string {
  const colors = ['f44336', '2196f3', '4caf50', 'ff9800', '9c27b0', '607d8b'];
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % colors.length;
  const backgroundColor = colors[colorIndex];
  
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff`;
}
