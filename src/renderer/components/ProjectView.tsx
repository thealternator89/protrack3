import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project } from '../global';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal & Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await window.projects.get(Number(id));
      setProject(data);
      if (data) {
        setEditTitle(data.Title);
        setEditStartDate(data.StartDate || '');
        setEditDueDate(data.DueDate || '');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      await window.projects.update({
        id: project.Id,
        title: editTitle,
        startDate: editStartDate || undefined,
        dueDate: editDueDate || undefined,
      });
      
      setShowEditModal(false);
      await fetchProject();
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Error updating project. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="main-content text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="main-content container mt-4">
        <div className="alert alert-danger">Project not found.</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left me-2"></i>Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-link p-0 text-decoration-none no-drag" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Projects
          </button>
          <button 
            className="btn btn-outline-primary no-drag"
            onClick={() => setShowEditModal(true)}
          >
            <i className="fas fa-edit me-1"></i> Edit Project
          </button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="mb-4">
              <h2 className="card-title mb-1">
                <i className="fas fa-folder-open text-primary me-3"></i>
                {project.Title}
              </h2>
              <div className="text-muted small ms-5 d-flex gap-4">
                <span>
                  <i className="fas fa-calendar-alt me-2 text-primary"></i>
                  <strong>Start:</strong> {project.StartDate ? new Date(project.StartDate).toLocaleDateString() : 'Not set'}
                </span>
                <span>
                  <i className="fas fa-calendar-check me-2 text-success"></i>
                  <strong>Due:</strong> {project.DueDate ? new Date(project.DueDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
            
            <div className="p-5 bg-light rounded shadow-sm d-flex align-items-center justify-content-center w-100">
              <div className="text-center text-muted">
                <i className="fas fa-tasks fa-3x mb-3 d-block"></i>
                <h5 className="mb-0">Tasks coming soon...</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Project</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowEditModal(false)}></button>
                </div>
                <form onSubmit={handleUpdateProject}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="projectTitle" className="form-label">Project Title</label>
                      <input
                        type="text"
                        className="form-control no-drag"
                        id="projectTitle"
                        placeholder="Enter project name"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
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
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="dueDate" className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control no-drag"
                          id="dueDate"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary no-drag" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : 'Save Changes'}
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

export default ProjectView;
