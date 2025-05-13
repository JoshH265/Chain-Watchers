import React, { useState } from 'react';

type TabType = 'holdings' | 'transactions' | 'profitLoss';

interface WalletTabsProps {
  children: React.ReactNode;
  defaultTab?: TabType;
}

interface TabProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

// Tab header component
const TabHeader: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-700 mb-4">
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'holdings'
            ? ' border-b-2 border-blue-500'
            : 'text-black hover:text-gray-200'
        }`}
        onClick={() => setActiveTab('holdings')}
      >
        Current Token Holdings
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'transactions'
            ? ' border-b-2 border-blue-500'
            : 'text-black hover:text-gray-200'
        }`}
        onClick={() => setActiveTab('transactions')}
      >
        Transaction History
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'profitLoss'
            ? ' border-b-2 border-blue-500'
            : 'text-black hover:text-gray-200'
        }`}
        onClick={() => setActiveTab('profitLoss')}
      >
        Profit and Loss
      </button>
    </div>
  );
};

// Main tabs container component
const WalletTabs: React.FC<WalletTabsProps> = ({ 
  children, 
  defaultTab = 'holdings' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // Clone children and pass activeTab prop
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement<any>(child)) { // FIXED THE LINE BELOW WITH THIS CODE
      return React.cloneElement(child, { activeTab });
    }
    return child;
  });

  return (
    <div className="w-full">
      <TabHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="tab-content">{childrenWithProps}</div>
    </div>
  );
};

// Individual tab content component
interface TabContentProps {
  tab: TabType;
  activeTab?: TabType;
  children: React.ReactNode;
}

export const TabContent: React.FC<TabContentProps> = ({ 
  tab, 
  activeTab, 
  children 
}) => {
  if (tab !== activeTab) return null;
  return <div className="tab-pane">{children}</div>;
};

export default WalletTabs;