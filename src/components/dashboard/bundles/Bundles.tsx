import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BundlesHeader from './BundlesHeader';
import BundlesFilterBar from './BundlesFilterbar';
import BundleCard from './BundleCard';
import BundleRow from './BundleRow';
import { FileStack, Plus } from 'lucide-react';
import type { SortOption, ViewMode } from './types/types';

// Mock data for bundles
const mockBundles = [
  {
    id: 'bundle-1',
    name: 'Smith v. Johnson - Discovery',
    caseNumber: 'CV-2024-001234',
    documentCount: 45,
    lastModified: '2025-12-15',
    status: 'In Progress',
    color: 'blue',
  },
  {
    id: 'bundle-2',
    name: 'Estate Planning - Williams',
    caseNumber: 'PR-2024-005678',
    documentCount: 23,
    lastModified: '2025-12-14',
    status: 'Complete',
    color: 'green',
  },
  {
    id: 'bundle-3',
    name: 'Corporate Merger - TechCo',
    caseNumber: 'CM-2024-009876',
    documentCount: 128,
    lastModified: '2025-12-13',
    status: 'In Progress',
    color: 'purple',
  },
  {
    id: 'bundle-4',
    name: 'Patent Infringement - ABC Inc',
    caseNumber: 'IP-2024-004321',
    documentCount: 67,
    lastModified: '2025-12-12',
    status: 'Review',
    color: 'orange',
  },
  {
    id: 'bundle-5',
    name: 'Employment Dispute - Davis',
    caseNumber: 'EM-2024-007890',
    documentCount: 34,
    lastModified: '2025-12-10',
    status: 'Complete',
    color: 'green',
  },
  {
    id: 'bundle-6',
    name: 'Real Estate Transaction',
    caseNumber: 'RE-2024-002468',
    documentCount: 19,
    lastModified: '2025-12-08',
    status: 'In Progress',
    color: 'blue',
  },
];

const BundleList = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const handleCreateNew = () => {
    alert('Opening bundle creation dialog...');
  };

  const handleOpenBundle = bundle => {
    alert(`Opening bundle: ${bundle.name}`);
  };

  const filteredBundles = mockBundles.filter(
    bundle =>
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BundlesHeader onCreateNew={handleCreateNew} />
      <BundlesFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onOpen={() => handleOpenBundle(bundle)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bundle Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="w-12 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBundles.map(bundle => (
                  <BundleRow
                    key={bundle.id}
                    bundle={bundle}
                    onOpen={() => handleOpenBundle(bundle)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredBundles.length === 0 && (
          <div className="text-center py-12">
            <FileStack className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bundles found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or create a new bundle
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Bundle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleList;
