import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { ButtonSpinner } from './LoadingSpinner';
import { Task, Person, Status, Project } from '../../types';

export interface TaskFormData {
  title: string;
  description?: string;
  assigneeId?: number;
  statusId?: number;
  parentId?: number;
  remoteTaskId?: number;
}

interface TaskModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  initialData?: Task | null;
  initialParentId?: number | '';
  project: Project;
  people: Person[];
  statuses: Status[];
  projectTasks: Task[];
}

const TaskModal: React.FC<TaskModalProps> = ({
  show, 
  onClose, 
  onSave, 
  initialData, 
  initialParentId = '', 
  project, 
  people, 
  statuses, 
  projectTasks
}) => {
  const isEdit = !!initialData;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [parentId, setParentId] = useState<number | ''>('');
  const [remoteTaskId, setRemoteTaskId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate descendant IDs to prevent circular parent assignments
  const descendantIds = useMemo(() => {
    if (!initialData || projectTasks.length === 0) return new Set<number>();
    
    const ids = new Set<number>();
    const findChildren = (pId: number) => {
      projectTasks.forEach(t => {
        if (t.ParentId === pId) {
          ids.add(t.Id);
          findChildren(t.Id);
        }
      });
    };
    
    findChildren(initialData.Id);
    return ids;
  }, [initialData, projectTasks]);

  useEffect(() => {
    if (show) {
      if (initialData) {
        setTitle(initialData.Title || '');
        setDescription(initialData.Description || '');
        setAssigneeId(initialData.AssigneeId || '');
        setStatusId(initialData.StatusId || '');
        setParentId(initialData.ParentId || '');
        setRemoteTaskId(initialData.RemoteTaskId || '');
      } else {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        // Set default status to "New" if creating
        const newStatus = statuses.find(s => s.IsNew === 1) || (statuses.length > 0 ? statuses[0] : null);
        setStatusId(newStatus ? newStatus.Id : '');
        setParentId(initialParentId);
        setRemoteTaskId('');
      }
      setIsSubmitting(false);
    }
  }, [show, initialData, initialParentId, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: assigneeId === '' ? undefined : assigneeId,
        statusId: statusId === '' ? undefined : (statusId as number),
        parentId: parentId === '' ? undefined : parentId,
        remoteTaskId: remoteTaskId === '' ? undefined : (remoteTaskId as number),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Error saving task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      title={isEdit ? 'Edit Task' : (parentId ? 'Add Subtask' : 'Add New Task')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      footer={
        <>
          <button type="button" className="btn btn-secondary no-drag" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary no-drag" disabled={isSubmitting}>
            {isSubmitting ? <ButtonSpinner label={isEdit ? "Updating..." : "Creating..."} /> : (isEdit ? 'Save Changes' : 'Add Task')}
          </button>
        </>
      }
    >
      <div className="mb-3">
        <label htmlFor="taskTitle" className="form-label">Task Title</label>
        <input
          type="text"
          className="form-control no-drag"
          id="taskTitle"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={!isEdit}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="taskDescription" className="form-label">Description</label>
        <textarea
          className="form-control no-drag"
          id="taskDescription"
          rows={3}
          placeholder="Add more details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="taskAssignee" className="form-label">Assignee</label>
          <select
            className="form-select no-drag"
            id="taskAssignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value === '' ? '' : Number(e.target.value))}
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
            value={statusId}
            onChange={(e) => setStatusId(Number(e.target.value))}
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
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="taskParent" className="form-label">Parent Task</label>
          <select
            className="form-select no-drag"
            id="taskParent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">No Parent</option>
            {projectTasks
              .filter(t => !initialData || (t.Id !== initialData.Id && !descendantIds.has(t.Id)))
              .map((t) => (
                <option key={t.Id} value={t.Id}>
                  {project.Prefix}-{t.DisplayId}: {t.Title}
                </option>
              ))
            }
          </select>
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="remoteTaskId" className="form-label">Remote Task ID</label>
          <input
            type="number"
            className="form-control no-drag"
            id="remoteTaskId"
            placeholder="External ID"
            value={remoteTaskId}
            onChange={(e) => setRemoteTaskId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!project.TaskSourceId}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;
