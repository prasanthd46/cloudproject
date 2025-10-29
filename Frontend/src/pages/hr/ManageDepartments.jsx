import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ departmentName: '', headUserId: '' });

  useEffect(() => {
    fetchDepartments();
    fetchDeptHeads();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchDeptHeads = async () => {
    try {
      const response = await axios.get('/api/users/dept-heads');
      setDeptHeads(response.data);
    } catch (error) {
      console.error('Failed to fetch dept heads:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`/api/departments/${editingDept.DepartmentID}`, formData);
      } else {
        await axios.post('/api/departments', formData);
      }
      fetchDepartments();
      setShowModal(false);
      setFormData({ departmentName: '', headUserId: '' });
      setEditingDept(null);
    } catch (error) {
      console.error('Failed to save department:', error);
      alert('Failed to save department');
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      departmentName: dept.DepartmentName,
      headUserId: dept.HeadUserID || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await axios.delete(`/api/departments/${id}`);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
      alert('Failed to delete department');
    }
  };

  return (
    <Layout title="Manage Departments">
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingDept(null);
            setFormData({ departmentName: '', headUserId: '' });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Add Department
        </button>
      </div>

      <div className="card">
        <div className="card-content p-0">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department Head
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept) => (
                <tr key={dept.DepartmentID} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium">{dept.DepartmentName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {dept.HeadName || 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => handleEdit(dept)} className="btn btn-ghost text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(dept.DepartmentID)} className="btn btn-ghost text-xs text-destructive">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <h3 className="card-title">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Department Name</label>
                  <input
                    type="text"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department Head</label>
                  <select
                    value={formData.headUserId}
                    onChange={(e) => setFormData({ ...formData, headUserId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select Department Head</option>
                    {deptHeads.map((head) => (
                      <option key={head.UserID} value={head.UserID}>
                        {head.FullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingDept ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDept(null);
                      setFormData({ departmentName: '', headUserId: '' });
                    }}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
