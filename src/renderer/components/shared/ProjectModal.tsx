import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ButtonSpinner } from './LoadingSpinner';
import { Person, TaskSource, Project } from '../../types';

export interface ProjectFormData {
  title: string;
  prefix: string;
  startDate?: string;
  dueDate?: string;
  ownerId?: number;
  taskSourceId?: number;
}

interface ProjectModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => Promise<void>;
  initialData?: Project | null;
  people: Person[];
  taskSources: TaskSource[];
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  show, onClose, onSave, initialData, people, taskSources
}) => {
  const isEdit = !!initialData;
  const [title, setTitle] = useState('');
  const [prefix, setPrefix] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [taskSourceId, setTaskSourceId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      if (initialData) {
        setTitle(initialData.Title || '');
        setPrefix(initialData.Prefix || '');
        setStartDate(initialData.StartDate || '');
        setDueDate(initialData.DueDate || '');
        setOwnerId(initialData.OwnerId || '');
        setTaskSourceId(initialData.TaskSourceId || '');
      } else {
        setTitle('');
        setPrefix('');
        setStartDate('');
        setDueDate('');
        setOwnerId('');
        setTaskSourceId('');
      }
      setIsSubmitting(false);
    }
  }, [show, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prefix.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        prefix: prefix.toUpperCase(),
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        ownerId: ownerId === '' ? undefined : ownerId,
        taskSourceId: taskSourceId === '' ? undefined : taskSourceId,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Error saving project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      title={isEdit ? 'Edit Project' : 'Create New Project'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      footer={
        <>
          <button type="button" className="btn btn-secondary no-drag" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary no-drag" disabled={isSubmitting}>
            {isSubmitting ? <ButtonSpinner label={isEdit ? "Updating..." : "Creating..."} /> : (isEdit ? 'Save Changes' : 'Create Project')}
          </button>
        </>
      }
    >
      <div className="row g-3">
        <div className="col-md-9 mb-3">
          <label htmlFor="projectTitle" className="form-label">Project Title</label>
          <input
            type="text"
            className="form-control no-drag"
            id="projectTitle"
            placeholder="Enter project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus={!isEdit}
          />
        </div>
        <div className="col-md-3 mb-3">
          <label htmlFor="projectPrefix" className="form-label">Prefix</label>
          <input
            type="text"
            className="form-control no-drag text-uppercase"
            id="projectPrefix"
            placeholder="ABC"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.substring(0, 5))}
            required
          />
        </div>
      </div>
      <div className="row g-3">
        <div className="col-md-6 mb-3">
          <label htmlFor="projectOwner" className="form-label">Project Owner</label>
          <select
            className="form-select no-drag"
            id="projectOwner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value === '' ? '' : Number(e.target.value))}
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
          <label htmlFor="taskSource" className="form-label">Task Source</label>
          <select
            className="form-select no-drag"
            id="taskSource"
            value={taskSourceId}
            onChange={(e) => setTaskSourceId(e.target.value === '' ? '' : Number(e.target.value))}
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="dueDate" className="form-label">Due Date</label>
          <input
            type="date"
            className="form-control no-drag"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ProjectModal;
