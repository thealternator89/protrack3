import React, { useEffect, useState } from 'react';
import { Person } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

const PeopleTab: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState('primary');

  const BOOTSTRAP_COLORS = [
    { label: 'Primary (Blue)', value: 'primary' },
    { label: 'Secondary (Gray)', value: 'secondary' },
    { label: 'Success (Green)', value: 'success' },
    { label: 'Danger (Red)', value: 'danger' },
    { label: 'Warning (Yellow)', value: 'warning' },
    { label: 'Info (Light Blue)', value: 'info' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      const data = await window.people.getAll();
      setPeople(data);
    } catch (error) {
      console.error('Failed to fetch people:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await window.people.update({ id: isEditing, name, email, color });
      } else {
        await window.people.create({ name, email, color });
      }
      resetForm();
      await fetchPeople();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save person.');
    }
  };

  const handleEdit = (person: Person) => {
    setIsEditing(person.Id);
    setName(person.Name);
    setEmail(person.Email);
    setColor(person.Color || 'primary');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    try {
      await window.people.delete(id);
      await fetchPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person. They may be assigned to projects or tasks.');
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setEmail('');
    setColor('primary');
  };

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">{isEditing ? 'Edit Person' : 'Add New Person'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input 
                type="text" 
                className="form-control no-drag" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control no-drag" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Color</label>
              <select 
                className="form-select no-drag" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
              >
                {BOOTSTRAP_COLORS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
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
                <th style={{ width: '40px' }}></th>
                <th>Name</th>
                <th>Email</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.Id}>
                  <td>
                    <div 
                      className={`rounded-circle shadow-sm bg-${person.Color || 'secondary'}`} 
                      style={{ 
                        width: '24px', 
                        height: '24px'
                      }}
                      title={person.Color || 'secondary'}
                    ></div>
                  </td>
                  <td className="fw-bold">{person.Name}</td>
                  <td className="text-muted">{person.Email}</td>
                  <td className="text-end">
                    <button 
                      className="btn btn-sm btn-outline-primary me-2 no-drag"
                      onClick={() => handleEdit(person)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger no-drag"
                      onClick={() => handleDelete(person.Id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-muted">
                    No people configured yet.
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

export default PeopleTab;
