import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, Person, TaskSource } from '../types';
import LoadingSpinner from './shared/LoadingSpinner';
import ProjectModal, { ProjectFormData } from './shared/ProjectModal';
import logo from '@assets/logo-full.png';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [taskSources, setTaskSources] = useState<TaskSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectsData, peopleData, taskSourcesData] = await Promise.all([
        window.database.query<Project>('SELECT * FROM Project ORDER BY Title ASC'),
        window.people.getAll(),
        window.taskSources.getAll()
      ]);
      setProjects(projectsData);
      setPeople(peopleData);
      setTaskSources(taskSourcesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProject = async (data: ProjectFormData) => {
    await window.projects.create({
      title: data.title,
      prefix: data.prefix,
      startDate: data.startDate,
      dueDate: data.dueDate,
      ownerId: data.ownerId,
      taskSourceId: data.taskSourceId,
    });
    
    // Refresh list
    await fetchData();
  };

  return (
    <div className="main-content">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <img src={logo} alt="ProTrack 3" style={{ height: '100px' }} />
          </div>
          <div className="d-flex">
            <button 
              className="btn btn-outline-secondary no-drag me-2"
              onClick={() => navigate('/settings')}
            >
              <i className="fas fa-cog me-1"></i> Settings
            </button>
            <button 
              className="btn btn-primary no-drag"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus me-1"></i> New Project
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner className="mt-5" />
        ) : projects.length === 0 ? (
          <div className="card shadow-sm mt-4">
            <div className="card-body text-center p-5">
              <i className="fas fa-folder-plus fa-3x text-muted mb-3"></i>
              <h3 className="card-title text-muted">No Projects Found</h3>
              <p className="card-text text-muted">
                Get started by creating your first project.
              </p>
            </div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {projects.map((project) => (
              <div key={project.Id} className="col">
                <div className="card h-100 shadow-sm border-0 project-card no-drag">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title text-truncate mb-0" title={project.Title}>
                        {project.Title}
                      </h5>
                      <span className="badge bg-light text-dark border">{project.Prefix}</span>
                    </div>
                    <div className="text-muted small mb-3">
                      <div className="mb-1 text-truncate">
                        {(() => {
                          const person = project.OwnerId ? people.find(p => p.Id === project.OwnerId) : null;
                          const colorClass = person?.Color ? `text-${person.Color}` : 'text-info';
                          return (
                            <>
                              <i className={`fas fa-user me-2 w-16 text-center ${colorClass}`}></i>
                              {person?.Name || 'No owner'}
                            </>
                          );
                        })()}
                      </div>
                      {project.StartDate && (
                        <div className="mb-1">
                          <i className="fas fa-calendar-alt me-2 w-16 text-center"></i>
                          Start: {new Date(project.StartDate).toLocaleDateString()}
                        </div>
                      )}
                      {project.DueDate && (
                        <div>
                          <i className="fas fa-calendar-check me-2 w-16 text-center"></i>
                          Due: {new Date(project.DueDate).toLocaleDateString()}
                        </div>
                      )}
                      {!project.StartDate && !project.DueDate && (
                        <div>
                          <i className="fas fa-calendar me-2 w-16 text-center"></i>
                          No dates set
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-footer bg-transparent border-top-0 pt-0 pb-3">
                    <button 
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => navigate(`/project/${project.Id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreateProject}
        people={people}
        taskSources={taskSources}
      />
    </div>
  );
};

export default ProjectList;
