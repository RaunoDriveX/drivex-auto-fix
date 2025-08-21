import React from 'react';
import { Badge } from './badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreferredShopBadgeProps {
  isPreferred?: boolean;
  isOutOfNetwork?: boolean;
  className?: string;
}

export const PreferredShopBadge: React.FC<PreferredShopBadgeProps> = ({
  isPreferred = false,
  isOutOfNetwork = false,
  className
}) => {
  if (isPreferred) {
    return (
      <Badge 
        variant="secondary" 
        className={cn("bg-green-100 text-green-800 border-green-200 hover:bg-green-100", className)}
      >
        <Shield className="w-3 h-3 mr-1" />
        Preferred by your insurer
      </Badge>
    );
  }

  if (isOutOfNetwork) {
    return (
      <Badge 
        variant="outline" 
        className={cn("bg-yellow-50 text-yellow-800 border-yellow-200", className)}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Out of network
      </Badge>
    );
  }

  return null;
};