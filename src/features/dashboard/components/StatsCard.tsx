import { cn } from '@/lib/utils'; // shadcn utility
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconSvgElement;
  trend?: string; // e.g., "+12%"
  trendType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  variant?: 'blue' | 'green' | 'purple' | 'orange';
}

const variants = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  green:
    // 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    'bg-emerald-500 text-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  purple:
    'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  orange:
    'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400',
};

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
  description,
  variant = 'green',
}: StatsCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        {/* Label and Value */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">{value}</h2>
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  trendType === 'positive' &&
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                  trendType === 'negative' &&
                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                  trendType === 'neutral' && 'bg-slate-100 text-slate-700'
                )}
              >
                {trend}
              </span>
            )}
          </div>
        </div>

        {/* Icon with colored background */}
        <div className="border border-gray-200 rounded-full p-1">
          <div
            className={cn(
              'p-3 rounded-full border border-gray-200',
              variants[variant]
            )}
          >
            <HugeiconsIcon size={24} strokeWidth={2.5} icon={Icon} />
          </div>
        </div>
      </div>

      {description && (
        <p className="mt-4 text-xs text-muted-foreground italic">
          {description}
        </p>
      )}

      {/* Subtle bottom accent line */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 w-full opacity-50',
          variant === 'blue' && 'bg-blue-500',
          variant === 'green' && 'bg-emerald-500',
          variant === 'purple' && 'bg-purple-500',
          variant === 'orange' && 'bg-orange-500'
        )}
      />
    </div>
  );
};
