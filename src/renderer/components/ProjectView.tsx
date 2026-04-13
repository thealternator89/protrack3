import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Person, Task, TaskPrerequisite, Status } from '../types';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prerequisites, setPrerequisites] = useState<TaskPrerequisite[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal & Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editOwnerId, setEditOwnerId] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | ''>('');
  const [newTaskStatusId, setNewTaskStatusId] = useState<number | ''>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [projectData, peopleData, taskData, statusData] = await Promise.all([
        window.projects.get(Number(id)),
        window.people.getAll(),
        window.tasks.getByProject(Number(id)),
        window.statuses.getAll()
      ]);
      setProject(projectData);
      setPeople(peopleData);
      setTasks(taskData.tasks);
      setPrerequisites(taskData.prerequisites);
      setStatuses(statusData);
      
      if (statusData.length > 0 && newTaskStatusId === '') {
        const newStatus = statusData.find(s => s.IsNew === 1) || statusData[0];
        setNewTaskStatusId(newStatus.Id);
      }

      if (projectData) {
        setEditTitle(projectData.Title);
        setEditPrefix(projectData.Prefix);
        setEditStartDate(projectData.StartDate || '');
        setEditDueDate(projectData.DueDate || '');
        setEditOwnerId(projectData.OwnerId || '');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, newTaskStatusId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editTitle.trim() || !editPrefix.trim()) return;

    setIsUpdating(true);
    try {
      await window.projects.update({
        id: project.Id,
        title: editTitle,
        prefix: editPrefix.toUpperCase(),
        startDate: editStartDate || undefined,
        dueDate: editDueDate || undefined,
        ownerId: editOwnerId === '' ? undefined : editOwnerId,
      });
      
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Error updating project. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      // Simple logic for next DisplayId and SortOrder
      const nextDisplayId = tasks.length > 0 ? Math.max(...tasks.map(t => t.DisplayId)) + 1 : 1;
      const nextSortOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.SortOrder)) + 10 : 10;

      await window.tasks.create({
        displayId: nextDisplayId,
        title: newTaskTitle.trim(),
        projectId: Number(id),
        sortOrder: nextSortOrder,
        description: newTaskDescription.trim() || undefined,
        assigneeId: newTaskAssigneeId === '' ? undefined : newTaskAssigneeId,
        statusId: newTaskStatusId === '' ? undefined : (newTaskStatusId as number),
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssigneeId('');
      // Reset status to "New" status if available
      if (statuses.length > 0) {
        const newStatus = statuses.find(s => s.IsNew === 1) || statuses[0];
        setNewTaskStatusId(newStatus.Id);
      }
      setShowAddTaskModal(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setIsCreatingTask(false);
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

  // Task categorization logic
  const isReadyToStart = (task: Task) => {
    const taskPrereqs = prerequisites.filter(p => p.TaskId === task.Id);
    if (taskPrereqs.length === 0) return true;

    return taskPrereqs.every(p => 
      p.PrerequisiteIsComplete === 1 || p.Type === 'End'
    );
  };

  const TaskTable = ({ tasks }: { tasks: Task[] }) => (
    <div className="mb-5">
      {tasks.length === 0 ? (
        <div className="alert alert-light border text-center py-4">
          No tasks found for this project.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle border shadow-sm rounded" style={{ tableLayout: 'fixed' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Title</th>
                <th style={{ width: '150px' }}>Assignee</th>
                <th style={{ width: '150px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const notReady = !isReadyToStart(task) && !!statuses.find(s => s.Id === task.StatusId && s.IsNew === 1);
                const dependentTasks = prerequisites.filter(p => p.PrerequisiteTaskId === task.Id);
                const isPrerequisite = dependentTasks.length > 0 && task.IsComplete !== 1;

                return (
                  <tr key={task.Id}>
                    <td className="text-muted small fw-bold">{project.Prefix}-{task.DisplayId}</td>
                    <td className="text-truncate">
                      <Link to={`/task/${task.Id}`} className="text-decoration-none text-dark">
                        <strong>{task.Title}</strong>
                      </Link>
                      {task.ParentId && (
                        <div className="small text-muted mt-1">
                          <i className="fas fa-level-up-alt fa-rotate-90 me-1"></i>
                          Subtask of: <Link to={`/task/${task.ParentId}`} className="text-decoration-none">{task.ParentTitle || `Task #${task.ParentId}`}</Link>
                        </div>
                      )}
                      <div className="mt-1">
                        {notReady && (
                          <span className="badge bg-warning text-dark me-2 fw-normal small">
                            <i className="fas fa-pause-circle me-1"></i>Not Ready
                          </span>
                        )}
                        {isPrerequisite && (
                          <span className="badge bg-info text-dark fw-normal small">
                            <i className="fas fa-link me-1"></i>
                            Prerequisite for: {dependentTasks.length}
                          </span>
                        )}                      </div>
                    </td>
                    <td>                      {task.AssigneeName ? (
                        <span className="badge bg-info text-dark fw-normal d-inline-block text-truncate" style={{ maxWidth: '200px' }}>{task.AssigneeName}</span>
                      ) : (
                        <span className="text-muted small italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {task.StatusLabel ? (
                        <span className={`badge ${task.IsComplete ? 'bg-success' : 'bg-primary'} fw-normal d-inline-block text-truncate`}>
                          {task.StatusLabel}
                        </span>
                      ) : (
                        <span className="text-muted small italic">No status</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

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

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-1">
                <i className="fas fa-folder-open text-primary me-3 fa-2x"></i>
                <h2 className="card-title mb-0">
                  {project.Title}
                </h2>
                <span className="badge bg-light text-dark border ms-3">{project.Prefix}</span>
              </div>
              <div className="text-muted small ms-5 d-flex gap-4">
                <span>
                  <i className="fas fa-user me-2 text-info"></i>
                  <strong>Owner:</strong> {people.find(p => p.Id === project.OwnerId)?.Name || 'Not assigned'}
                </span>
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
            
            <div className="d-flex justify-content-between align-items-center mb-4 pt-3 border-top">
              <h4 className="mb-0">Tasks</h4>
              <button 
                className="btn btn-primary no-drag"
                onClick={() => setShowAddTaskModal(true)}
              >
                <i className="fas fa-plus me-1"></i> Add Task
              </button>
            </div>

            <TaskTable tasks={tasks} />
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Task</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowAddTaskModal(false)}></button>
                </div>
                <form onSubmit={handleAddTask}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="taskTitle" className="form-label">Task Title</label>
                      <input
                        type="text"
                        className="form-control no-drag"
                        id="taskTitle"
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="taskDescription" className="form-label">Description</label>
                      <textarea
                        className="form-control no-drag"
                        id="taskDescription"
                        rows={3}
                        placeholder="Add more details..."
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="taskAssignee" className="form-label">Assignee</label>
                        <select
                          className="form-select no-drag"
                          id="taskAssignee"
                          value={newTaskAssigneeId}
                          onChange={(e) => setNewTaskAssigneeId(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                          <option value="">Unassigned</option>
                          {people.map((person) => (
                            <option key={person.Id} value={person.Id}>
                              {person.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="taskStatus" className="form-label">Status</label>
                        <select
                          className="form-select no-drag"
                          id="taskStatus"
                          value={newTaskStatusId}
                          onChange={(e) => setNewTaskStatusId(Number(e.target.value))}
                          required
                        >
                          {statuses.map((status) => (
                            <option key={status.Id} value={status.Id}>
                              {status.Label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary no-drag" disabled={isCreatingTask}>
                      {isCreatingTask ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : 'Add Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

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
                    <div className="row g-3">
                      <div className="col-md-9 mb-3">
                        <label htmlFor="projectTitle" className="form-label">Project Title</label>
                        <input
                          type="text"
                          className="form-control no-drag"
                          id="projectTitle"
                          placeholder="Enter project name"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label htmlFor="projectPrefix" className="form-label">Prefix</label>
                        <input
                          type="text"
                          className="form-control no-drag text-uppercase"
                          id="projectPrefix"
                          placeholder="ABC"
                          value={editPrefix}
                          onChange={(e) => setEditPrefix(e.target.value.substring(0, 5))}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editOwner" className="form-label">Project Owner</label>
                      <select
                        className="form-select no-drag"
                        id="editOwner"
                        value={editOwnerId}
                        onChange={(e) => setEditOwnerId(e.target.value === '' ? '' : Number(e.target.value))}
                      >
                        <option value="">No owner assigned</option>
                        {people.map((person) => (
                          <option key={person.Id} value={person.Id}>
                            {person.Name}
                          </option>
                        ))}
                      </select>
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
