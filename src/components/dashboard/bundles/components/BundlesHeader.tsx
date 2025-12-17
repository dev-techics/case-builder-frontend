import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

//type
interface BundlesHeaderProps {
  onCreateNew: () => void;
}

// Templates Header Component
const BundlesHeader = ({ onCreateNew }: BundlesHeaderProps) => {
  return (
    <div className="border-b bg-white">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Bundles</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and organize your legal case files
            </p>
          </div>
          <Button onClick={onCreateNew} className="gap-2" variant="default">
            <Plus className="h-4 w-4" />
            Create Bundle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BundlesHeader;
