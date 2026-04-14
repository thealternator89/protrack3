import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task, Person, Status, Project, TaskPrerequisite, TaskSource } from '../types';
import Modal from './shared/Modal';
import LoadingSpinner, { ButtonSpinner } from './shared/LoadingSpinner';
import TaskModal, { TaskFormData } from './shared/TaskModal';

const TaskView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [prerequisites, setPrerequisites] = useState<TaskPrerequisite[]>([]);
  const [dependedOnBy, setDependedOnBy] = useState<TaskPrerequisite[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [taskSources, setTaskSources] = useState<TaskSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);

  // Calculate remote task URL
  const remoteUrl = useMemo(() => {
    if (!task?.RemoteTaskId || !project?.TaskSourceId || taskSources.length === 0) return null;
    
    const source = taskSources.find(s => s.Id === project.TaskSourceId);
    if (!source) return null;

    try {
      const config = JSON.parse(source.Config);
      if (source.Type === 'Azure DevOps') {
        const organizationName = config.organizationName || '';
        const projectName = config.project || '';
        if (organizationName && projectName) {
          return `https://dev.azure.com/${organizationName}/${projectName}/_workitems/edit/${task.RemoteTaskId}`;
        }
      }
    } catch {
      console.error('Failed to parse task source config');
    }
    return null;
  }, [task, project, taskSources]);

  // Modal State
  const [showAddPrereqModal, setShowAddPrereqModal] = useState(false);
  const [showEditPrereqModal, setShowEditPrereqModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [prereqDisplayId, setPrereqDisplayId] = useState('');
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
        setDependedOnBy(data.dependedOnBy || []);
        const [projectData, peopleData, statusData, projectTasksData, taskSourcesData] = await Promise.all([
          window.projects.get(data.task.ProjectId),
          window.people.getAll(),
          window.statuses.getAll(),
          window.tasks.getByProject(data.task.ProjectId),
          window.taskSources.getAll()
        ]);
        setProject(projectData);
        setPeople(peopleData);
        setStatuses(statusData);
        setProjectTasks(projectTasksData.tasks);
        setTaskSources(taskSourcesData);
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

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!task) return;
    await window.tasks.update({
      id: task.Id,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      statusId: data.statusId,
      parentId: data.parentId,
      remoteTaskId: data.remoteTaskId,
    });
    await fetchData();
  };

  const handleAddPrerequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !prereqDisplayId || !task || isProcessingPrereq) return;

    setIsProcessingPrereq(true);
    try {
      const targetTask = await window.tasks.findByDisplayId(prereqDisplayId, task.ProjectId);
      if (!targetTask) {
        alert(`Task "${prereqDisplayId}" not found.`);
        setIsProcessingPrereq(false);
        return;
      }

      await window.tasks.addPrerequisite(Number(id), targetTask.Id, prereqType);
      setPrereqDisplayId('');
      setPrereqType('Start');
      setShowAddPrereqModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to add prerequisite:', error);
      alert('Error adding prerequisite.');
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
    setPrereqType(prereq.Type);
    setIsDeleteConfirming(false);
    setShowEditPrereqModal(true);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <LoadingSpinner />
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
              <li className="breadcrumb-item active" aria-current="page">
                <span className="badge bg-secondary text-white fw-normal">
                  {project ? `${project.Prefix}-${task.DisplayId}` : `Task #${task.Id}`}
                </span>
              </li>
            </ol>
          </nav>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-3">
                  <h2 className="mb-0 h4">
                    {task.Title}
                  </h2>
                  {task.StatusLabel && (
                    <span className={`badge ${task.IsComplete ? 'bg-success' : 'bg-primary'} fs-6 fw-normal`}>
                      {task.StatusLabel}
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {remoteUrl && (
                    <button 
                      className="btn btn-sm btn-outline-info no-drag"
                      onClick={() => window.electronAPI.openExternal(remoteUrl)}
                      title="View in External Source"
                    >
                      <i className="fas fa-external-link-alt me-1"></i> View
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-primary no-drag"
                    onClick={() => setShowEditTaskModal(true)}
                  >
                    <i className="fas fa-edit me-1"></i> Edit
                  </button>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {!task.IsComplete && dependedOnBy.length > 0 && (
                  <span className="badge bg-info text-dark fw-normal">
                    <i className="fas fa-link me-1"></i>
                    Prerequisite for: {dependedOnBy.length}
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="text-muted small text-uppercase fw-bold mb-1">Assignee</label>
                  <div>
                    {task.AssigneeId ? (() => {
                      const person = people.find(p => p.Id === task.AssigneeId);
                      const color = person?.Color || 'info';
                      const textColor = ['warning', 'light', 'info'].includes(color) ? 'text-dark' : 'text-white';
                      return (
                        <span className={`badge bg-${color} ${textColor} fs-6 fw-normal`}>
                          {task.AssigneeName}
                        </span>
                      );
                    })() : (
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
                <div className="p-3 bg-light rounded border mb-4 description-content" style={{ minHeight: '100px' }}>
                  {task.Description ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => (
                          <a 
                            {...props} 
                            onClick={(e) => {
                              if (props.href) {
                                e.preventDefault();
                                window.electronAPI.openExternal(props.href);
                              }
                            }}
                            href={props.href}
                          />
                        )
                      }}
                    >
                      {task.Description}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-muted italic">No description provided.</span>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="text-muted small text-uppercase fw-bold mb-0">Prerequisites</label>
                  <button 
                    className="btn btn-sm btn-outline-primary no-drag"
                    onClick={() => {
                      setPrereqDisplayId('');
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
                            {prereq.Type}
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

      <Modal
        show={showAddPrereqModal}
        title="Add Prerequisite"
        onClose={() => setShowAddPrereqModal(false)}
        onSubmit={handleAddPrerequisite}
        isSubmitting={isProcessingPrereq}
        footer={
          <>
            <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowAddPrereqModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary no-drag" disabled={isProcessingPrereq}>
              {isProcessingPrereq ? <ButtonSpinner label="" className="" /> : 'Add Prerequisite'}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label htmlFor="prereqTaskId" className="form-label">Prerequisite Task ID</label>
          <input
            type="text"
            className="form-control no-drag"
            id="prereqTaskId"
            placeholder="Enter ID (e.g., 42 or ABC-42)"
            value={prereqDisplayId}
            onChange={(e) => setPrereqDisplayId(e.target.value)}
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
      </Modal>

      <Modal
        show={showEditPrereqModal && !!editingPrereq}
        title="Edit Prerequisite"
        onClose={() => setShowEditPrereqModal(false)}
        onSubmit={handleEditPrerequisite}
        isSubmitting={isProcessingPrereq}
        footer={
          <div className="d-flex justify-content-between w-100">
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
                {isProcessingPrereq ? <ButtonSpinner label="" className="" /> : 'Update'}
              </button>
            </div>
          </div>
        }
      >
        {editingPrereq && (
          <>
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
          </>
        )}
      </Modal>

      <TaskModal
        show={showEditTaskModal && !!task}
        onClose={() => setShowEditTaskModal(false)}
        onSave={handleUpdateTask}
        initialData={task}
        project={project!}
        people={people}
        statuses={statuses}
        projectTasks={projectTasks}
      />
    </div>
  );
};

export default TaskView;
