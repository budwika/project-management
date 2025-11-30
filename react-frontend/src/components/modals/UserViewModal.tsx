import React from 'react';
import Modal from './Modal';
import { User } from '../../types';

interface UserViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const UserViewModal: React.FC<UserViewModalProps> = ({
    isOpen,
    onClose,
    user
}) => {
    if (!user) return null;

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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Details"
            size="md"
        >
            <div className="space-y-6">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            getInitials(user.name)
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <span className={getRoleBadgeClass(user.role)}>
                                {user.role}
                            </span>
                            <span className={getStatusBadgeClass(user.isActive)}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Position
                        </label>
                        <p className="text-gray-900">
                            {user.position || 'Not specified'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Department
                        </label>
                        <p className="text-gray-900">
                            {user.department || 'Not specified'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Last Login
                        </label>
                        <p className="text-gray-900">
                            {user.lastLogin
                                ? new Date(user.lastLogin).toLocaleString()
                                : 'Never logged in'
                            }
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            Member Since
                        </label>
                        <p className="text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                User ID
                            </label>
                            <p className="text-gray-900 font-mono text-sm">
                                {user._id}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Last Updated
                            </label>
                            <p className="text-gray-900">
                                {new Date(user.updatedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="btn-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UserViewModal;