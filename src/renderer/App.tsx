import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import ProjectView from './components/ProjectView';
import TaskView from './components/TaskView';
import Settings from './components/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <div className="titlebar shadow-sm">
        <span className="titlebar-content">
          <i className="fas fa-tools me-2 text-primary"></i>
          ProTrack 3
        </span>
      </div>

      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/task/:id" element={<TaskView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
};

export default App;
