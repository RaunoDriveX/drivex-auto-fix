import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviews?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  showValue = false, 
  reviews,
  className 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const difference = rating - index;
    
    if (difference >= 1) {
      // Full star
      return (
        <Star 
          key={index} 
          className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} 
        />
      );
    } else if (difference >= 0.75) {
      // Almost full star (75%+)
      return (
        <div key={index} className="relative">
          <Star className={cn(sizeClasses[size], "text-muted-foreground")} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(0 0, 90% 0, 90% 100%, 0 100%)" }}>
            <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
          </div>
        </div>
      );
    } else if (difference >= 0.5) {
      // Half star (50%+)
      return (
        <div key={index} className="relative">
          <Star className={cn(sizeClasses[size], "text-muted-foreground")} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}>
            <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
          </div>
        </div>
      );
    } else if (difference >= 0.25) {
      // Quarter star (25%+)
      return (
        <div key={index} className="relative">
          <Star className={cn(sizeClasses[size], "text-muted-foreground")} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(0 0, 25% 0, 25% 100%, 0 100%)" }}>
            <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
          </div>
        </div>
      );
    } else {
      // Empty star
      return (
        <Star 
          key={index} 
          className={cn(sizeClasses[size], "text-muted-foreground")} 
        />
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}>
          {rating.toFixed(1)}
          {reviews && ` (${reviews})`}
        </span>
      )}
    </div>
  );
}