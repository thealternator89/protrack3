import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../global';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.database.query<Project>('SELECT * FROM Project ORDER BY Title ASC');
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await window.projects.create({
        title: newTitle,
        startDate: newStartDate || undefined,
        dueDate: newDueDate || undefined,
      });
      
      // Reset form and close modal
      setNewTitle('');
      setNewStartDate('');
      setNewDueDate('');
      setShowModal(false);
      
      // Refresh list
      await fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-folder-open text-primary me-2"></i>
            Projects
          </h2>
          <button 
            className="btn btn-primary no-drag"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-1"></i> New Project
          </button>
        </div>

        {isLoading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
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
                    <h5 className="card-title text-truncate" title={project.Title}>
                      {project.Title}
                    </h5>
                    <div className="text-muted small mb-3">
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

      {/* New Project Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Project</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleCreateProject}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="projectTitle" className="form-label">Project Title</label>
                      <input
                        type="text"
                        className="form-control no-drag"
                        id="projectTitle"
                        placeholder="Enter project name"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="startDate" className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control no-drag"
                          id="startDate"
                          value={newStartDate}
                          onChange={(e) => setNewStartDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="dueDate" className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control no-drag"
                          id="dueDate"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary no-drag" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default ProjectList;
