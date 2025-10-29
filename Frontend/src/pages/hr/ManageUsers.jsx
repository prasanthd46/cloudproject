import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Staff',
    departmentId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.UserID}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      setShowModal(false);
      setFormData({ fullName: '', email: '', role: 'Staff', departmentId: '' });
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.FullName,
      email: user.Email,
      role: user.Role,
      departmentId: user.DepartmentID || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      'HR Admin': 'badge badge-destructive',
      'Dept Head': 'badge badge-default',
      'Staff': 'badge badge-secondary'
    };
    return <span className={styles[role]}>{role}</span>;
  };

  return (
    <Layout title="Manage Users">
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ fullName: '', email: '', role: 'Staff', departmentId: '' });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Add User
        </button>
      </div>

      <div className="card">
        <div className="card-content p-0">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.UserID} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium">{user.FullName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.Email}</td>
                  <td className="px-6 py-4 text-sm">{getRoleBadge(user.Role)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.DepartmentName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => handleEdit(user)} className="btn btn-ghost text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.UserID)} className="btn btn-ghost text-xs text-destructive">
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
              <h3 className="card-title">{editingUser ? 'Edit User' : 'Add User'}</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input w-full"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Dept Head">Dept Head</option>
                    <option value="HR Admin">HR Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.DepartmentID} value={dept.DepartmentID}>
                        {dept.DepartmentName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setFormData({ fullName: '', email: '', role: 'Staff', departmentId: '' });
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
