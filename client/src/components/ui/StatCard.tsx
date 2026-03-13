import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  variant?: "blue" | "teal" | "amber" | "rose";
}

export function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  description, 
  trend,
  trendValue,
  className,
  variant = "blue"
}: StatCardProps) {
  
  const variants = {
    blue: "from-blue-50 to-blue-100/50 border-blue-200/60 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30",
    teal: "from-teal-50 to-teal-100/50 border-teal-200/60 dark:from-teal-950/20 dark:to-teal-900/10 dark:border-teal-800/30",
    amber: "from-amber-50 to-amber-100/50 border-amber-200/60 dark:from-amber-950/20 dark:to-amber-900/10 dark:border-amber-800/30",
    rose: "from-rose-50 to-rose-100/50 border-rose-200/60 dark:from-rose-950/20 dark:to-rose-900/10 dark:border-rose-800/30"
  };

  const iconColors = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40",
    teal: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40"
  };

  return (
    <Card className={cn("bg-gradient-to-br transition-all hover:shadow-md", variants[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", iconColors[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          )}
        </div>
        {(description || trend) && (
          <div className="mt-2 flex items-center text-xs">
            {trend && (
              <span className={cn(
                "font-medium mr-2 px-1.5 py-0.5 rounded",
                trend === "up" ? "text-green-700 bg-green-100" : 
                trend === "down" ? "text-red-700 bg-red-100" : "text-gray-700 bg-gray-100"
              )}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            )}
            <p className="text-muted-foreground">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
