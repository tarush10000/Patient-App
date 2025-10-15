'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import { api } from '@/lib/api';

export default function StaffUsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [users, searchTerm, roleFilter]);

    const checkAuth = () => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'admin' && payload.role !== 'reception') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(payload);
        } catch (error) {
            console.error('Error checking auth:', error);
            router.push('/login');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.getUsers();
            setUsers(response.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.fullName?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.phone?.includes(term)
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-700';
            case 'reception':
                return 'bg-purple-100 text-purple-700';
            case 'patient':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-6xl mx-auto p-4 pb-24">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
                    <span className="text-sm text-gray-600">
                        {filteredUsers.length} of {users.length} users
                    </span>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="patient">Patients</option>
                            <option value="reception">Receptionists</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                            {users.filter(u => u.role === 'patient').length}
                        </p>
                        <p className="text-sm text-blue-700 font-semibold">Patients</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">
                            {users.filter(u => u.role === 'reception').length}
                        </p>
                        <p className="text-sm text-purple-700 font-semibold">Reception</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-red-600">
                            {users.filter(u => u.role === 'admin').length}
                        </p>
                        <p className="text-sm text-red-700 font-semibold">Admins</p>
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <p className="text-gray-500 text-lg">No users found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{user.fullName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-sm text-gray-600">
                                            {user.email && <p>📧 {user.email}</p>}
                                            {user.phone && <p>📞 {user.phone}</p>}
                                            <p className="text-xs text-gray-400">
                                                Joined {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <StaffBottomNav activeScreen="users" userRole={currentUser?.role} />
        </div>
    );
}