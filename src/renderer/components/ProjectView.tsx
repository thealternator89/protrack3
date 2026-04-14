import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Person, Task, TaskPrerequisite, Status, TaskSource } from '../types';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prerequisites, setPrerequisites] = useState<TaskPrerequisite[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [taskSources, setTaskSources] = useState<TaskSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal & Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editOwnerId, setEditOwnerId] = useState<number | ''>('');
  const [editTaskSourceId, setEditTaskSourceId] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | ''>('');
  const [newTaskStatusId, setNewTaskStatusId] = useState<number | ''>('');
  const [newTaskParentId, setNewTaskParentId] = useState<number | ''>('');
  const [newTaskRemoteId, setNewTaskRemoteId] = useState<number | ''>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Import Task Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTaskIds, setImportTaskIds] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [projectData, peopleData, taskData, statusData, taskSourcesData] = await Promise.all([
        window.projects.get(Number(id)),
        window.people.getAll(),
        window.tasks.getByProject(Number(id)),
        window.statuses.getAll(),
        window.taskSources.getAll()
      ]);
      setProject(projectData);
      setPeople(peopleData);
      setTasks(taskData.tasks);
      setPrerequisites(taskData.prerequisites);
      setStatuses(statusData);
      setTaskSources(taskSourcesData);
      
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
        setEditTaskSourceId(projectData.TaskSourceId || '');
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
        taskSourceId: editTaskSourceId === '' ? undefined : editTaskSourceId,
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
      
      const siblingTasks = tasks.filter(t => 
        newTaskParentId === '' ? (t.ParentId === null || t.ParentId === undefined) : t.ParentId === newTaskParentId
      );
      const nextSortOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.SortOrder)) + 10 : 10;

      await window.tasks.create({
        displayId: nextDisplayId,
        title: newTaskTitle.trim(),
        projectId: Number(id),
        sortOrder: nextSortOrder,
        description: newTaskDescription.trim() || undefined,
        assigneeId: newTaskAssigneeId === '' ? undefined : newTaskAssigneeId,
        statusId: newTaskStatusId === '' ? undefined : (newTaskStatusId as number),
        parentId: newTaskParentId === '' ? undefined : newTaskParentId,
        remoteTaskId: newTaskRemoteId === '' ? undefined : (newTaskRemoteId as number),
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssigneeId('');
      setNewTaskParentId('');
      setNewTaskRemoteId('');
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

  const handleImportTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !project.TaskSourceId || !importTaskIds.trim()) return;
  
    setIsImporting(true);
    try {
      await window.tasks.importFromSource(project.Id, project.TaskSourceId, importTaskIds.trim());
      setImportTaskIds('');
      setShowImportModal(false);
      await fetchData(); // Refresh tasks after import
      alert('Tasks imported successfully!');
    } catch (error) {
      console.error('Failed to import tasks:', error);
      alert(`Error importing tasks: ${error.message || 'An unknown error occurred.'}`);
    } finally {
      setIsImporting(false);
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

  const openAddTaskModal = (parentId: number | '' = '') => {
    setNewTaskParentId(parentId);
    setShowAddTaskModal(true);
  };

  const TaskTable = ({ tasks }: { tasks: Task[] }) => {
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dropTargetId, setDropTargetId] = useState<number | null>(null);

    const flattenedTasks = useMemo(() => {
      const result: (Task & { depth: number })[] = [];
      
      const flatten = (parentId: number | null = null, depth = 0) => {
        const children = tasks
          .filter(t => t.ParentId === parentId)
          .sort((a, b) => a.SortOrder - b.SortOrder);
          
        for (const child of children) {
          result.push({ ...child, depth });
          flatten(child.Id, depth + 1);
        }
      };
      
      flatten(null, 0);
      return result;
    }, [tasks]);

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.setData('taskId', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetTask: Task) => {
      const draggedTask = tasks.find(t => t.Id === draggedTaskId);
      if (draggedTask && draggedTask.ParentId === targetTask.ParentId && draggedTask.Id !== targetTask.Id) {
        e.preventDefault();
        setDropTargetId(targetTask.Id);
      }
    };

    const handleDrop = async (e: React.DragEvent, targetTask: Task) => {
      e.preventDefault();
      if (draggedTaskId === null || draggedTaskId === targetTask.Id) return;

      const draggedTask = tasks.find(t => t.Id === draggedTaskId);
      if (!draggedTask || draggedTask.ParentId !== targetTask.ParentId) return;

      // Get siblings in current order
      const siblings = tasks
        .filter(t => t.ParentId === draggedTask.ParentId)
        .sort((a, b) => a.SortOrder - b.SortOrder);

      const oldIndex = siblings.findIndex(t => t.Id === draggedTaskId);
      const newIndex = siblings.findIndex(t => t.Id === targetTask.Id);

      const newSiblings = [...siblings];
      newSiblings.splice(oldIndex, 1);
      newSiblings.splice(newIndex, 0, draggedTask);

      // Create update payload
      const updates = newSiblings.map((t, index) => ({
        id: t.Id,
        sortOrder: (index + 1) * 10
      }));

      try {
        await window.tasks.updateSortOrders(updates);
        await fetchData();
      } catch (error) {
        console.error('Failed to update task order:', error);
      } finally {
        setDraggedTaskId(null);
        setDropTargetId(null);
      }
    };

    const handleDragEnd = () => {
      setDraggedTaskId(null);
      setDropTargetId(null);
    };

    return (
      <div className="mb-5">
        {flattenedTasks.length === 0 ? (
          <div className="alert alert-light border text-center py-4">
            No tasks found for this project.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle border shadow-sm rounded" style={{ tableLayout: 'fixed' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Title</th>
                  <th style={{ width: '150px' }}>Assignee</th>
                  <th style={{ width: '150px' }}>Status</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {flattenedTasks.map(task => {
                  const notReady = !isReadyToStart(task) && !!statuses.find(s => s.Id === task.StatusId && s.IsNew === 1);
                  const dependentTasks = prerequisites.filter(p => p.PrerequisiteTaskId === task.Id);
                  const isPrerequisite = dependentTasks.length > 0 && task.IsComplete !== 1;
                  const isDragged = draggedTaskId === task.Id;
                  const isDropTarget = dropTargetId === task.Id;

                  return (
                    <tr 
                      key={task.Id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.Id)}
                      onDragOver={(e) => handleDragOver(e, task)}
                      onDrop={(e) => handleDrop(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'table-primary border-primary' : ''}`}
                      style={{ cursor: 'grab' }}
                    >
                      <td className="text-center">
                        <i className="fas fa-grip-vertical text-muted"></i>
                      </td>
                      <td className="text-muted small fw-bold">{project.Prefix}-{task.DisplayId}</td>
                      <td className="text-truncate" style={{ paddingLeft: `${task.depth * 24 + 12}px` }}>
                        <div className="d-flex align-items-center">
                          {task.depth > 0 && (
                            <i className="fas fa-level-up-alt fa-rotate-90 text-muted me-2 small"></i>
                          )}
                          <Link to={`/task/${task.Id}`} className="text-decoration-none text-dark">
                            <strong>{task.Title}</strong>
                          </Link>
                        </div>
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
                          )}
                        </div>
                      </td>
                      <td>
                        {task.AssigneeName ? (
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
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-primary no-drag"
                          onClick={() => openAddTaskModal(task.Id)}
                          title="Add Subtask"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
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
  };

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
              <div className="d-flex gap-2">
                {project.TaskSourceId && (
                  <button
                    className="btn btn-outline-primary no-drag"
                    onClick={() => setShowImportModal(true)}
                  >
                    <i className="fas fa-file-import me-1"></i> Import Tasks
                  </button>
                )}
                <button 
                  className="btn btn-primary no-drag"
                  onClick={() => openAddTaskModal()}
                >
                  <i className="fas fa-plus me-1"></i> Add Task
                </button>
              </div>
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
                  <h5 className="modal-title">
                    {newTaskParentId ? 'Add Subtask' : 'Add New Task'}
                  </h5>
                  <button type="button" className="btn-close no-drag" onClick={() => {
                    setShowAddTaskModal(false);
                    setNewTaskParentId('');
                  }}></button>
                </div>
                <form onSubmit={handleAddTask}>
                  <div className="modal-body">
                    {newTaskParentId && (
                      <div className="mb-3">
                        <label className="form-label text-muted small text-uppercase fw-bold">Parent Task</label>
                        <div className="p-2 bg-light border rounded">
                          {tasks.find(t => t.Id === newTaskParentId)?.Title || `Task #${newTaskParentId}`}
                        </div>
                      </div>
                    )}
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
                      <div className="col-md-6 mb-3">
                        <label htmlFor="remoteTaskId" className="form-label">Remote Task ID</label>
                        <input
                          type="number"
                          className="form-control no-drag"
                          id="remoteTaskId"
                          placeholder="External ID"
                          value={newTaskRemoteId}
                          onChange={(e) => setNewTaskRemoteId(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!project.TaskSourceId}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => {
                      setShowAddTaskModal(false);
                      setNewTaskParentId('');
                    }}>Cancel</button>
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
                    <div className="row g-3">
                      <div className="col-md-6 mb-3">
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
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editTaskSource" className="form-label">Task Source</label>
                        <select
                          className="form-select no-drag"
                          id="editTaskSource"
                          value={editTaskSourceId}
                          onChange={(e) => setEditTaskSourceId(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                          <option value="">No task source</option>
                          {taskSources.map((source) => (
                            <option key={source.Id} value={source.Id}>
                              {source.Name} ({source.Type})
                            </option>
                          ))}
                        </select>
                      </div>
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

      {/* Import Tasks Modal */}
      {showImportModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Import Tasks from Source</h5>
                  <button type="button" className="btn-close no-drag" onClick={() => setShowImportModal(false)}></button>
                </div>
                <form onSubmit={handleImportTasks}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="importTaskIds" className="form-label">Comma-separated Azure DevOps Work Item IDs</label>
                      <textarea
                        className="form-control no-drag"
                        id="importTaskIds"
                        rows={5}
                        placeholder="e.g., 123, 456, 789"
                        value={importTaskIds}
                        onChange={(e) => setImportTaskIds(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowImportModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary no-drag" disabled={isImporting}>
                      {isImporting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Importing...
                        </>
                      ) : 'Import Tasks'}
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


