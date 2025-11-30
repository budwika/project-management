import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Project, User } from '../../types';
import { projectsAPI, usersAPI } from '../../services/api';

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Project) => void;
    project?: Project | null;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    project
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        client: '',
        projectManager: '',
        teamMembers: [] as string[],
        startDate: '',
        endDate: '',
        status: 'planning',
        priority: 'medium',
        progress: 0,
        budget: '',
        estimatedHours: '',
        tags: [] as string[]
    });

    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            if (project) {
                setFormData({
                    name: project.name,
                    description: project.description,
                    client: project.client._id,
                    projectManager: project.projectManager._id,
                    teamMembers: project.teamMembers.map(member => member._id),
                    startDate: project.startDate.split('T')[0],
                    endDate: project.endDate.split('T')[0],
                    status: project.status,
                    priority: project.priority,
                    progress: project.progress,
                    budget: project.budget?.toString() || '',
                    estimatedHours: project.estimatedHours?.toString() || '',
                    tags: project.tags || []
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, project]);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            if (response.success && Array.isArray(response.data)) {
                setUsers(response.data);
                setClients(response.data.filter(user => user.role === 'client'));
                setEmployees(response.data.filter(user => user.role === 'employee'));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            client: '',
            projectManager: '',
            teamMembers: [],
            startDate: '',
            endDate: '',
            status: 'planning',
            priority: 'medium',
            progress: 0,
            budget: '',
            estimatedHours: '',
            tags: []
        });
        setTagInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const projectData = {
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
                estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
            };

            let response;
            if (project) {
                response = await projectsAPI.update(project._id, projectData);
            } else {
                response = await projectsAPI.create(projectData);
            }

            if (response.success && response.data) {
                onSubmit(response.data);
                onClose();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTagAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }));
            }
            setTagInput('');
        }
    };

    const handleTagRemove = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTeamMemberToggle = (memberId: string) => {
        setFormData(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.includes(memberId)
                ? prev.teamMembers.filter(id => id !== memberId)
                : [...prev.teamMembers, memberId]
        }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? 'Edit Project' : 'Create New Project'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* People */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client *
                        </label>
                        <select
                            required
                            value={formData.client}
                            onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Manager *
                        </label>
                        <select
                            required
                            value={formData.projectManager}
                            onChange={(e) => setFormData(prev => ({ ...prev, projectManager: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Project Manager</option>
                            {employees.map(employee => (
                                <option key={employee._id} value={employee._id}>
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Team Members */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Members
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {employees.map(employee => (
                            <label key={employee._id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={formData.teamMembers.includes(employee._id)}
                                    onChange={() => handleTeamMemberToggle(employee._id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">{employee.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Dates and Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Progress (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Priority, Budget, Hours */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Budget
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.budget}
                            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Hours
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            value={formData.estimatedHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagAdd}
                        placeholder="Type a tag and press Enter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleTagRemove(tag)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectFormModal;