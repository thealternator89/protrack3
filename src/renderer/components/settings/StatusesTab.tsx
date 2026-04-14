import React, { useEffect, useState } from 'react';
import { Status } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const StatusesTab: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const fetchStatuses = async () => {
    setIsLoading(true);
    try {
      const data = await window.statuses.getAll();
      setStatuses(data);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await window.statuses.update({ id: isEditing, label, isNew, isComplete });
      } else {
        await window.statuses.create({ label, isNew, isComplete });
      }
      resetForm();
      await fetchStatuses();
    } catch (error) {
      console.error('Error saving status:', error);
      alert('Failed to save status.');
    }
  };

  const handleEdit = (status: Status) => {
    setIsEditing(status.Id);
    setLabel(status.Label);
    setIsNew(status.IsNew === 1);
    setIsComplete(status.IsComplete === 1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this status?')) return;
    try {
      await window.statuses.delete(id);
      await fetchStatuses();
    } catch (error) {
      console.error('Error deleting status:', error);
      alert('Failed to delete status. It may be in use by tasks.');
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setLabel('');
    setIsNew(false);
    setIsComplete(false);
  };

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">{isEditing ? 'Edit Status' : 'Add New Status'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-control no-drag" 
                value={label} 
                onChange={(e) => setLabel(e.target.value)} 
                placeholder="e.g. To Do, In Progress, Done"
                required 
              />
            </div>
            <div className="col-md-2 d-flex align-items-center mb-2">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input no-drag" 
                  type="checkbox" 
                  id="isNewSwitch"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                />
                <label className="form-check-label ms-2" htmlFor="isNewSwitch">
                  New Status
                </label>
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-center mb-2">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input no-drag" 
                  type="checkbox" 
                  id="isCompleteSwitch"
                  checked={isComplete}
                  onChange={(e) => setIsComplete(e.target.checked)}
                />
                <label className="form-check-label ms-2" htmlFor="isCompleteSwitch">
                  Complete Status
                </label>
              </div>
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1 no-drag">
                {isEditing ? 'Update' : 'Add'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-secondary no-drag" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Status Label</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((status) => (
                <tr key={status.Id}>
                  <td className="fw-bold">
                    {status.Label}
                    <span className="ms-2">
                      {status.IsNew === 1 ? (
                        <span className="badge bg-info text-dark">
                          <i className="fas fa-plus-circle me-1"></i> New
                        </span>
                      ) : status.IsComplete === 1 ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check-circle me-1"></i> Completed
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <i className="fas fa-times-circle me-1"></i> Incomplete
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      className="btn btn-sm btn-outline-primary me-2 no-drag"
                      onClick={() => handleEdit(status)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger no-drag"
                      onClick={() => handleDelete(status.Id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center p-4 text-muted">
                    No statuses configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatusesTab;
