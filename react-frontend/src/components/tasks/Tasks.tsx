import React, { useEffect, useState } from 'react';
import { tasksAPI } from '../../services/api';
import { Task } from '../../types';
import { TaskFormModal } from '../modals';

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'in-review' | 'completed'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await tasksAPI.getAll();
            if (response.success && response.data) {
                // Ensure response.data is an array, otherwise assign empty array
                setTasks(Array.isArray(response.data) ? response.data : []);
            } else {
                setTasks([]);
            }
        } catch (err: any) {
            setError('Failed to load tasks');
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleViewTask = (task: Task) => {
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedTask(null);
    };

    const handleTaskSubmit = () => {
        fetchTasks(); // Refresh the list
        handleModalClose();
    };

    const getStatusBadgeClass = (status: string) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'todo':
                return `${baseClass} bg-gray-100 text-gray-800`;
            case 'in-progress':
                return `${baseClass} bg-blue-100 text-blue-800`;
            case 'in-review':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'completed':
                return `${baseClass} bg-green-100 text-green-800`;
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

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    const filteredTasks = filter === 'all' ? tasks : tasks.filter(task => task.status === filter);

    const taskCounts = {
        all: tasks.length,
        todo: tasks.filter(task => task.status === 'todo').length,
        'in-progress': tasks.filter(task => task.status === 'in-progress').length,
        'in-review': tasks.filter(task => task.status === 'in-review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
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
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-600 mt-2">Manage and track all your tasks</p>
                </div>
                <button className="btn-primary" onClick={handleCreateTask}>
                    Create New Task
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                    {(['all', 'todo', 'in-progress', 'in-review', 'completed'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${filter === status
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'All Tasks' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                            <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                                {taskCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {filter === 'all' ? 'No tasks yet' : `No ${filter.replace('-', ' ')} tasks`}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {filter === 'all' ? 'Get started by creating your first task' : `No tasks with status "${filter.replace('-', ' ')}"`}
                    </p>
                    <button className="btn-primary" onClick={handleCreateTask}>
                        Create Task
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {filteredTasks.map((task) => (
                            <div key={task._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                                {task.title}
                                            </h3>
                                            <span className={getStatusBadgeClass(task.status)}>
                                                {task.status.replace('-', ' ')}
                                            </span>
                                            <span className={getPriorityBadgeClass(task.priority)}>
                                                {task.priority}
                                            </span>
                                            {task.dueDate && isOverdue(task.dueDate) && (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-600 text-sm mb-3">
                                            {task.description}
                                        </p>

                                        <div className="flex items-center text-sm text-gray-500 space-x-6">
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <span>{task.project.name}</span>
                                            </div>
                                            {task.assignedTo && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span>{task.assignedTo.name}</span>
                                                </div>
                                            )}
                                            {task.dueDate && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>
                                                        Due {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {task.estimatedHours && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{task.estimatedHours}h estimated</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            className="btn-primary text-sm py-2 px-3"
                                            onClick={() => handleViewTask(task)}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="btn-secondary text-sm py-2 px-3"
                                            onClick={() => handleEditTask(task)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <TaskFormModal
                isOpen={showModal}
                onClose={handleModalClose}
                onSubmit={handleTaskSubmit}
                task={selectedTask}
            />
        </div>
    );
};

export default Tasks;