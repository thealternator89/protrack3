import React, { useEffect, useState } from 'react';
import { Type } from '../../types';

const TypesTab: React.FC = () => {
  const [types, setTypes] = useState<Type[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#0d6efd');
  const [icon, setIcon] = useState('fas fa-tasks');

  const fetchTypes = async () => {
    setIsLoading(true);
    try {
      const data = await window.types.getAll();
      setTypes(data);
    } catch (error) {
      console.error('Failed to fetch types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await window.types.update({ id: isEditing, label, color, icon });
      } else {
        await window.types.create({ label, color, icon });
      }
      resetForm();
      await fetchTypes();
    } catch (error) {
      console.error('Error saving type:', error);
      alert('Failed to save task type.');
    }
  };

  const handleEdit = (type: Type) => {
    setIsEditing(type.Id);
    setLabel(type.Label);
    setColor(type.Color);
    setIcon(type.Icon);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task type?')) return;
    try {
      await window.types.delete(id);
      await fetchTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      alert('Failed to delete task type. It may be in use by tasks.');
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setLabel('');
    setColor('#0d6efd');
    setIcon('fas fa-tasks');
  };

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">{isEditing ? 'Edit Task Type' : 'Add New Task Type'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-control no-drag" 
                value={label} 
                onChange={(e) => setLabel(e.target.value)} 
                placeholder="e.g. Bug, Feature, Chore"
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Icon (FontAwesome)</label>
              <div className="input-group">
                <span className="input-group-text"><i className={icon || 'fas fa-question'}></i></span>
                <input 
                  type="text" 
                  className="form-control no-drag" 
                  value={icon} 
                  onChange={(e) => setIcon(e.target.value)} 
                  placeholder="fas fa-bug"
                  required 
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label">Color</label>
              <input 
                type="color" 
                className="form-control form-control-color no-drag w-100" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
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
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>Icon</th>
                <th>Type Label</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.Id}>
                  <td>
                    <div 
                      className="rounded d-flex align-items-center justify-content-center" 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        backgroundColor: type.Color + '20', // Add transparency
                        color: type.Color
                      }}
                    >
                      <i className={type.Icon}></i>
                    </div>
                  </td>
                  <td className="fw-bold">{type.Label}</td>
                  <td className="text-end">
                    <button 
                      className="btn btn-sm btn-outline-primary me-2 no-drag"
                      onClick={() => handleEdit(type)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger no-drag"
                      onClick={() => handleDelete(type.Id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-4 text-muted">
                    No task types configured yet.
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

export default TypesTab;
