import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import ProjectView from './components/ProjectView';
import TaskView from './components/TaskView';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const fetchVersion = async () => {
      const v = await window.electronAPI.getVersion();
      setVersion(v);
    };
    fetchVersion();
  }, []);

  return (
    <Router>
      <div className="titlebar shadow-sm">
        <span className="titlebar-content">
          <i className="fas fa-arrow-trend-up me-2 text-light"></i>
          ProTrack 3
        </span>
      </div>

      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/task/:id" element={<TaskView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>

      <div className="footer">
        <span>v{version}</span>
      </div>
    </Router>
  );
};

export default App;
