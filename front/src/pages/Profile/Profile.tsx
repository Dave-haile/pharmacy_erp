import React, { useState } from 'react';
import { User, Shield, Bell, Moon, Sun, Monitor, Globe, Lock, Save, Camera, Settings } from 'lucide-react';
import { useTheme } from '../components/context/ThemeContext';
import { useAuth } from '../auth/AuthContext';

const Profile: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        firstName: user?.first_name,
        lastName: user?.last_name,
        email: user?.email,
        role: user?.role,
        department: user?.department,
        notifications: {
            email: true,
            browser: true,
            critical: true
        },
        language: 'English (US)'
    });

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert('Settings saved successfully!');
        }, 1000);
    };

    const themeIcons = {
        light: <Sun className="w-4 h-4" />,
        dark: <Moon className="w-4 h-4" />,
        system: <Monitor className="w-4 h-4" />
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">User Profile & Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-widest mt-1">Manage your account preferences and security</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-emerald-500/10 dark:bg-emerald-500/5"></div>
                        <div className="relative">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-emerald-500/20 mx-auto">
                                    JD
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg hover:scale-110 transition-transform">
                                    <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>
                            <h2 className="mt-4 text-xl font-black text-slate-800 dark:text-white">{formData.fullName}</h2>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1">{formData.role}</p>
                            <div className="mt-6 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Verified Account</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Actions</h3>
                        <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                            <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                <Lock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Change Password</p>
                                <p className="text-[9px] font-bold text-slate-500">Last changed 3 months ago</p>
                            </div>
                        </button>
                        <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                            <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                                <Bell className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Notification History</p>
                                <p className="text-[9px] font-bold text-slate-500">View recent alerts</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Column: Detailed Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Account Details */}
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                            <User className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-black text-slate-800 dark:text-white">Account Details</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    readOnly
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                                    >
                                        <option>English (US)</option>
                                        <option>German (DE)</option>
                                        <option>French (FR)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Preferences */}
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                            <Settings className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-black text-slate-800 dark:text-white">System Preferences</h3>
                        </div>
                        <div className="p-8 space-y-8">
                            {/* Theme Selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interface Theme</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['light', 'dark', 'system'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTheme(t)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${theme === t
                                                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            {themeIcons[t]}
                                            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{t}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Settings</label>
                                <div className="space-y-3">
                                    {[
                                        { key: 'email', label: 'Email Notifications', desc: 'Receive batch alerts and reports via email' },
                                        { key: 'browser', label: 'Browser Push', desc: 'Real-time desktop notifications for system events' },
                                        { key: 'critical', label: 'Critical Alerts Only', desc: 'Only notify for high-priority compliance issues' }
                                    ].map((notif) => (
                                        <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{notif.label}</p>
                                                <p className="text-[10px] font-bold text-slate-500">{notif.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    notifications: { ...formData.notifications, [notif.key]: !formData.notifications[notif.key as keyof typeof formData.notifications] }
                                                })}
                                                className={`w-10 h-6 rounded-full transition-all relative ${formData.notifications[notif.key as keyof typeof formData.notifications] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                                    }`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.notifications[notif.key as keyof typeof formData.notifications] ? 'left-5' : 'left-1'
                                                    }`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center space-x-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
