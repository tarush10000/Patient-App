"use client";

import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Database,
    Loader2,
    MessageCircle,
    Play,
    RefreshCw,
    Shield,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export default function PublicHealthPage() {
    const [loading, setLoading] = useState(false);
    const [testsRunning, setTestsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [testResults, setTestResults] = useState(null);
    const [secret, setSecret] = useState('');
    const [isAuthed, setIsAuthed] = useState(false);
    const [stats, setStats] = useState({
        overall: 'uninitialized',
        mongodb: { status: 'unknown', latency: 0 },
        whatsboost: { status: 'unknown' },
        auth: { status: 'unknown' },
        lastChecked: null
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Extract secret from URL
        const params = new URLSearchParams(window.location.search);
        const urlSecret = params.get('secret');
        if (urlSecret) {
            setSecret(urlSecret);
            setIsAuthed(true);
            fetchHealthData(urlSecret, true);
        }
    }, []);

    const fetchHealthData = async (sec, shouldTriggerNew = false) => {
        setLoading(true);
        try {
            if (shouldTriggerNew) {
                const checkRes = await fetch('/api/health', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-health-secret': sec
                    }
                });
                if (checkRes.status === 401) throw new Error('Invalid secret');
                if (!checkRes.ok) throw new Error('Health check failed');
            }

            const res = await fetch(`/api/health?secret=${sec}&limit=100`);
            const data = await res.json();

            if (data.logs && data.logs.length > 0) {
                setLogs(data.logs);
                processStats(data.logs);
            }
        } catch (error) {
            console.error('Error fetching health data:', error);
        } finally {
            setLoading(false);
        }
    };

    const runTests = async () => {
        setTestsRunning(true);
        try {
            const res = await fetch(`/api/health/run-tests?secret=${secret}`);
            const data = await res.json();
            setTestResults(data);
        } catch (error) {
            console.error('Error running tests:', error);
            setTestResults({
                success: false,
                error: error.message
            });
        } finally {
            setTestsRunning(false);
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

    // If not authed, show access form
    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Shield className="text-blue-400" size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">System Health Monitor</h1>
                            <p className="text-slate-400 text-sm">Enter access key to continue</p>
                        </div>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formSecret = e.target.secret.value;
                        if (formSecret) {
                            setSecret(formSecret);
                            setIsAuthed(true);
                            // Update URL without reload
                            const url = new URL(window.location);
                            url.searchParams.set('secret', formSecret);
                            window.history.replaceState({}, '', url);
                            fetchHealthData(formSecret, true);
                        }
                    }}>
                        <input
                            type="password"
                            name="secret"
                            placeholder="Health access secret"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 mb-4"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        >
                            Access Monitor
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-blue-400" />
                            System Health Monitor
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Last updated: {stats.lastChecked ? stats.lastChecked.toLocaleString() : 'Never'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={runTests}
                            disabled={testsRunning}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
                        >
                            {testsRunning
                                ? <Loader2 size={18} className="animate-spin" />
                                : <Play size={18} />
                            }
                            {testsRunning ? 'Running Tests...' : 'Run API Tests'}
                        </button>
                        <button
                            onClick={() => fetchHealthData(secret, true)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/10 border border-blue-500/20"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            {loading ? 'Checking...' : 'Health Check'}
                        </button>
                    </div>
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
                        details={stats.whatsboost.status === 'connected' ? 'Device Connected' : (stats.whatsboost.details || stats.whatsboost.status)}
                    />
                    <StatusCard
                        title="Security & Auth"
                        status={stats.auth.status}
                        icon={<Shield size={24} />}
                        details={stats.auth.details}
                    />
                </div>

                {/* Test Results Panel */}
                {testResults && (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {testResults.success
                                    ? <CheckCircle2 className="text-emerald-400" size={22} />
                                    : <XCircle className="text-red-400" size={22} />
                                }
                                API Test Results
                            </h3>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-slate-400">
                                    {testResults.timestamp && new Date(testResults.timestamp).toLocaleString()}
                                </span>
                                {testResults.cached && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-xs font-medium">
                                        CACHED
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                            <TestStat label="Total" value={testResults.numTotalTests} color="text-slate-300" />
                            <TestStat label="Passed" value={testResults.numPassedTests} color="text-emerald-400" />
                            <TestStat label="Failed" value={testResults.numFailedTests} color="text-red-400" />
                            <TestStat label="Duration" value={testResults.duration ? `${Math.round(testResults.duration / 1000)}s` : '—'} color="text-blue-400" />
                        </div>

                        {/* Individual Test Suites */}
                        {testResults.testSuites?.map((suite, i) => (
                            <div key={i} className="mb-4 last:mb-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        suite.status === 'passed'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-red-500/20 text-red-300'
                                    }`}>
                                        {suite.status}
                                    </span>
                                    <span className="text-white font-medium">{suite.name}</span>
                                    <span className="text-slate-500 text-xs">
                                        {suite.duration ? `${Math.round(suite.duration / 1000)}s` : ''}
                                    </span>
                                </div>
                                <div className="space-y-1 pl-4 border-l-2 border-slate-700/50">
                                    {suite.tests?.map((test, j) => (
                                        <div key={j} className="flex items-start gap-2 py-1">
                                            {test.status === 'passed'
                                                ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                : test.status === 'failed'
                                                    ? <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                    : <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                            }
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-slate-300">{test.name}</span>
                                                {test.duration != null && (
                                                    <span className="text-xs text-slate-500 ml-2">
                                                        {test.duration}ms
                                                    </span>
                                                )}
                                                {test.error && (
                                                    <pre className="mt-1 p-2 bg-red-900/20 border border-red-500/20 rounded-lg text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                                                        {test.error}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Raw output fallback */}
                        {testResults.rawOutput && !testResults.testSuites && (
                            <pre className="mt-3 p-3 bg-slate-900/50 rounded-xl text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-64">
                                {testResults.rawOutput}
                            </pre>
                        )}

                        {testResults.error && !testResults.testSuites && (
                            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-xl">
                                <p className="text-red-300 text-sm font-medium">Error</p>
                                <p className="text-red-400/80 text-xs mt-1">{testResults.error}</p>
                                {testResults.details && (
                                    <pre className="text-red-400/60 text-xs mt-2 whitespace-pre-wrap">{testResults.details}</pre>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Charts and Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Availability Chart */}
                    <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-slate-400" />
                            System Availability History
                        </h3>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis hide domain={[0, 12]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="stepAfter"
                                        dataKey="statusValue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorStatus)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Logs */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-white mb-4">Recent Logs</h3>
                        <div className="overflow-y-auto flex-1 space-y-3 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                            {logs.map((log) => (
                                <div key={log._id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${log.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-300' :
                                            log.status === 'degraded' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                                            }`}>
                                            {log.status}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <div className={`w-2 h-2 rounded-full ${log.services?.mongodb?.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            Mongo
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <div className={`w-2 h-2 rounded-full ${['connected'].includes(log.services?.whatsboost?.status) ? 'bg-emerald-500' :
                                                ['error', 'disconnected'].includes(log.services?.whatsboost?.status) ? 'bg-red-500' : 'bg-slate-500'
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
        if (['healthy', 'up', 'connected', 'secure'].includes(lower))
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
        if (['degraded', 'monitor', 'unknown'].includes(lower))
            return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
        return 'border-red-500/30 bg-red-500/10 text-red-400';
    };

    const colorClass = getColor(status);

    return (
        <div className={`p-5 rounded-2xl border ${colorClass} transition-all backdrop-blur-sm`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800/50 rounded-xl backdrop-blur-sm">
                    {icon}
                </div>
                <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-800/50 rounded-lg">
                    {status}
                </span>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
            <p className="text-sm opacity-80 font-medium">{details}</p>
            {extraInfo && <p className="text-xs mt-2 opacity-60">{extraInfo}</p>}
        </div>
    );
}

function TestStat({ label, value, color }) {
    return (
        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 p-3 border border-slate-700 shadow-xl rounded-xl text-sm">
                <p className="font-bold text-white mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${data.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-slate-400">Status:</span>
                        <span className="font-medium text-white capitalize">{data.status}</span>
                    </p>
                    <p className="text-slate-400">Mongo Latency: <span className="text-white">{data.mongoLatency}ms</span></p>
                </div>
            </div>
        );
    }
    return null;
};
