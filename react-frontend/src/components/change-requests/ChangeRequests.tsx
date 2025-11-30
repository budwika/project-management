import React, { useEffect, useState } from 'react';
import { changeRequestsAPI } from '../../services/api';
import { ChangeRequest } from '../../types';
import { ChangeRequestFormModal } from '../modals';

const ChangeRequests: React.FC = () => {
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'implemented'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);

    useEffect(() => {
        fetchChangeRequests();
    }, []);

    const fetchChangeRequests = async () => {
        try {
            const response = await changeRequestsAPI.getAll();
            if (response.success && response.data) {
                setChangeRequests(Array.isArray(response.data) ? response.data : []);
            } else {
                setChangeRequests([]);
            }
        } catch (err: any) {
            setError('Failed to load change requests');
            console.error('Error fetching change requests:', err);
            setChangeRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChangeRequest = () => {
        setSelectedChangeRequest(null);
        setShowModal(true);
    };

    const handleEditChangeRequest = (changeRequest: ChangeRequest) => {
        setSelectedChangeRequest(changeRequest);
        setShowModal(true);
    };

    const handleViewChangeRequest = (changeRequest: ChangeRequest) => {
        setSelectedChangeRequest(changeRequest);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedChangeRequest(null);
    };

    const handleChangeRequestSubmit = () => {
        fetchChangeRequests(); // Refresh the list
        handleModalClose();
    };

    const getStatusBadgeClass = (status: string) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'pending':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClass} bg-blue-100 text-blue-800`;
            case 'rejected':
                return `${baseClass} bg-red-100 text-red-800`;
            case 'implemented':
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

    const filteredChangeRequests = filter === 'all'
        ? changeRequests
        : changeRequests.filter(cr => cr.status === filter);

    const changeCounts = {
        all: changeRequests.length,
        pending: changeRequests.filter(cr => cr.status === 'pending').length,
        approved: changeRequests.filter(cr => cr.status === 'approved').length,
        rejected: changeRequests.filter(cr => cr.status === 'rejected').length,
        implemented: changeRequests.filter(cr => cr.status === 'implemented').length,
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
                    <h1 className="text-2xl font-bold text-gray-900">Change Requests</h1>
                    <p className="text-gray-600 mt-2">Manage project change requests and approvals</p>
                </div>
                <button className="btn-primary" onClick={handleCreateChangeRequest}>
                    Create Change Request
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
                    {(['all', 'pending', 'approved', 'rejected', 'implemented'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${filter === status
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                                {changeCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Change Requests List */}
            {filteredChangeRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {filter === 'all' ? 'No change requests yet' : `No ${filter} change requests`}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {filter === 'all'
                            ? 'Get started by creating your first change request'
                            : `No change requests with status "${filter}"`
                        }
                    </p>
                    <button className="btn-primary" onClick={handleCreateChangeRequest}>
                        Create Change Request
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {filteredChangeRequests.map((changeRequest) => (
                            <div key={changeRequest._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                                {changeRequest.title}
                                            </h3>
                                            <span className={getStatusBadgeClass(changeRequest.status)}>
                                                {changeRequest.status}
                                            </span>
                                            <span className={getPriorityBadgeClass(changeRequest.priority)}>
                                                {changeRequest.priority}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {changeRequest.description}
                                        </p>

                                        <div className="flex items-center text-sm text-gray-500 space-x-6">
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <span>{changeRequest.project.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>{changeRequest.requestedBy.name}</span>
                                            </div>
                                            {changeRequest.estimatedCost && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    <span>${changeRequest.estimatedCost.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {changeRequest.estimatedHours && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{changeRequest.estimatedHours}h estimated</span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>
                                                    {new Date(changeRequest.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            className="btn-primary text-sm py-2 px-3"
                                            onClick={() => handleViewChangeRequest(changeRequest)}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="btn-secondary text-sm py-2 px-3"
                                            onClick={() => handleEditChangeRequest(changeRequest)}
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

            <ChangeRequestFormModal
                isOpen={showModal}
                onClose={handleModalClose}
                onSubmit={handleChangeRequestSubmit}
                changeRequest={selectedChangeRequest}
            />
        </div>
    );
};

export default ChangeRequests;