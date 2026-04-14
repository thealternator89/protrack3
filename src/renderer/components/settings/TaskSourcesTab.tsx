import React, { useEffect, useState } from 'react';
import { TaskSource } from '../../types';

const TaskSourcesTab: React.FC = () => {
  const [sources, setSources] = useState<TaskSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Azure DevOps');
  
  // Azure DevOps specific config
  const [org, setOrg] = useState('');
  const [project, setProject] = useState('');
  const [pat, setPat] = useState('');

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const data = await window.taskSources.getAll();
      setSources(data);
    } catch (error) {
      console.error('Failed to fetch task sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configObj = { org, project, pat };
      const configStr = JSON.stringify(configObj);

      if (isEditing) {
        await window.taskSources.update({ id: isEditing, name, type, config: configStr });
      } else {
        await window.taskSources.create({ name, type, config: configStr });
      }
      resetForm();
      await fetchSources();
    } catch (error) {
      console.error('Error saving task source:', error);
      alert('Failed to save task source.');
    }
  };

  const handleEdit = (source: TaskSource) => {
    setIsEditing(source.Id);
    setName(source.Name);
    setType(source.Type);
    
    try {
      const config = JSON.parse(source.Config);
      setOrg(config.org || '');
      setProject(config.project || '');
      setPat(config.pat || '');
    } catch (e) {
      console.error('Failed to parse config:', e);
      setOrg('');
      setProject('');
      setPat('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task source?')) return;
    try {
      await window.taskSources.delete(id);
      await fetchSources();
    } catch (error) {
      console.error('Error deleting task source:', error);
      alert('Failed to delete task source. It may be in use by projects.');
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setType('Azure DevOps');
    setOrg('');
    setProject('');
    setPat('');
  };

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">{isEditing ? 'Edit Task Source' : 'Add New Task Source'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Display Name</label>
              <input 
                type="text" 
                className="form-control no-drag" 
                placeholder="e.g. My ADO Org"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Source Type</label>
              <select 
                className="form-select no-drag" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="Azure DevOps">Azure DevOps</option>
              </select>
            </div>

            {type === 'Azure DevOps' && (
              <>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Organization</label>
                  <input 
                    type="text" 
                    className="form-control no-drag" 
                    placeholder="e.g. microsoft"
                    value={org} 
                    onChange={(e) => setOrg(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Project</label>
                  <input 
                    type="text" 
                    className="form-control no-drag" 
                    placeholder="e.g. VSCode"
                    value={project} 
                    onChange={(e) => setProject(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Personal Access Token (PAT)</label>
                  <input 
                    type="password" 
                    className="form-control no-drag" 
                    value={pat} 
                    onChange={(e) => setPat(e.target.value)} 
                    required 
                  />
                </div>
              </>
            )}

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary no-drag">
                <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'} me-2`}></i>
                {isEditing ? 'Update Task Source' : 'Add Task Source'}
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
                <th>Name</th>
                <th>Type</th>
                <th>Configuration Summary</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                let summary = '';
                try {
                  const config = JSON.parse(source.Config);
                  if (source.Type === 'Azure DevOps') {
                    summary = `${config.org} / ${config.project}`;
                  }
                } catch {
                  summary = 'Invalid Config';
                }

                return (
                  <tr key={source.Id}>
                    <td className="fw-bold">{source.Name}</td>
                    <td>
                      <span className="badge bg-info text-dark">
                        <i className="fab fa-microsoft me-1"></i>
                        {source.Type}
                      </span>
                    </td>
                    <td className="text-muted small">{summary}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2 no-drag"
                        onClick={() => handleEdit(source)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger no-drag"
                        onClick={() => handleDelete(source.Id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-muted">
                    No task sources configured yet.
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

export default TaskSourcesTab;
