import { Download, FileText, Settings } from 'lucide-react';
import { useState } from 'react';
import RightSidebar from '@/components/sidebars/RightSidebar';
import Annotations from './components/Annotations';
import DocumentSettings from './components/DocumentSettings';
import Exports from './components/Exports';

type TabType = 'properties' | 'annotations' | 'export';

function PropertiesSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const tabs = [
    {
      id: 'properties' as TabType,
      label: 'Properties',
      icon: Settings,
      component: DocumentSettings,
    },
    {
      id: 'annotations' as TabType,
      label: 'Annotations',
      icon: FileText,
      component: Annotations,
    },
    {
      id: 'export' as TabType,
      label: 'Export',
      icon: Download,
      component: Exports,
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <RightSidebar>
      {/* Sidebar Header */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <h2 className="font-semibold text-gray-900 text-sm">Document Tools</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-white">
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-3 font-medium text-xs transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                type="button"
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent && (
          <div className="p-4">
            <ActiveComponent />
          </div>
        )}
      </div>
    </RightSidebar>
  );
}

export default PropertiesSidebar;
