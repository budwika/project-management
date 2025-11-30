import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ChangeRequest, Project } from '../../types';
import { changeRequestsAPI, projectsAPI } from '../../services/api';

interface ChangeRequestFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (changeRequest: ChangeRequest) => void;
    changeRequest?: ChangeRequest | null;
}

const ChangeRequestFormModal: React.FC<ChangeRequestFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    changeRequest
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'pending',
        estimatedHours: '',
        estimatedCost: ''
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            if (changeRequest) {
                setFormData({
                    title: changeRequest.title,
                    description: changeRequest.description,
                    project: changeRequest.project._id,
                    priority: changeRequest.priority,
                    status: changeRequest.status,
                    estimatedHours: changeRequest.estimatedHours?.toString() || '',
                    estimatedCost: changeRequest.estimatedCost?.toString() || ''
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, changeRequest]);

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll();
            if (response.success && response.data && Array.isArray(response.data)) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            project: '',
            priority: 'medium',
            status: 'pending',
            estimatedHours: '',
            estimatedCost: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const requestData = {
                ...formData,
                estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
                estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined
            };

            let response;
            if (changeRequest) {
                response = await changeRequestsAPI.update(changeRequest._id, requestData);
            } else {
                response = await changeRequestsAPI.create(requestData);
            }

            if (response.success && response.data) {
                const result = response.data || response.data;
                onSubmit(result);
                onClose();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving change request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={changeRequest ? 'Edit Change Request' : 'Create New Change Request'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief title for the change request"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Detailed description of the requested change"
                    />
                </div>

                {/* Project and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project *
                        </label>
                        <select
                            required
                            value={formData.project}
                            onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Project</option>
                            {projects.map(project => (
                                <option key={project._id} value={project._id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

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
                </div>

                {/* Status (only show for editing) */}
                {changeRequest && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="implemented">Implemented</option>
                        </select>
                    </div>
                )}

                {/* Estimates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Hours
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={formData.estimatedHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Cost
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.estimatedCost}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
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
                        {loading ? 'Saving...' : changeRequest ? 'Update Change Request' : 'Create Change Request'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangeRequestFormModal;