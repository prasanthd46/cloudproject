import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';

export default function ManageCycles() {
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    cycleName: '',
    startDate: '',
    endDate: '',
    templateId: '',
    deptHeadTemplateId: '',
    departmentIds: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
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

  const handleDepartmentToggle = (deptId) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter(id => id !== deptId)
        : [...prev.departmentIds, deptId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.departmentIds.length === 0) {
      alert('Please select at least one department');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/cycles', formData);
      alert('Review cycle created successfully! Reviews have been assigned.');
      setFormData({
        cycleName: '',
        startDate: '',
        endDate: '',
        templateId: '',
        deptHeadTemplateId: '',
        departmentIds: []
      });
    } catch (error) {
      console.error('Failed to create cycle:', error);
      alert('Failed to create review cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Manage Review Cycles">
      <div className="max-w-3xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Create New Review Cycle</h3>
            <p className="card-description">
              Launch a new review cycle. This will automatically create review assignments for all staff and department heads.
            </p>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cycle Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Cycle Name *</label>
                <input
                  type="text"
                  value={formData.cycleName}
                  onChange={(e) => setFormData({ ...formData, cycleName: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Q4 2025 Performance Review"
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              {/* Staff Template */}
              <div>
                <label className="block text-sm font-medium mb-2">Staff Review Template *</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select template for staff reviews</option>
                  {templates.map((template) => (
                    <option key={template.TemplateID} value={template.TemplateID}>
                      {template.TemplateName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  This template will be used by department heads to review their staff
                </p>
              </div>

              {/* Dept Head Template */}
              <div>
                <label className="block text-sm font-medium mb-2">Department Head Review Template *</label>
                <select
                  value={formData.deptHeadTemplateId}
                  onChange={(e) => setFormData({ ...formData, deptHeadTemplateId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select template for dept head reviews</option>
                  {templates.map((template) => (
                    <option key={template.TemplateID} value={template.TemplateID}>
                      {template.TemplateName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  This template will be used by HR to review department heads
                </p>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Departments *</label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {departments.map((dept) => (
                    <label key={dept.DepartmentID} className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.departmentIds.includes(dept.DepartmentID)}
                        onChange={() => handleDepartmentToggle(dept.DepartmentID)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{dept.DepartmentName}</p>
                        <p className="text-xs text-muted-foreground">
                          Head: {dept.HeadName || 'Not Assigned'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? 'Creating Review Cycle...' : 'Launch Review Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
