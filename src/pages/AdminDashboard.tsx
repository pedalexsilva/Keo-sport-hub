import React, { useState, useEffect } from 'react';
import { useTickets, useUpdateTicket, useAdminTickets, useTicketStats } from '../hooks/useTickets';
import { useUsers, useUserStats, useDepartmentRanking } from '../hooks/useUsers';
import { useLogout } from '../hooks/useLogout';
import { useEvents } from '../hooks/useEvents';
import { useAdminStore } from '../hooks/useAdminStore';
import { useGlobalStats } from '../hooks/useAnalytics';
import { useDashboardFeed } from '../hooks/useDashboardFeed';
import {
    LayoutDashboard,
    Calendar,
    Image,
    Users,
    LogOut,
    Settings,
    Plus,
    Search,
    Bell,
    Trash2,
    Edit2,
    Save,
    UploadCloud,
    CheckCircle2,
    BarChart3,
    MapPin,
    Clock,
    ArrowUpRight,
    ChevronRight,
    Trophy,
    Ban,
    Gift,
    Target,
    Zap,
    Activity,
    AlertCircle,
    ShoppingBag,
    Package,
    Truck,
    XCircle,
    PieChart,
    TrendingUp,
    Leaf,
    Download,
    MessageSquare, // New for Communications
    Send,          // New for Sending
    LifeBuoy,      // New for Support
    CheckSquare,   // New for Resolving Tickets
    Filter,
    Menu,           // New for Menu Management
    Medal,
    X
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

// --- MOCK DATA REMOVED ---


// --- COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }: { activeTab: string, setActiveTab: (tab: string) => void, isOpen: boolean, onClose: () => void }) => {
    // Grouped Menu Structure
    const menuGroups = [
        {
            title: "OVERVIEW",
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'analytics', label: 'Analytics & ROI', icon: PieChart },
            ]
        },
        {
            title: "MANAGEMENT",
            items: [
                { id: 'events', label: 'Event Management', icon: Calendar },
                { id: 'results', label: 'Results', icon: Medal },
                { id: 'store', label: 'Store & Rewards', icon: ShoppingBag },
            ]
        },
        {
            title: "USERS",
            items: [
                { id: 'users', label: 'Users', icon: Users },
                { id: 'support', label: 'Support / Helpdesk', icon: LifeBuoy },
            ]
        },
        {
            title: "SETTINGS",
            items: [
                { id: 'communications', label: 'Communications', icon: MessageSquare },
                { id: 'app_menu', label: 'App Menus', icon: Menu },
                { id: 'cms', label: 'Landing Page', icon: Image },
                { id: 'settings', label: 'Settings', icon: Settings },
            ]
        }
    ];

    const logout = useLogout();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed left-0 top-0 bottom-0 z-30 
                w-64 bg-[#002D72] text-white shadow-xl overflow-y-auto no-scrollbar
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="p-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-widest">KEO <span className="text-[#009CDE] font-light">ADMIN</span></h1>
                    <button onClick={onClose} className="md:hidden text-white/70 hover:text-white p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 pb-6 space-y-6">
                    {menuGroups.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 px-4">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                if (window.innerWidth < 768) onClose();
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${activeTab === item.id
                                                ? 'bg-[#009CDE] text-white shadow-lg font-bold'
                                                : 'text-blue-100 hover:bg-white/10 hover:text-white font-medium'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 opacity-70" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-6 border-t border-blue-900 mt-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-10 h-10 rounded-full bg-white" />
                        <div>
                            <p className="text-sm font-bold">Admin User</p>
                            <p className="text-xs text-blue-300">Super Admin</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-300 hover:bg-white/10 hover:text-red-200 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
};

// --- VIEWS ---


// --- EXISTING VIEWS (Retained for context) ---

const AnalyticsView = () => {
    const { data: stats } = useGlobalStats();
    const { data: ranking } = useDepartmentRanking();

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Analytics & Health</h2>
                    <p className="text-gray-500 text-sm">Monitoring employee health impact and global ROI.</p>
                </div>
                {/* PDF Report button placeholder */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#002D72] to-blue-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10"><div className="flex items-center gap-2 mb-2 text-blue-200 text-sm font-bold uppercase tracking-wider"><TrendingUp className="w-4 h-4" /> Total Distance</div><div className="text-4xl font-bold mb-1">{stats?.totalDistance?.toLocaleString() || 0} <span className="text-lg font-normal text-blue-300">km</span></div><p className="text-xs text-blue-200">Total accumulated</p></div><MapPin className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-5" />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="flex items-center gap-2 mb-2 text-green-600 text-sm font-bold uppercase tracking-wider"><Leaf className="w-4 h-4" /> Sustainability</div><div className="text-4xl font-bold mb-1 text-gray-800">{stats?.totalCo2?.toLocaleString() || 0} <span className="text-lg font-normal text-gray-400">kg CO2</span></div><p className="text-xs text-gray-500">Saved this month</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="flex items-center gap-2 mb-2 text-orange-500 text-sm font-bold uppercase tracking-wider"><Activity className="w-4 h-4" /> Calories Burned</div><div className="text-4xl font-bold mb-1 text-gray-800">{stats?.totalCalories?.toLocaleString() || 0} <span className="text-lg font-normal text-gray-400">kcal</span></div><p className="text-xs text-gray-500">Total accumulated</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Weekly Activity (Active)</h3>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {(stats?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0]).map((val, i) => (
                            <div key={i} className="w-full bg-blue-50 rounded-t-xl relative group hover:bg-blue-100 transition-all cursor-pointer">
                                <div className="absolute bottom-0 w-full bg-[#009CDE] rounded-t-xl transition-all duration-700" style={{ height: `${Math.min(100, val * 10)}%` }}></div>
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{val}</div>
                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-bold">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i]}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Department Ranking</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {(ranking || []).map((dept, idx) => (
                            <div key={dept.office} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{dept.office}</div>
                                        <div className="text-xs text-gray-500">{dept.userCount} Members</div>
                                    </div>
                                </div>
                                <span className="font-bold text-[#009CDE] text-sm">{dept.totalPoints.toLocaleString()} pts</span>
                            </div>
                        ))}
                        {(!ranking || ranking.length === 0) && <p className="text-sm text-gray-500 text-center py-4">No data available</p>}
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center"><p className="text-xs text-gray-500 mb-2">Winning department wins:</p><p className="text-sm font-bold text-[#002D72] flex items-center justify-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> Team Breakfast</p></div>
                </div>
            </div>
        </div>
    );
};


