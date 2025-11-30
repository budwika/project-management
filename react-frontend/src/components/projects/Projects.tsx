import React, { useEffect, useState } from 'react';
import { projectsAPI } from '../../services/api';
import { Project } from '../../types';
import { ProjectFormModal } from '../modals';

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll();
            if (response.success && response.data) {
                // Ensure response.data is an array, otherwise assign empty array
                setProjects(Array.isArray(response.data) ? response.data : []);
            } else {
                setProjects([]);
            }
        } catch (err: any) {
            setError('Failed to load projects');
            console.error('Error fetching projects:', err);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };


    const handleCreateProject = () => {
        setSelectedProject(null);
        setShowModal(true);
    };

    const handleEditProject = (project: Project) => {
        setSelectedProject(project);
        setShowModal(true);
    };

    const handleViewProject = (project: Project) => {
        setSelectedProject(project);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedProject(null);
    };

    const handleProjectSubmit = () => {
        fetchProjects(); // Refresh the list
        handleModalClose();
    };

    const getStatusBadgeClass = (status: string) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'active':
                return `${baseClass} bg-green-100 text-green-800`;
            case 'planning':
                return `${baseClass} bg-blue-100 text-blue-800`;
            case 'completed':
                return `${baseClass} bg-gray-100 text-gray-800`;
            case 'on-hold':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'cancelled':
                return `${baseClass} bg-red-100 text-red-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (priority) {
            case 'critical':
                return `${baseClass} bg-red-100 text-red-800`;
            case 'high':
                return `${baseClass} bg-orange-100 text-orange-800`;
            case 'medium':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'low':
                return `${baseClass} bg-blue-100 text-blue-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 mt-2">Manage and track all your projects</p>
                </div>
                <button className="btn-primary" onClick={handleCreateProject}>
                    Create New Project
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Projects Grid */}
            {projects?.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first project</p>
                    <button className="btn-primary" onClick={handleCreateProject}>
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects?.map((project) => (
                        <div key={project._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {project.name}
                                </h3>
                                <div className="flex space-x-2">
                                    <span className={getStatusBadgeClass(project.status)}>
                                        {project.status}
                                    </span>
                                    <span className={getPriorityBadgeClass(project.priority)}>
                                        {project.priority}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {project.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Project Details */}
                            <div className="text-sm text-gray-600 space-y-1 mb-4">
                                <div className="flex justify-between">
                                    <span>Client:</span>
                                    <span className="font-medium">{project.client.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PM:</span>
                                    <span className="font-medium">{project.projectManager.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Team:</span>
                                    <span className="font-medium">{project.teamMembers.length} members</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Due Date:</span>
                                    <span className="font-medium">
                                        {new Date(project.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                                <button
                                    className="flex-1 btn-primary text-sm py-2"
                                    onClick={() => handleViewProject(project)}
                                >
                                    View Details
                                </button>
                                <button
                                    className="flex-1 btn-secondary text-sm py-2"
                                    onClick={() => handleEditProject(project)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProjectFormModal
                isOpen={showModal}
                onClose={handleModalClose}
                onSubmit={handleProjectSubmit}
                project={selectedProject}
            />
        </div>
    );
};

export default Projects;