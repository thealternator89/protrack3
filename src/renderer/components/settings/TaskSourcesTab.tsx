import React, { useEffect, useState } from 'react';
import { TaskSource, Status } from '../../types';

interface StatusMapFormEntry {
  localStatusId: number | '';
  sourceName: string;
}

const TaskSourcesTab: React.FC = () => {
  const [sources, setSources] = useState<TaskSource[]>([]);
  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Azure DevOps');
  
  // Azure DevOps specific config
  const [organizationName, setOrganizationName] = useState('');
  const [project, setProject] = useState(''); // Re-introducing this
  const [pat, setPat] = useState('');

  // Status mapping state
  const [currentStatusMaps, setCurrentStatusMaps] = useState<StatusMapFormEntry[]>([]);

  const fetchSourcesAndStatuses = async () => {
    setIsLoading(true);
    try {
      const [sourcesData, statusesData] = await Promise.all([
        window.taskSources.getAll(),
        window.statuses.getAll(),
      ]);
      setSources(sourcesData);
      setAllStatuses(statusesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSourcesAndStatuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const organizationUrl = `https://dev.azure.com/${organizationName}`;
      const configObj = { organizationName, organizationUrl, project, pat };
      const configStr = JSON.stringify(configObj);
      let taskSourceId: number;

      if (isEditing) {
        await window.taskSources.update({ id: isEditing, name, type, config: configStr });
        taskSourceId = isEditing;
      } else {
        const result = await window.taskSources.create({ name, type, config: configStr });
        taskSourceId = result.lastID; // Assuming create returns { lastID: number }
      }

      // Save status maps if we have a taskSourceId
      if (taskSourceId) {
        // Filter out incomplete mappings before saving
        const validMaps = currentStatusMaps.filter(map => map.localStatusId !== '' && map.sourceName.trim() !== '');
        const formattedMaps = validMaps.map(map => ({
          statusId: map.localStatusId as number,
          sourceName: map.sourceName.trim(),
        }));
        await window.statusMaps.update(taskSourceId, formattedMaps);
      }

      resetForm();
      await fetchSourcesAndStatuses();
    } catch (error) {
      console.error('Error saving task source:', error);
      alert('Failed to save task source.');
    }
  };

  const handleEdit = async (source: TaskSource) => {
    setIsEditing(source.Id);
    setName(source.Name);
    setType(source.Type);
    
    try {
      const config = JSON.parse(source.Config);
      setOrganizationName(config.organizationName || '');
      setProject(config.project || '');
      setPat(config.pat || '');
    } catch (e) {
      console.error('Failed to parse config:', e);
      setOrganizationName('');
      setProject(''); // Clear project on parse error
      setPat('');
    }

    // Fetch and set status maps for editing
    try {
      const maps = await window.statusMaps.getByTaskSourceId(source.Id);
      setCurrentStatusMaps(maps.map(map => ({
        localStatusId: map.StatusId,
        sourceName: map.SourceName,
      })));
    } catch (e) {
      console.error('Failed to fetch status maps:', e);
      setCurrentStatusMaps([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task source?')) return;
    try {
      await window.taskSources.delete(id);
      await fetchSourcesAndStatuses();
    } catch (error) {
      console.error('Error deleting task source:', error);
      alert('Failed to delete task source. It may be in use by projects.');
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setType('Azure DevOps');
    setOrganizationName('');
    setProject('');
    setPat('');
    setCurrentStatusMaps([]); // Clear status maps on form reset
  };

  const handleAddStatusMap = () => {
    setCurrentStatusMaps([...currentStatusMaps, { localStatusId: '', sourceName: '' }]);
  };

  const handleUpdateStatusMap = (index: number, field: keyof StatusMapFormEntry, value: string | number) => {
    const updatedMaps = [...currentStatusMaps];
    if (field === 'localStatusId') {
      updatedMaps[index].localStatusId = value as number;
    } else {
      updatedMaps[index].sourceName = value as string;
    }
    setCurrentStatusMaps(updatedMaps);
  };

  const handleDeleteStatusMap = (index: number) => {
    const updatedMaps = currentStatusMaps.filter((_, i) => i !== index);
    setCurrentStatusMaps(updatedMaps);
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
                  <label className="form-label fw-bold">Organization Name</label>
                  <input 
                    type="text" 
                    className="form-control no-drag" 
                    placeholder="e.g. microsoft"
                    value={organizationName} 
                    onChange={(e) => setOrganizationName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Project</label>
                  <input 
                    type="text" 
                    className="form-control no-drag" 
                    placeholder="e.g. MyProject"
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

            {isEditing && (
              <div className="col-12 mt-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Status Mappings</h6>
                  </div>
                  <div className="card-body">
                    {currentStatusMaps.length === 0 && <p className="text-muted">No status mappings configured.</p>}
                    {currentStatusMaps.map((map, index) => (
                      <div key={index} className="row g-2 mb-2 align-items-center">
                        <div className="col-5">
                          <select
                            className="form-select no-drag"
                            value={map.localStatusId}
                            onChange={(e) => handleUpdateStatusMap(index, 'localStatusId', Number(e.target.value))}
                            required
                          >
                            <option value="">Select Local Status</option>
                            {allStatuses.map(status => (
                              <option key={status.Id} value={status.Id}>{status.Label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-5">
                          <input
                            type="text"
                            className="form-control no-drag"
                            placeholder="Source Status Name"
                            value={map.sourceName}
                            onChange={(e) => handleUpdateStatusMap(index, 'sourceName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-2">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm no-drag"
                            onClick={() => handleDeleteStatusMap(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm mt-3 no-drag" onClick={handleAddStatusMap}>
                      <i className="fas fa-plus me-2"></i>Add Mapping
                    </button>
                  </div>
                </div>
              </div>
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
                    const orgName = config.organizationName || '';
                    const projectName = config.project || '';
                    summary = `${orgName}${projectName ? ' / ' + projectName : ''}`;
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