const DashboardView = () => {
    const { data: totalUsers } = useUserStats();
    const { data: events } = useEvents();
    const { orders } = useAdminStore();
    const { data: globalStats } = useGlobalStats();
    const { data: feed } = useDashboardFeed();

    const activeEvents = events?.filter(e => e.status === 'open').length || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    // Convert meters to KM for display if needed, but globalStats.totalDistance is already in KM
    const totalDistance = globalStats?.totalDistance || 0;

    const stats = [
        { label: "Total Users", value: totalUsers?.toString() || "0", change: "+2%", icon: Users, color: "bg-blue-500" },
        { label: "Active Events", value: activeEvents.toString(), change: "Now", icon: Calendar, color: "bg-[#009CDE]" },
        { label: "Pending Exchanges", value: pendingOrders.toString(), change: "Action", icon: ShoppingBag, color: "bg-purple-500" },
        { label: "Total Km", value: totalDistance.toLocaleString(), change: "Global", icon: MapPin, color: "bg-orange-500" },
    ];

    return (
        <div className="p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4"><div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}><Icon className={`w-6 h-6 text-${stat.color.split('-')[1]}-600`} style={{ color: stat.color.replace('bg-', 'text-') }} /></div><span className="text-xs font-bold text-gray-400 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span></div><h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3><p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-800">Recent Activity</h3><button className="text-sm text-[#009CDE] font-bold">See All</button></div>
                    <div className="space-y-4">
                        {(feed || []).map(item => (
                            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'order' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {item.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 text-sm">{item.title}</div>
                                    <div className="text-xs text-gray-500">{item.subtitle} • {item.date}</div>
                                </div>
                                {item.status && <span className="text-[10px] font-bold uppercase bg-white px-2 py-1 rounded border border-gray-200">{item.status}</span>}
                            </div>
                        ))}
                        {(!feed || feed.length === 0) && <p className="text-sm text-gray-500 text-center py-8">No recent activity to show.</p>}
                    </div>
                </div>
                <div className="bg-[#002D72] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                        <div className="space-y-3"><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><Plus className="w-4 h-4" /> Create New Event</button><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><Bell className="w-4 h-4" /> Send Push Notification</button><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><UploadCloud className="w-4 h-4" /> Export Data (CSV)</button></div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#009CDE] rounded-full opacity-20 blur-2xl"></div>
                </div>
            </div>
        </div>
    );
};

