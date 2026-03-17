// dashboard/components/StorageWidget.tsx
import { Progress } from '@/components/ui/progress';

export const StorageWidget = ({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) => {
  const percentage = (used / limit) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Used: {used} GB</span>
        <span className="font-medium">{limit} GB</span>
      </div>
      <Progress
        value={percentage}
        className="h-2 bg-emerald-100 dark:bg-emerald-950/30"
        indicatorClassName="bg-emerald-500 dark:bg-emerald-400"
      />
      <p className="text-xs text-muted-foreground text-center">
        {percentage.toFixed(1)}% of total storage used
      </p>
    </div>
  );
};
