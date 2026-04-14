import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Person, Task, TaskPrerequisite, Status, TaskSource } from '../types';
import Modal from './shared/Modal';
import LoadingSpinner, { ButtonSpinner } from './shared/LoadingSpinner';
import ProjectModal, { ProjectFormData } from './shared/ProjectModal';
import TaskModal, { TaskFormData } from './shared/TaskModal';

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

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskParentId, setNewTaskParentId] = useState<number | ''>('');

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
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!project) return;
    await window.projects.update({
      id: project.Id,
      title: data.title,
      prefix: data.prefix,
      startDate: data.startDate,
      dueDate: data.dueDate,
      ownerId: data.ownerId,
      taskSourceId: data.taskSourceId,
    });
    await fetchData();
  };

  const handleAddTask = async (data: TaskFormData) => {
    if (!id) return;
    const nextDisplayId = tasks.length > 0 ? Math.max(...tasks.map(t => t.DisplayId)) + 1 : 1;
    
    const siblingTasks = tasks.filter(t => 
      data.parentId === undefined ? (t.ParentId === null || t.ParentId === undefined) : t.ParentId === data.parentId
    );
    const nextSortOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.SortOrder)) + 10 : 10;

    await window.tasks.create({
      displayId: nextDisplayId,
      title: data.title,
      projectId: Number(id),
      sortOrder: nextSortOrder,
      description: data.description,
      assigneeId: data.assigneeId,
      statusId: data.statusId,
      parentId: data.parentId,
      remoteTaskId: data.remoteTaskId,
    });
    await fetchData();
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
      <div className="main-content">
        <LoadingSpinner className="mt-5" />
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

      <TaskModal
        show={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setNewTaskParentId('');
        }}
        onSave={handleAddTask}
        initialParentId={newTaskParentId}
        project={project}
        people={people}
        statuses={statuses}
        projectTasks={tasks}
      />

      <ProjectModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateProject}
        initialData={project}
        people={people}
        taskSources={taskSources}
      />

      <Modal
        show={showImportModal}
        title="Import Tasks from Source"
        onClose={() => setShowImportModal(false)}
        onSubmit={handleImportTasks}
        isSubmitting={isImporting}
        footer={
          <>
            <button type="button" className="btn btn-secondary no-drag" onClick={() => setShowImportModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary no-drag" disabled={isImporting}>
              {isImporting ? <ButtonSpinner label="Importing..." /> : 'Import Tasks'}
            </button>
          </>
        }
      >
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
      </Modal>
    </div>
  );
};

export default ProjectView;


