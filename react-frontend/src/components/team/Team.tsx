import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
import { User } from '../../types';
import { UserViewModal } from '../modals';

const Team: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'admin' | 'employee' | 'client'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await usersAPI.getAll();
                if (response.success && response.data) {
                    // Ensure response.data is an array, otherwise assign empty array
                    setUsers(Array.isArray(response.data) ? response.data : []);
                } else {
                    setUsers([]);
                }
            } catch (err: any) {
                setError('Failed to load team members');
                console.error('Error fetching users:', err);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const getRoleBadgeClass = (role: string) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        switch (role) {
            case 'admin':
                return `${baseClass} bg-purple-100 text-purple-800`;
            case 'employee':
                return `${baseClass} bg-blue-100 text-blue-800`;
            case 'client':
                return `${baseClass} bg-green-100 text-green-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const getStatusBadgeClass = (isActive: boolean) => {
        const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full';
        return isActive
            ? `${baseClass} bg-green-100 text-green-800`
            : `${baseClass} bg-red-100 text-red-800`;
    };

    const filteredUsers = filter === 'all' ? users : users.filter(user => user.role === filter);

    const userCounts = {
        all: users.length,
        admin: users.filter(user => user.role === 'admin').length,
        employee: users.filter(user => user.role === 'employee').length,
        client: users.filter(user => user.role === 'client').length,
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
                    <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                    <p className="text-gray-600 mt-2">View team members and their roles</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                    {(['all', 'admin', 'employee', 'client'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilter(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${filter === role
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {role === 'all' ? 'All Members' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                            <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                                {userCounts[role]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                                    <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Members</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {users.filter(user => user.isActive).length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Employees</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {users.filter(user => user.role === 'employee').length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Clients</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {users.filter(user => user.role === 'client').length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members Grid */}
            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {filter === 'all' ? 'No team members found' : `No ${filter}s found`}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {filter === 'all' ? 'No team members found' : `No team members with role "${filter}"`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(user.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Role:</span>
                                    <span className={getRoleBadgeClass(user.role)}>
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <span className={getStatusBadgeClass(user.isActive)}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {user.position && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Position:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {user.position}
                                        </span>
                                    </div>
                                )}
                                {user.department && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Department:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {user.department}
                                        </span>
                                    </div>
                                )}
                                {user.lastLogin && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Last Login:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(user.lastLogin).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    className="flex-1 btn-primary text-sm py-2"
                                    onClick={() => handleViewUser(user)}
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UserViewModal
                isOpen={showModal}
                onClose={handleModalClose}
                user={selectedUser}
            />
        </div>
    );
};

export default Team;