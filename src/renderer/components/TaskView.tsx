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
  const [isSyncing, setIsSyncing] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSavedNotes, setLastSavedNotes] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Delete confirmation state
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      const data = await window.tasks.get(Number(id));
      if (data && data.task) {
        setTask(data.task);
        setInternalNotes(data.task.InternalNotes || '');
        setLastSavedNotes(data.task.InternalNotes || '');
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
      effort: data.effort,
    });
    await fetchData();
  };

  const handleSync = async () => {
    if (!task || !project?.TaskSourceId || !task.RemoteTaskId || isSyncing) return;

    setIsSyncing(true);
    try {
      await window.tasks.importFromSource(project.Id, project.TaskSourceId, task.RemoteTaskId.toString());
      await fetchData();
    } catch (error) {
      console.error('Failed to sync task:', error);
      alert('Failed to sync task from source.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInternalNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalNotes(newValue);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSavingNotes(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!id || !task) return;
      try {
        await window.tasks.updateInternalNotes(Number(id), newValue);
        setLastSavedNotes(newValue);
      } catch (error) {
        console.error('Failed to autosave notes:', error);
      } finally {
        setIsSavingNotes(false);
      }
    }, 1000);
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

  const getTaskEffort = (targetTask: Task) => {
    const children = projectTasks.filter(t => t.ParentId === targetTask.Id);
    const manualValue = targetTask.Effort !== undefined && targetTask.Effort !== null ? targetTask.Effort : null;
    const isManualSet = manualValue !== null;

    const calculateRecursive = (t: Task): { sum: number, hasEstimation: boolean } => {
      // If task has its own defined effort, that's what it contributes to its parent
      if (t.Effort !== null && t.Effort !== undefined) {
        return { sum: t.Effort, hasEstimation: true };
      }
      // Otherwise, sum of its children's contributions
      const childTasks = projectTasks.filter(ct => ct.ParentId === t.Id);
      if (childTasks.length === 0) return { sum: 0, hasEstimation: false };
      
      let childSum = 0;
      let childHasEstimation = false;
      childTasks.forEach(ct => {
        const res = calculateRecursive(ct);
        childSum += res.sum;
        if (res.hasEstimation) childHasEstimation = true;
      });
      return { sum: childSum, hasEstimation: childHasEstimation };
    };

    if (children.length === 0) {
      return { 
        effectiveValue: manualValue,
        manualValue,
        calculatedValue: null,
        hasChildrenEstimation: false,
        type: isManualSet ? 'manual' : 'none' 
      };
    }

    let childSum = 0;
    let hasChildrenEstimation = false;
    children.forEach(child => {
      const res = calculateRecursive(child);
      childSum += res.sum;
      if (res.hasEstimation) hasChildrenEstimation = true;
    });

    const effectiveValue = isManualSet ? manualValue : childSum;

    if (!isManualSet) {
      return { 
        effectiveValue, 
        manualValue: null,
        calculatedValue: childSum,
        hasChildrenEstimation,
        type: effectiveValue > 0 ? 'calculated' : 'none' 
      };
    }

    // Manual effort is set.
    if (!hasChildrenEstimation || childSum === 0) {
      return { effectiveValue, manualValue, calculatedValue: childSum, hasChildrenEstimation: false, type: 'manual' };
    }

    if (manualValue > childSum) {
      return { effectiveValue, manualValue, calculatedValue: childSum, type: 'manual-higher' };
    } else if (manualValue === childSum) {
      return { effectiveValue, manualValue, calculatedValue: childSum, type: 'manual-equal' };
    } else {
      return { effectiveValue, manualValue, calculatedValue: childSum, type: 'calculated-higher' };
    }
  };

  const childTasks = useMemo(() => {
    return projectTasks.filter(t => t.ParentId === task?.Id);
  }, [projectTasks, task]);

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
    <div className="main-content">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          {project ? (
            <button className="btn btn-link p-0 text-decoration-none no-drag" onClick={() => navigate(`/project/${project.Id}`)}>
              <i className="fas fa-arrow-left me-2"></i>Back to {project.Title}
            </button>
          ) : (
            <button className="btn btn-link p-0 text-decoration-none no-drag" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left me-2"></i>Back
            </button>
          )}
          <div className="d-flex gap-2">
            {remoteUrl && (
              <>
                <button 
                  className="btn btn-outline-info no-drag"
                  onClick={() => window.electronAPI.openExternal(remoteUrl)}
                  title="View in External Source"
                >
                  <i className="fas fa-external-link-alt me-1"></i> View
                </button>
                <button 
                  className="btn btn-outline-success no-drag"
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="Sync with External Source"
                >
                  {isSyncing ? (
                    <ButtonSpinner label="Syncing..." />
                  ) : (
                    <><i className="fas fa-sync-alt me-1"></i> Sync</>
                  )}
                </button>
              </>
            )}
            <button 
              className="btn btn-outline-primary no-drag"
              onClick={() => setShowEditTaskModal(true)}
            >
              <i className="fas fa-edit me-1"></i> Edit Task
            </button>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-1">
                <span className="badge bg-light text-dark border me-3 fs-6 py-2">
                  {project ? `${project.Prefix}-${task.DisplayId}` : `Task #${task.Id}`}
                </span>
                <h3 className="card-title mb-0 fw-bold">
                  {task.Title}
                </h3>
              </div>
            </div>

            <div className="row mb-4 pt-3 border-top">
              <div className="col-md-3">
                <label className="text-muted small text-uppercase fw-bold mb-1">Assignee</label>
                <div>
                  {task.AssigneeId ? (() => {
                    const person = people.find(p => p.Id === task.AssigneeId);
                    const colorClass = person?.Color ? `text-${person.Color}` : 'text-info';
                    return (
                      <div className="d-flex align-items-center fs-6">
                        <i className={`fas fa-user me-2 w-16 text-center ${colorClass}`}></i>
                        {task.AssigneeName}
                      </div>
                    );
                  })() : (
                    <span className="text-muted italic">Unassigned</span>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <label className="text-muted small text-uppercase fw-bold mb-1">Status</label>
                <div>
                  {task.StatusLabel && (() => {
                    const status = statuses.find(s => s.Id === task.StatusId);
                    const isNew = !!status?.IsNew;
                    const ready = prerequisites.every(p => p.PrerequisiteIsComplete === 1 || p.Type === 'End');
                    const isPrerequisite = dependedOnBy.length > 0 && !task.IsComplete;
                    
                    let color = 'secondary';
                    if (task.IsComplete) {
                      color = 'success';
                    } else if (isNew) {
                      color = ready ? 'info' : 'danger';
                    }

                    return (
                      <span className={`badge rounded-pill bg-${color} fs-6 fw-normal`}>
                        {!ready && prerequisites.length > 0 && <i className="fas fa-exclamation-triangle me-1" title={`Blocked by ${prerequisites.filter(p => p.PrerequisiteIsComplete !== 1 && p.Type !== 'End').length} prerequisite(s)`}></i>}
                        {isPrerequisite && <i className="fas fa-link me-1" title={`Prerequisite for ${dependedOnBy.length} task(s)`}></i>}
                        {task.StatusLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="col-md-3">
                <label className="text-muted small text-uppercase fw-bold mb-1">Effort</label>
                <div>
                  {(() => {
                    const effortInfo = getTaskEffort(task);
                    if (effortInfo.type === 'none') return <span className="text-muted italic">Unestimated</span>;
                    return (
                      <div className="d-flex flex-column gap-1">
                        <span className={`badge rounded-pill bg-light text-dark border fs-6 fw-normal d-inline-block`} style={{ width: 'fit-content' }}>
                          {effortInfo.type === 'calculated' && <i className="fas fa-calculator me-1 text-muted" title="Sum of subtasks"></i>}
                          {effortInfo.type === 'manual-higher' && <i className="fas fa-arrow-up me-1 text-warning" title="Manual override (higher than subtasks)"></i>}
                          {effortInfo.type === 'manual-equal' && <i className="fas fa-equals me-1 text-muted" title="Manual estimate matches subtask total (consider removing manual estimate)"></i>}
                          {effortInfo.type === 'calculated-higher' && <i className="fas fa-arrow-down me-1 text-info" title="Subtask sum is higher than manual estimate"></i>}
                          {effortInfo.effectiveValue} days
                        </span>
                        {effortInfo.manualValue !== null && (effortInfo.calculatedValue || 0) > 0 && (
                          <div className="text-muted small ms-2">
                            <span>Subtasks: {effortInfo.calculatedValue} days</span>
                            {effortInfo.type === 'manual-equal' && (
                              <span className="ms-1 text-success small">(Matches)</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="col-md-3">
                <label className="text-muted small text-uppercase fw-bold mb-1">Parent Task</label>
                <div>
                  {task.ParentId ? (
                    <Link to={`/task/${task.ParentId}`} className="text-decoration-none fw-bold">
                      {task.ParentTitle || `Task #${task.ParentId}`}
                    </Link>
                  ) : (
                    <span className="text-muted italic">None</span>
                  )}
                </div>
              </div>
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

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="text-muted small text-uppercase fw-bold mb-0">Internal Notes</label>
                  {isSavingNotes ? (
                    <span className="text-muted small italic"><i className="fas fa-spinner fa-spin me-1"></i> Saving...</span>
                  ) : (
                    internalNotes !== lastSavedNotes && <span className="text-muted small italic">Unsaved changes</span>
                  )}
                </div>
                <textarea
                  className="form-control no-drag bg-white"
                  rows={4}
                  placeholder="Add private notes, implementation details, etc. (Autosaves)"
                  value={internalNotes}
                  onChange={handleInternalNotesChange}
                  style={{ borderStyle: 'dashed' }}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0">Prerequisites</h4>
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
                <div className="list-group shadow-sm mb-4">
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
                <div className="text-muted italic p-2 border rounded bg-light small mb-4">
                  No prerequisites defined for this task.
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0">Child Tasks</h4>
              </div>

              {childTasks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle border shadow-sm rounded" style={{ tableLayout: 'fixed' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Title</th>
                        <th style={{ width: '100px' }} className="text-center">Effort</th>
                        <th style={{ width: '150px' }}>Assignee</th>
                        <th style={{ width: '150px' }} className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childTasks.map(child => {
                        const effortInfo = getTaskEffort(child);
                        return (
                          <tr key={child.Id}>
                            <td className="text-muted small fw-bold">
                              {project ? `${project.Prefix}-${child.DisplayId}` : child.DisplayId}
                            </td>
                            <td className="text-truncate">
                              <Link to={`/task/${child.Id}`} className="text-decoration-none text-dark">
                                <strong>{child.Title}</strong>
                              </Link>
                            </td>
                            <td className="text-center">
                              {effortInfo.type === 'none' ? (
                                <span className="text-muted small">-</span>
                              ) : (
                                <span className="badge rounded-pill bg-light text-dark border fw-normal">
                                  {effortInfo.type === 'calculated' && <i className="fas fa-calculator me-1 text-muted" title="Sum of subtasks"></i>}
                                  {effortInfo.type === 'manual-higher' && <i className="fas fa-arrow-up me-1 text-warning" title="Manual override (higher than subtasks)"></i>}
                                  {effortInfo.type === 'manual-equal' && <i className="fas fa-equals me-1 text-muted" title="Manual estimate matches subtask total (consider removing manual estimate)"></i>}
                                  {effortInfo.type === 'calculated-higher' && <i className="fas fa-arrow-down me-1 text-info" title="Subtask sum is higher than manual estimate"></i>}
                                  {effortInfo.effectiveValue}d
                                </span>
                              )}
                            </td>
                            <td>
                              {child.AssigneeId ? (() => {
                                const person = people.find(p => p.Id === child.AssigneeId);
                                const color = person?.Color || 'info';
                                const textColor = ['warning', 'light', 'info'].includes(color) ? 'text-dark' : 'text-white';
                                return (
                                  <span className={`badge bg-${color} ${textColor} fw-normal d-inline-block text-truncate`} style={{ maxWidth: '200px' }}>
                                    {child.AssigneeName}
                                  </span>
                                );
                              })() : (
                                <span className="text-muted small italic">Unassigned</span>
                              )}
                            </td>
                            <td className="text-center">
                              {child.StatusLabel ? (() => {
                                const status = statuses.find(s => s.Id === child.StatusId);
                                const isNew = !!status?.IsNew;
                                
                                let color = 'secondary';
                                if (child.IsComplete) {
                                  color = 'success';
                                } else if (isNew) {
                                  color = 'info';
                                }

                                return (
                                  <span className={`badge rounded-pill bg-${color} fw-normal d-inline-block text-truncate`}>
                                    {child.StatusLabel}
                                  </span>
                                );
                              })() : (
                                <span className="text-muted small italic">No status</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted italic p-2 border rounded bg-light small">
                  No child tasks for this task.
                </div>
              )}
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
