import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { RegisterRequest } from '../../types';

const Register: React.FC = () => {
    const [formData, setFormData] = useState<RegisterRequest>({
        name: '',
        email: '',
        password: '',
        role: 'employee' as 'employee' | 'client',
        position: '',
        department: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'role' ? value as 'employee' | 'client' : value
        });
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register(formData);
            navigate('/projects');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally { setIsLoading(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>)}
                    <div className="space-y-4">
                        <input name="name" type="text" required
                            className="input-field"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                        />

                        <input
                            name="email"
                            type="email"
                            required
                            className="input-field"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <input
                            name="password"
                            type="password"
                            required
                            className="input-field"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <select
                            name="role"
                            className="input-field"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="employee">Employee</option>
                            <option value="client">Client</option>
                        </select>

                        <input
                            name="position"
                            type="text"
                            className="input-field"
                            placeholder="Position (optional)"
                            value={formData.position}
                            onChange={handleChange}
                        />

                        <input
                            name="department"
                            type="text"
                            className="input-field"
                            placeholder="Department (optional)"
                            value={formData.department}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex justify-center py-3 text-sm font-medium disabled:opacity-50"
                        >
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link to="/login" className="text-blue-600 hover:text-blue-500">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;