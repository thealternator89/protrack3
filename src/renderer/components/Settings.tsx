import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PeopleTab from './settings/PeopleTab';
import StatusesTab from './settings/StatusesTab';

type TabType = 'statuses' | 'people';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('statuses');

  return (
    <div className="main-content">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-cog text-primary me-2"></i>
            Settings
          </h2>
          <button 
            className="btn btn-outline-secondary no-drag"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left me-1"></i> Back to Projects
          </button>
        </div>
        
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom-0 pt-3">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link no-drag ${activeTab === 'statuses' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('statuses')}
                >
                  <i className="fas fa-tasks me-2"></i> Statuses
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link no-drag ${activeTab === 'people' ? 'active fw-bold' : ''}`}
                  onClick={() => setActiveTab('people')}
                >
                  <i className="fas fa-users me-2"></i> People
                </button>
              </li>
            </ul>
          </div>
          <div className="card-body p-4">
            {activeTab === 'statuses' && <StatusesTab />}
            {activeTab === 'people' && <PeopleTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
