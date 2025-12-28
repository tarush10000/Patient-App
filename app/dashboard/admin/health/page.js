"use client";

import {
    Activity,
    Clock,
    Database,
    MessageCircle,
    RefreshCw,
    Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

import { api } from '@/lib/api';

export default function HealthCheckPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        overall: 'unitialized',
        mongodb: { status: 'unknown', latency: 0 },
        whatsboost: { status: 'unknown' },
        auth: { status: 'unknown' },
        lastChecked: null
    });

    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Run a fresh health check on mount so data is immediately available
        fetchHealthData(true);
    }, []);

    const fetchHealthData = async (shouldTriggerNew = false) => {
        setLoading(true);
        try {
            const headers = api.getAuthHeaders();

            // If triggering new check, perform POST
            if (shouldTriggerNew) {
                const checkRes = await fetch('/api/admin/health', {
                    method: 'POST',
                    headers: headers
                });
                if (checkRes.status === 401) throw new Error('Unauthorized');
                if (!checkRes.ok) throw new Error('Health check failed');
                toast.success('System health check completed');
            }

            // Fetch history
            const res = await fetch('/api/admin/health?limit=100', {
                headers: headers
            });
            if (res.status === 401) throw new Error('Unauthorized');
            const data = await res.json();

            if (data.logs && data.logs.length > 0) {
                setLogs(data.logs);
                processStats(data.logs);
            }
        } catch (error) {
            console.error('Error fetching health data:', error);
            // toast.error('Failed to update health status'); // Suppress to avoid spamming on load
        } finally {
            setLoading(false);
        }
    };

    const processStats = (logsData) => {
        if (!logsData.length) return;

        const latest = logsData[0];

        setStats({
            overall: latest.status,
            mongodb: latest.services?.mongodb || { status: 'unknown' },
            whatsboost: latest.services?.whatsboost || { status: 'unknown' },
            auth: latest.services?.auth || { status: 'unknown' },
            lastChecked: new Date(latest.timestamp)
        });

        // Prepare chart data (chronological order)
        const reversed = [...logsData].reverse();
        const chart = reversed.map(log => ({
            time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(log.timestamp).getTime(),
            mongoLatency: log.services?.mongodb?.latency || 0,
            statusValue: log.status === 'healthy' ? 10 : (log.status === 'degraded' ? 5 : 0),
            status: log.status
        }));
        setChartData(chart);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="text-blue-600" />
                            System Health Monitor
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Last updated: {stats.lastChecked ? stats.lastChecked.toLocaleString() : 'Never'}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchHealthData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        {loading ? 'Checking...' : 'Run Health Check'}
                    </button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatusCard
                        title="Overall System"
                        status={stats.overall}
                        icon={<Activity size={24} />}
                        details={stats.overall === 'healthy' ? 'All systems operational' : 'Attention required'}
                    />
                    <StatusCard
                        title="Database (MongoDB)"
                        status={stats.mongodb.status}
                        icon={<Database size={24} />}
                        details={stats.mongodb.status === 'up' ? `${stats.mongodb.latency}ms latency` : 'Connection Failed'}
                        extraInfo={stats.mongodb.error}
                    />
                    <StatusCard
                        title="WhatsBoost Service"
                        status={stats.whatsboost.status}
                        icon={<MessageCircle size={24} />}
                        details={stats.whatsboost.status === 'connected' ? 'Device Connected' : stats.whatsboost.details}
                    />
                    <StatusCard
                        title="Security & Auth"
                        status={stats.auth.status}
                        icon={<Shield size={24} />}
                        details={stats.auth.details}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-gray-400" />
                            System Availability History
                        </h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis hide domain={[0, 12]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="stepAfter"
                                        dataKey="statusValue"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorStatus)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Logs List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Logs</h3>
                        <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                            {logs.map((log) => (
                                <div key={log._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${log.status === 'healthy' ? 'bg-green-100 text-green-700' :
                                            log.status === 'degraded' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {log.status}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${log.services?.mongodb?.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            Mongo
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${['connected'].includes(log.services?.whatsboost?.status) ? 'bg-green-500' :
                                                ['error', 'disconnected'].includes(log.services?.whatsboost?.status) ? 'bg-red-500' : 'bg-gray-300'
                                                }`}></div>
                                            WhatsBoost
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ title, status, icon, details, extraInfo }) {
    const getColor = (s) => {
        const lower = s?.toLowerCase();
        if (['healthy', 'up', 'connected', 'secure'].includes(lower)) return 'text-green-600 bg-green-50 border-green-200';
        if (['degraded', 'monitor', 'unknown'].includes(lower)) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const colorClass = getColor(status);

    return (
        <div className={`p-5 rounded-xl border-2 ${colorClass} transition-all`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-white bg-opacity-60 rounded-lg backdrop-blur-sm">
                    {icon}
                </div>
                <span className="text-xs font-bold uppercase px-2 py-1 bg-white bg-opacity-50 rounded">
                    {status}
                </span>
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-90 font-medium">{details}</p>
            {extraInfo && <p className="text-xs mt-2 opacity-75">{extraInfo}</p>}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${data.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Status: <span className="font-medium capitalize">{data.status}</span>
                    </p>
                    <p className="text-gray-600">Mongo Latency: {data.mongoLatency}ms</p>
                </div>
            </div>
        );
    }
    return null;
};
