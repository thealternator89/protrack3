import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Task, Person, Status, Project, TaskPrerequisite } from '../types';

const TaskView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [prerequisites, setPrerequisites] = useState<TaskPrerequisite[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddPrereqModal, setShowAddPrereqModal] = useState(false);
  const [showEditPrereqModal, setShowEditPrereqModal] = useState(false);
  const [prereqTaskId, setPrereqTaskId] = useState<number | ''>('');
  const [prereqType, setPrereqType] = useState('Start');
  const [isProcessingPrereq, setIsProcessingPrereq] = useState(false);
  const [editingPrereq, setEditingPrereq] = useState<TaskPrerequisite | null>(null);
  
  // Delete confirmation state
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      const data = await window.tasks.get(Number(id));
      if (data && data.task) {
        setTask(data.task);
        setPrerequisites(data.prerequisites);
        const [projectData, peopleData, statusData] = await Promise.all([
          window.projects.get(data.task.ProjectId),
          window.people.getAll(),
          window.statuses.getAll()
        ]);
        setProject(projectData);
        setPeople(peopleData);
        setStatuses(statusData);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, [id]);

  const handleAddPrerequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !prereqTaskId || isProcessingPrereq) return;

    setIsProcessingPrereq(true);
    try {
      await window.tasks.addPrerequisite(Number(id), Number(prereqTaskId), prereqType);
      setPrereqTaskId('');
      setPrereqType('Start');
      setShowAddPrereqModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to add prerequisite:', error);
      alert('Error adding prerequisite. Please make sure the Task ID is valid.');
    } finally {
      setIsProcessingPrereq(false);
    }
  };

  const handleEditPrerequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingPrereq || isProcessingPrereq) return;

    setIsProcessingPrereq(true);
    try {
      await window.tasks.updatePrerequisite(Number(id), editingPrereq.PrerequisiteTaskId, prereqType);
      setEditingPrereq(null);
      setPrereqType('Start');
      setShowEditPrereqModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to update prerequisite:', error);
      alert('Error updating prerequisite.');
    } finally {
      setIsProcessingPrereq(false);
    }
  };

  const handleDeletePrerequisite = async () => {
    if (!id || !editingPrereq || isProcessingPrereq) return;

    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = setTimeout(() => {
        setIsDeleteConfirming(false);
      }, 3000);
      return;
    }

    setIsProcessingPrereq(true);
    try {
      await window.tasks.deletePrerequisite(Number(id), editingPrereq.PrerequisiteTaskId);
      setEditingPrereq(null);
      setIsDeleteConfirming(false);
      setShowEditPrereqModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete prerequisite:', error);
      alert('Error deleting prerequisite.');
    } finally {
      setIsProcessingPrereq(false);
    }
  };

  const openEditModal = (prereq: TaskPrerequisite) => {
    setEditingPrereq(prereq);
    setPrereqType(prereq.PrerequisiteType);
    setIsDeleteConfirming(false);
    setShowEditPrereqModal(true);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Task not found.</div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 overflow-auto h-100">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Projects</Link></li>
              {project && (
                <li className="breadcrumb-item">
                  <Link to={`/project/${project.Id}`}>{project.Title}</Link>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">Task #{task.Id}</li>
            </ol>
          </nav>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h2 className="mb-0 h4">{task.Title}</h2>
              <div>
                {task.StatusLabel && (
                  <span className={`badge ${task.IsComplete ? 'bg-success' : 'bg-primary'} fs-6 fw-normal`}>
                    {task.StatusLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="text-muted small text-uppercase fw-bold mb-1">Assignee</label>
                  <div>
                    {task.AssigneeName ? (
                      <span className="badge bg-info text-dark fs-6 fw-normal">
                        {task.AssigneeName}
                      </span>
                    ) : (
                      <span className="text-muted italic">Unassigned</span>
                    )}
                  </div>
                </div>
                {task.ParentId && (
                  <div className="col-md-6">
                    <label className="text-muted small text-uppercase fw-bold mb-1">Parent Task</label>
                    <div>
                      <Link to={`/task/${task.ParentId}`} className="text-decoration-none fw-bold">
                        {task.ParentTitle || `Task #${task.ParentId}`}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="text-muted small text-uppercase fw-bold mb-2 d-block">Description</label>
                <div className="p-3 bg-light rounded border mb-4" style={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                  {task.Description || <span className="text-muted italic">No description provided.</span>}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="text-muted small text-uppercase fw-bold mb-0">Prerequisites</label>
                  <button 
                    className="btn btn-sm btn-outline-primary no-drag"
                    onClick={() => {
                      setPrereqTaskId('');
                      setPrereqType('Start');
                      setShowAddPrereqModal(true);
                    }}
                  >
                    <i className="fas fa-plus me-1"></i> Add
                  </button>
                </div>
                
                {prerequisites.length > 0 ? (
                  <div className="list-group shadow-sm">
                    {prerequisites.map((prereq) => (
                      <div key={prereq.PrerequisiteTaskId} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center flex-grow-1">
                          <Link to={`/task/${prereq.PrerequisiteTaskId}`} className="text-decoration-none fw-bold me-2">
                            {prereq.PrerequisiteTaskTitle || `Task #${prereq.PrerequisiteTaskId}`}
                          </Link>
                          {prereq.PrerequisiteIsComplete ? (
                            <span className="badge bg-success small fw-normal">Complete</span>
                          ) : (
                            <span className="badge bg-secondary small fw-normal">Pending</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-light text-dark border fw-normal">
                            {prereq.PrerequisiteType}
                          </span>
                          <button 
                            className="btn btn-sm btn-link p-0 no-drag"
                            onClick={() => openEditModal(prereq)}
                            title="Edit Relationship"
                          >
                            <i className="fas fa-edit text-muted"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted italic p-2 border rounded bg-light small">
                    No prerequisites defined for this task.
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary no-drag"
                  onClick={() => navigate(-1)}
                >
                  <i className="fas fa-arrow-left me-1"></i> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Prerequisite Modal */}
      {showAddPrereqModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Add Prerequisite</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowAddPrereqModal(false)}></button>
                </div>
                <form onSubmit={handleAddPrerequisite}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="prereqTaskId" className="form-label">Prerequisite Task ID</label>
                      <input
                        type="number"
                        className="form-control no-drag"
                        id="prereqTaskId"
                        placeholder="Enter Task ID (e.g., 42)"
                        value={prereqTaskId}
                        onChange={(e) => setPrereqTaskId(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="prereqType" className="form-label">Relationship Type</label>
                      <select
                        className="form-select no-drag"
                        id="prereqType"
                        value={prereqType}
                        onChange={(e) => setPrereqType(e.target.value)}
                      >
                        <option value="Start">Start</option>
                        <option value="End">End</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowAddPrereqModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary no-drag" disabled={isProcessingPrereq}>
                      {isProcessingPrereq ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : 'Add Prerequisite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Edit Prerequisite Modal */}
      {showEditPrereqModal && editingPrereq && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Prerequisite</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowEditPrereqModal(false)}></button>
                </div>
                <form onSubmit={handleEditPrerequisite}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Prerequisite Task</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={editingPrereq.PrerequisiteTaskTitle || `Task #${editingPrereq.PrerequisiteTaskId}`}
                        disabled
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editPrereqType" className="form-label">Relationship Type</label>
                      <select
                        className="form-select no-drag"
                        id="editPrereqType"
                        value={prereqType}
                        onChange={(e) => setPrereqType(e.target.value)}
                        autoFocus
                      >
                        <option value="Start">Start</option>
                        <option value="End">End</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer d-flex justify-content-between">
                    <button 
                      type="button" 
                      className={`btn ${isDeleteConfirming ? 'btn-danger' : 'btn-outline-danger'} no-drag`}
                      onClick={handleDeletePrerequisite}
                      disabled={isProcessingPrereq}
                    >
                      {isDeleteConfirming ? 'Are you sure?' : (
                        <><i className="fas fa-trash-alt me-1"></i> Delete</>
                      )}
                    </button>
                    <div>
                      <button type="button" className="btn btn-secondary no-drag me-2" onClick={() => setShowEditPrereqModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary no-drag" disabled={isProcessingPrereq}>
                        {isProcessingPrereq ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : 'Update'}
                      </button>
                    </div>
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

export default TaskView;