// Imported hooks
import { useCreateEvent, useDeleteEvent } from '../hooks/useEvents';
import { ActivityType } from '../types';

import { EventsManager } from '../components/admin/EventsManager';

import { ResultsManager } from '../components/admin/ResultsManager';

const StoreManagerView = () => {
    const { products, orders, loading, addProduct, updateProduct, deleteProduct, updateOrderStatus, refresh, uploadProductImage } = useAdminStore();
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', cost: 0, stock: 0, category: 'Merch', image_url: '', is_featured: false
    });

    const handleSaveProduct = async () => {
        if (editingProduct) {
            await updateProduct(editingProduct.id, newProduct);
        } else {
            await addProduct(newProduct);
        }
        setShowProductModal(false);
        setEditingProduct(null);
        setNewProduct({ name: '', description: '', cost: 0, stock: 0, category: 'Merch', image_url: '', is_featured: false });
    };

    const openEditModal = (product: any) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            description: product.description,
            cost: product.cost,
            stock: product.stock,
            category: product.category,
            image_url: product.image_url,
            is_featured: product.is_featured || false
        });
        setShowProductModal(true);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setNewProduct({ name: '', description: '', cost: 0, stock: 0, category: 'Merch', image_url: '', is_featured: false });
        setShowProductModal(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        setIsUploading(true);
        try {
            const url = await uploadProductImage(e.target.files[0]);
            setNewProduct({ ...newProduct, image_url: url });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Error uploading image");
        } finally {
            setIsUploading(false);
        }
    };



    if (loading) return <div>Loading store...</div>;

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-800">Store & Rewards</h2><p className="text-gray-500 text-sm">Manage catalog and approve point exchanges.</p></div><button onClick={openCreateModal} className="bg-[#002D72] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition shadow-lg"><Plus className="w-5 h-5" /> New Product</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Truck className="w-4 h-4 text-[#009CDE]" /> Recent Exchange Requests</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full">{orders.filter(o => o.status === "pending").length} Pending</span>
                    </div>
                    {/* Desktop Table */}
                    <table className="w-full text-left hidden md:table">
                        <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Employee</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Item</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-blue-50/30">
                                    <td className="px-6 py-4"><div className="font-bold text-sm text-gray-900">{order.user_email}</div><div className="text-xs text-gray-400">{formatDate(order.created_at)}</div></td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{order.product?.name}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        {order.status === 'pending' && (<div className="flex justify-end gap-2">
                                            <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-green-50 text-green-600 p-1.5 rounded hover:bg-green-100" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                                            <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100" title="Reject"><XCircle className="w-4 h-4" /></button>
                                        </div>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3 p-4 bg-gray-50">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{order.user_email}</div>
                                        <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
                                </div>
                                <div className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                                    <span className="text-xs font-bold text-gray-400 block uppercase">Item</span>
                                    {order.product?.name}
                                </div>
                                {order.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-100"><CheckCircle2 className="w-3 h-3" /> Approve</button>
                                        <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-100"><XCircle className="w-3 h-3" /> Reject</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-[#009CDE]" /> Current Catalog</h3></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {products.map(prod => (
                            <div key={prod.id} className="flex gap-3 items-center p-3 border border-gray-100 rounded-xl hover:shadow-md transition bg-white">
                                {prod.image_url ? (
                                    <img src={prod.image_url} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Image className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        {prod.name}
                                        {prod.is_featured && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Featured</span>}
                                    </p>
                                    <div className="flex justify-between mt-1"><span className="text-xs font-bold text-[#009CDE]">{prod.cost} pts</span><span className="text-xs text-gray-500">Stock: {prod.stock}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(prod)} className="text-gray-400 hover:text-[#009CDE]"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={async () => { if (confirm('Delete product?')) await deleteProduct(prod.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showProductModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-[#002D72] mb-6">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost (Pts)</label><input type="number" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.cost} onChange={e => setNewProduct({ ...newProduct, cost: parseInt(e.target.value) })} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label><input type="number" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })} /></div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    className="w-4 h-4 text-[#002D72] rounded focus:ring-[#002D72]"
                                    checked={newProduct.is_featured}
                                    onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                                />
                                <label htmlFor="is_featured" className="text-sm font-bold text-[#002D72] cursor-pointer selection:bg-none">
                                    Feature this product in store
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image</label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        {newProduct.image_url && <img src={newProduct.image_url} className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-200" />}
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm mb-2"
                                                placeholder="Or paste a URL..."
                                                value={newProduct.image_url}
                                                onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="product-image-upload"
                                                    accept="image/*"
                                                    disabled={isUploading}
                                                />
                                                <label
                                                    htmlFor="product-image-upload"
                                                    className={`flex items-center justify-center gap-2 w-full p-2 bg-white border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[#009CDE] transition ${isUploading ? 'opacity-50' : ''}`}
                                                >
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#002D72]" /> : <UploadCloud className="w-4 h-4 text-gray-400" />}
                                                    <span className="text-xs font-bold text-gray-500">{isUploading ? 'Uploading...' : 'Upload File'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setShowProductModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                                <button onClick={handleSaveProduct} disabled={isUploading} className="flex-1 py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900 flex items-center justify-center gap-2">
                                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingProduct ? 'Save' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const UsersView = () => {
    const { data: usersData, isLoading } = useUsers();

    const users = usersData || [];

    const handleBonus = (id: string) => {
        // Implement bonus logic here or open a modal
        alert("Bonus functionality to implement with backend.");
    };

    return (
        <div className="p-8 animate-fade-in h-full">
            <div className="flex justify-between items-center mb-8"><div><h2 className="text-2xl font-bold text-gray-800">Users</h2><p className="text-gray-500 text-sm">Manage employees, permissions, and gamification.</p></div></div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Employee</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role & Office</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Points (Balance)</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50/50 transition">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={user.avatar} className="w-8 h-8 rounded-full bg-gray-200" /><div><div className="font-bold text-gray-900">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div></div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900">{user.role}</div><div className="text-xs text-[#009CDE] font-medium">{user.office}</div></td>
                                        <td className="px-6 py-4"><div className="font-bold text-gray-700">{user.points.toLocaleString()} pts</div></td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{user.status === 'Ativo' ? 'Active' : user.status}</span></td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => handleBonus(user.id)} title="Bonus" className="bg-yellow-100 text-yellow-600 p-2 rounded-lg hover:bg-yellow-200 transition"><Gift className="w-4 h-4" /></button><button title="Edit" className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"><Edit2 className="w-4 h-4" /></button><button title="Block" className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition"><Ban className="w-4 h-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4 bg-gray-50">
                            {users.map((user) => (
                                <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-200" />
                                        <div>
                                            <div className="font-bold text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.office}</div>
                                        </div>
                                        <div className="ml-auto">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Role</div>
                                            <div className="text-sm">{user.role}</div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <div className="text-[10px] text-blue-400 font-bold uppercase">Pontos</div>
                                            <div className="text-sm font-bold text-blue-800">{user.points.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => handleBonus(user.id)} className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Gift className="w-3 h-3" /> Bonus</button>
                                        <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

import { useCMS, useUpdateCMS, useNotifications, useCreateNotification, uploadCMSMedia, useOfficeLocations, useUpdateOfficeLocations, OfficeLocation } from '../hooks/useCMS';
import { Loader2 } from 'lucide-react';

const CommunicationsView = () => {
    const { data: notifications } = useNotifications();
    const createNotification = useCreateNotification();
    const [newMessage, setNewMessage] = useState({ title: '', message: '', type: 'info' as 'info' | 'warning' | 'success' });

    const handleSend = async () => {
        if (!newMessage.title || !newMessage.message) return;
        await createNotification.mutateAsync({
            title: newMessage.title,
            message: newMessage.message,
            type: newMessage.type
        });
        setNewMessage({ title: '', message: '', type: 'info' });
        alert("Sent successfully!");
    };

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div><h2 className="text-2xl font-bold text-gray-800">Communications</h2><p className="text-gray-500 text-sm">Send notifications and emails to the organization.</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Send className="w-4 h-4 text-[#009CDE]" /> New Message</h3>
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#009CDE] outline-none" value={newMessage.title} onChange={e => setNewMessage({ ...newMessage, title: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label><textarea className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#009CDE] outline-none h-32" value={newMessage.message} onChange={e => setNewMessage({ ...newMessage, message: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label><select className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none" value={newMessage.type} onChange={e => setNewMessage({ ...newMessage, type: e.target.value as any })}><option value="info">Information</option><option value="warning">Important Warning</option><option value="success">Success / Congratulations</option></select></div>
                        <button onClick={handleSend} className="w-full py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Send Notification</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Clock className="w-4 h-4 text-[#009CDE]" /> Recent History</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px]">
                        {(notifications || []).map((msg) => (
                            <div key={msg.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800">{msg.title}</h4><span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span></div>
                                <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${msg.type === 'warning' ? 'bg-red-100 text-red-600' : msg.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{msg.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SupportView = () => {
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('all');

    // Pagination reset when filter changes
    useEffect(() => {
        setPage(1);
    }, [filter]);

    const { data: ticketsData, isLoading, isFetching } = useAdminTickets({ page, status: filter });
    const { data: stats } = useTicketStats();
    const updateTicket = useUpdateTicket();

    const tickets = ticketsData?.data || [];
    const totalCount = ticketsData?.count || 0;
    const totalPages = Math.ceil(totalCount / 20);

    const handleResolve = async (id: string) => {
        if (confirm("Mark as resolved?")) {
            await updateTicket.mutateAsync({ id, status: 'resolved' });
        }
    };

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Support & Helpdesk</h2>
                    <p className="text-gray-500 text-sm">Manage support requests.</p>
                </div>
                <span className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm">
                    {stats?.open || 0} Open Tickets
                </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm flex flex-col h-full max-h-[calc(100vh-250px)]">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex gap-4">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'all' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>All</button>
                        <button onClick={() => setFilter('open')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'open' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>Open</button>
                        <button onClick={() => setFilter('resolved')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'resolved' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>Resolved</button>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500">
                        {isFetching && <Loader2 className="w-4 h-4 animate-spin text-[#009CDE]" />}
                        <span className="text-xs font-bold">
                            {totalCount === 0 ? '0' : ((page - 1) * 20 + 1)}-{Math.min(page * 20, totalCount)} de {totalCount}
                        </span>
                        <div className="flex gap-1">
                            <button
                                disabled={page === 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <button
                                disabled={page >= totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading && tickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">Loading tickets...</div>
                    ) : (
                        <div className="w-full">
                            {/* Desktop Table */}
                            <table className="w-full text-left relative hidden md:table">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 uppercase">Priority</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 font-bold text-gray-500 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {tickets.map(t => (
                                        <tr key={t.id} className="hover:bg-blue-50/50">
                                            <td className="px-6 py-4 font-bold text-gray-800">{t.user_email}</td>
                                            <td className="px-6 py-4 text-gray-600">{t.subject}</td>
                                            <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600 uppercase">{t.priority}</span></td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                {t.status === 'open' && (
                                                    <button onClick={() => handleResolve(t.id)} className="text-[#009CDE] font-bold hover:underline">Resolve</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3 p-4">
                                {tickets.map(t => (
                                    <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-gray-900 text-sm">{t.user_email}</div>
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase">Subject</div>
                                            <div className="text-gray-700">{t.subject}</div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600 uppercase">{t.priority}</span>
                                            {t.status === 'open' && (
                                                <button onClick={() => handleResolve(t.id)} className="text-[#009CDE] font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">Resolve</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!isLoading && tickets.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No tickets to show.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import { useAppMenu, useUpdateAppMenu, AppMenuConfig } from '../hooks/useCMS';

const MenuManagerView = () => {
    const { data: menuItems, isLoading } = useAppMenu();
    const updateMenu = useUpdateAppMenu();
    const [localMenu, setLocalMenu] = useState<AppMenuConfig[]>([]);

    useEffect(() => {
        if (menuItems) setLocalMenu(menuItems);
    }, [menuItems]);

    const handleSave = async () => {
        if (confirm("This will update the App menu for all users. Continue?")) {
            await updateMenu.mutateAsync(localMenu);
            alert("Menu updated successfully!");
        }
    };

    const handleUpdateItem = (index: number, field: keyof AppMenuConfig, value: string) => {
        const newMenu = [...localMenu];
        newMenu[index] = { ...newMenu[index], [field]: value };
        setLocalMenu(newMenu);
    };

    if (isLoading) return <div>Carregando menus...</div>;

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Menus da App</h2>
                    <p className="text-gray-500 text-sm">Configure os separadores que aparecem na aplicação móvel.</p>
                </div>
                <button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg">
                    <Save className="w-5 h-5" /> Publicar Alterações
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-4">
                    {localMenu.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex-none flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border border-gray-200">
                                <span className="text-xs font-bold text-gray-400 mb-1">Ícone</span>
                                <span className="text-xs font-mono text-[#002D72]">{item.icon}</span>
                            </div>

                            <div className="flex-1 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">ID (Interno)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-mono text-gray-500"
                                        value={item.id}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label (Visível)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[#009CDE] outline-none"
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rota / Caminho</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-mono text-gray-600 focus:ring-2 focus:ring-[#009CDE] outline-none"
                                        value={item.path}
                                        onChange={(e) => handleUpdateItem(idx, 'path', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <strong>Dica:</strong> Os ícones suportados incluem: Home, Calendar, ShoppingBag, Users, User, Menu, Settings, Bell, MessageSquare, LifeBuoy.
                    </p>
                </div>
            </div>
        </div>
    );
};

const CMSView = () => {
    const { data: config, isLoading } = useCMS();
    const updateCMS = useUpdateCMS();
    const [localConfig, setLocalConfig] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Office Locations
    const { data: offices, isLoading: officesLoading } = useOfficeLocations();
    const updateOffices = useUpdateOfficeLocations();
    const [localOffices, setLocalOffices] = useState<OfficeLocation[]>([]);
    const [newOfficeName, setNewOfficeName] = useState('');

    // Sync local state when data loads
    useEffect(() => {
        if (config) setLocalConfig(config);
    }, [config]);

    useEffect(() => {
        if (offices) setLocalOffices(offices);
    }, [offices]);

    const handleSave = async () => {
        await updateCMS.mutateAsync(localConfig);
        alert("Guardado com sucesso!");
    };

    const handleSaveOffices = async () => {
        await updateOffices.mutateAsync(localOffices);
        alert("Escritórios guardados com sucesso!");
    };

    const handleAddOffice = () => {
        if (!newOfficeName.trim()) return;
        const id = newOfficeName.toLowerCase().replace(/\s+/g, '-');
        setLocalOffices([...localOffices, { id, name: newOfficeName.trim() }]);
        setNewOfficeName('');
    };

    const handleRemoveOffice = (id: string) => {
        setLocalOffices(localOffices.filter(o => o.id !== id));
    };

    const handleUpdateOfficeName = (id: string, newName: string) => {
        setLocalOffices(localOffices.map(o => o.id === id ? { ...o, name: newName } : o));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const url = await uploadCMSMedia(file);
            setLocalConfig({ ...localConfig, heroImage: url });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Erro ao carregar ficheiro.");
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading || !localConfig || officesLoading) return <div>Carregando CMS...</div>;

    const isVideo = localConfig.heroImage?.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8 overflow-y-auto">
            <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-800">Landing Page CMS</h2><p className="text-gray-500 text-sm">Personalize o conteúdo da página inicial (pública).</p></div><button onClick={handleSave} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg"><Save className="w-5 h-5" /> Guardar Alterações</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Hero Section</h3>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Principal</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none" value={localConfig.heroTitle} onChange={e => setLocalConfig({ ...localConfig, heroTitle: e.target.value })} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none" value={localConfig.heroSubtitle} onChange={e => setLocalConfig({ ...localConfig, heroSubtitle: e.target.value })} /></div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagem ou Vídeo de Fundo</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="URL (ou faça upload abaixo)"
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm text-gray-600"
                                value={localConfig.heroImage}
                                onChange={e => setLocalConfig({ ...localConfig, heroImage: e.target.value })}
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="hero-media-upload"
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="hero-media-upload"
                                    className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#009CDE] hover:bg-blue-50 transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin text-[#002D72]" />
                                            <span className="text-gray-500 font-medium">A carregar...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-500 font-medium">Carregar Imagem ou Vídeo</span>
                                        </>
                                    )}
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-400">Suporta JPG, PNG, WEBP, MP4, WEBM (Max 50MB)</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100"><h3 className="font-bold text-gray-800 mb-4">Barra de Avisos</h3><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto do Aviso (Topo)</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none" value={localConfig.announcement} onChange={e => setLocalConfig({ ...localConfig, announcement: e.target.value })} /></div></div>
                </div>
                <div className="bg-gray-100 rounded-2xl border-4 border-gray-200 overflow-hidden relative group">
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold z-10">Preview (Ao Vivo)</div>
                    <div className="w-full h-full bg-white transform scale-75 origin-top-left w-[133%] h-[133%] pointer-events-none select-none">
                        {/* Mini Preview of Landing Page */}
                        <div className="relative h-full flex flex-col">
                            {localConfig.announcement && <div className="bg-[#009CDE] text-white text-center py-2 text-sm font-bold">{localConfig.announcement}</div>}
                            <div className="relative h-[500px] flex items-center justify-center text-center px-4 overflow-hidden">
                                {isVideo ? (
                                    <video
                                        src={localConfig.heroImage}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <div
                                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${localConfig.heroImage})` }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">{localConfig.heroTitle}</h1>
                                    <p className="text-xl text-gray-200 max-w-2xl mx-auto">{localConfig.heroSubtitle}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Office Locations Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#009CDE]" /> Office Locations</h3>
                        <p className="text-xs text-gray-500 mt-1">Localizações disponíveis no Onboarding para os utilizadores escolherem o seu escritório.</p>
                    </div>
                    <button onClick={handleSaveOffices} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm">
                        <Save className="w-4 h-4" /> Guardar Escritórios
                    </button>
                </div>

                {/* Add New Office */}
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Nome do novo escritório (ex: Singapore)"
                        className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#009CDE]"
                        value={newOfficeName}
                        onChange={e => setNewOfficeName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddOffice()}
                    />
                    <button
                        onClick={handleAddOffice}
                        className="bg-[#002D72] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition"
                    >
                        <Plus className="w-5 h-5" /> Adicionar
                    </button>
                </div>

                {/* List of Offices */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {localOffices.map((office) => (
                        <div key={office.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#009CDE] transition">
                            <MapPin className="w-4 h-4 text-[#009CDE] flex-shrink-0" />
                            <input
                                type="text"
                                className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800 min-w-0"
                                value={office.name}
                                onChange={e => handleUpdateOfficeName(office.id, e.target.value)}
                            />
                            <button
                                onClick={() => handleRemoveOffice(office.id)}
                                className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {localOffices.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum escritório configurado. Adicione localizações acima.</p>
                    </div>
                )}

                <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-800 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span><strong>Dica:</strong> Estas localizações aparecem no formulário de Onboarding quando novos utilizadores se registam na plataforma.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

const SettingsView = () => {
    const [stravaConnected, setStravaConnected] = useState(false);
    const [checkingStrava, setCheckingStrava] = useState(true);
    const [connectingStrava, setConnectingStrava] = useState(false);

    // Check if current admin has Strava connected
    useEffect(() => {
        const checkStravaConnection = async () => {
            try {
                const { supabase } = await import('../lib/supabase');
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('strava_tokens').select('id').eq('user_id', user.id).single();
                    setStravaConnected(!!data);
                }
            } catch (e) {
                console.log('Strava check error:', e);
            } finally {
                setCheckingStrava(false);
            }
        };
        checkStravaConnection();
    }, []);

    const handleConnectStrava = async () => {
        setConnectingStrava(true);
        try {
            console.log('✅ Admin: Requesting Strava auth with return URL: /admin');

            const { getStravaAuthUrl } = await import('../features/strava/services/strava');
            window.location.href = await getStravaAuthUrl('/admin');
        } catch (e) {
            alert('Error connecting to Strava');
            setConnectingStrava(false);
        }
    };

    return (
        <div className="p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Definições Globais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Regras de Gamificação</h3><div className="space-y-6"><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Pontos por Km (Corrida) <span className="text-[#009CDE]">10 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Pontos por 1000 Passos <span className="text-[#009CDE]">5 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Bónus de Check-in Evento <span className="text-[#009CDE]">50 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div></div></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-red-500" /> Metas da Empresa</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objetivo Mensal Global (Pontos)</label><input type="number" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" defaultValue="40000" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prémio Batalha Escritórios</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" defaultValue="Almoço de Equipa" /></div><div className="flex items-center gap-2 mt-2"><input type="checkbox" checked className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm text-gray-600">Reiniciar Ranking automaticamente ao dia 1</span></div></div></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                    <h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500" /> Integrações API</h3>

                    <div className="border-2 rounded-xl overflow-hidden" style={{
                        borderColor: stravaConnected ? '#10b981' : '#f97316'
                    }}>
                        {/* Header with Status */}
                        <div className="flex items-center justify-between p-6" style={{
                            backgroundColor: stravaConnected ? '#ecfdf5' : '#fff7ed'
                        }}>
                            <div className="flex items-center gap-5">
                                <div className="bg-[#FC4C02] p-3 rounded-xl shadow-md flex items-center justify-center">
                                    <Activity className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">Strava API</h4>
                                    <p className="text-sm text-gray-600 leading-tight">Sincronização de atividades e segmentos KOM</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                {checkingStrava ? (
                                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-2.5 rounded-lg">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                        <span className="text-sm font-medium text-gray-600">A verificar...</span>
                                    </div>
                                ) : stravaConnected ? (
                                    <div className="flex items-center gap-2 bg-green-500 px-6 py-3 rounded-xl shadow-md">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wide">Conectado</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConnectStrava}
                                        disabled={connectingStrava}
                                        className="bg-[#FC4C02] hover:bg-[#e04402] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2.5 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {connectingStrava ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-sm">A conectar...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Activity className="w-5 h-5" />
                                                <span className="text-sm">Conectar Strava</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Info/Warning Section */}
                        <div className="px-6 pb-6">
                            {stravaConnected ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900 mb-1.5 leading-tight">Conta Strava Conectada</p>
                                        <p className="text-xs text-green-700 leading-relaxed">
                                            Pode agora usar o auto-preenchimento de segmentos KOM e sincronizar resultados de atividades automaticamente.
                                        </p>
                                    </div>
                                </div>
                            ) : !checkingStrava && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-orange-900 mb-1.5 leading-tight">Strava Não Conectado</p>
                                        <p className="text-xs text-orange-700 leading-relaxed">
                                            Conecte a sua conta Strava para usar o auto-preenchimento de segmentos KOM e sincronização automática de resultados.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN LAYOUT ---

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const logout = useLogout();

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView />;
            case 'users': return <UsersView />;
            case 'events': return <EventsManager />;
            case 'products': return <StoreManagerView />; // Legacy?
            case 'store': return <StoreManagerView />;
            case 'support': return <SupportView />;
            case 'analytics': return <AnalyticsView />;
            case 'cms': return <CMSView />;
            case 'communications': return <CommunicationsView />;
            case 'app_menu': return <MenuManagerView />;
            case 'results': return <ResultsManager />;
            case 'settings': return <SettingsView />;
            default: return <DashboardView />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-10 md:hidden flex items-center px-4 justify-between">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-1.5 select-none">
                    <div className="bg-[#002D72] text-white px-2 py-1 font-bold tracking-widest text-sm">KEO</div>
                    <span className="text-[#009CDE] font-light tracking-widest text-sm">ADMIN</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <main className="flex-1 md:ml-64 pt-16 md:pt-0 transition-all duration-300">
                {renderContent()}
            </main>
        </div>
    );
}
