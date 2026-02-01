import React, { useState, useEffect } from 'react';
import { useTickets, useUpdateTicket, useAdminTickets, useTicketStats } from '../hooks/useTickets';
import { useUsers, useUserStats } from '../hooks/useUsers';
import { useLogout } from '../hooks/useLogout';
import {
    LayoutDashboard,
    Calendar,
    Image,
    Users,
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
    Medal
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

// --- MOCK DATA REMOVED ---


// --- COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
    // Grouped Menu Structure
    const menuGroups = [
        {
            title: "VISÃO GERAL",
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'analytics', label: 'Analytics & ROI', icon: PieChart },
            ]
        },
        {
            title: "GESTÃO",
            items: [
                { id: 'events', label: 'Gestão de Eventos', icon: Calendar },
                { id: 'results', label: 'Resultados', icon: Medal },
                { id: 'store', label: 'Loja & Prémios', icon: ShoppingBag },
            ]
        },
        {
            title: "UTILIZADORES",
            items: [
                { id: 'users', label: 'Utilizadores', icon: Users },
                { id: 'support', label: 'Suporte / Helpdesk', icon: LifeBuoy },
            ]
        },
        {
            title: "CONFIGURAÇÕES",
            items: [
                { id: 'communications', label: 'Comunicações', icon: MessageSquare },
                { id: 'app_menu', label: 'Menus da App', icon: Menu },
                { id: 'cms', label: 'Landing Page', icon: Image },
                { id: 'settings', label: 'Definições', icon: Settings },
            ]
        }
    ];

    return (
        <div className="w-64 bg-[#002D72] text-white min-h-screen flex flex-col fixed left-0 top-0 z-20 shadow-xl overflow-y-auto no-scrollbar">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-widest">KEO <span className="text-[#009CDE] font-light">ADMIN</span></h1>
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
                                        onClick={() => setActiveTab(item.id)}
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
                <div className="flex items-center gap-3">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-10 h-10 rounded-full bg-white" />
                    <div>
                        <p className="text-sm font-bold">Admin User</p>
                        <p className="text-xs text-blue-300">Super Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- VIEWS ---


// --- EXISTING VIEWS (Retained for context) ---

const AnalyticsView = () => (
    <div className="p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Analytics & Saúde</h2>
                <p className="text-gray-500 text-sm">Monitorização do impacto na saúde dos colaboradores e ROI.</p>
            </div>
            <button className="bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition">
                <Download className="w-4 h-4" /> Relatório PDF
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#002D72] to-blue-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10"><div className="flex items-center gap-2 mb-2 text-blue-200 text-sm font-bold uppercase tracking-wider"><TrendingUp className="w-4 h-4" /> Distância Total</div><div className="text-4xl font-bold mb-1">0 <span className="text-lg font-normal text-blue-300">km</span></div><p className="text-xs text-blue-200">Total acumulado</p></div><MapPin className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-5" />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="flex items-center gap-2 mb-2 text-green-600 text-sm font-bold uppercase tracking-wider"><Leaf className="w-4 h-4" /> Sustentabilidade</div><div className="text-4xl font-bold mb-1 text-gray-800">0 <span className="text-lg font-normal text-gray-400">kg CO2</span></div><p className="text-xs text-gray-500">Poupados este mês</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="flex items-center gap-2 mb-2 text-orange-500 text-sm font-bold uppercase tracking-wider"><Activity className="w-4 h-4" /> Calorias Queimadas</div><div className="text-4xl font-bold mb-1 text-gray-800">0 <span className="text-lg font-normal text-gray-400">kcal</span></div><p className="text-xs text-gray-500">Total acumulado</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6">Atividade Semanal (Colaboradores Ativos)</h3>
                <div className="h-64 flex items-end justify-between gap-4">
                    {[0, 0, 0, 0, 0, 0, 0].map((val, i) => (
                        <div key={i} className="w-full bg-blue-50 rounded-t-xl relative group hover:bg-blue-100 transition-all cursor-pointer">
                            <div className="absolute bottom-0 w-full bg-[#009CDE] rounded-t-xl transition-all duration-700" style={{ height: `${val}%` }}></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{val} Ativos</div>
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-bold">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i]}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between text-sm text-gray-500"><span>Média Diária: <strong>0 Ativos</strong></span><span>Dados insuficientes</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6">Ranking por Departamento</h3>
                <div className="space-y-5">
                    <p className="text-sm text-gray-500 text-center py-4">Sem dados disponíveis</p>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center"><p className="text-xs text-gray-500 mb-2">Departamento vencedor ganha:</p><p className="text-sm font-bold text-[#002D72] flex items-center justify-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> Pequeno-almoço Equipa</p></div>
            </div>
        </div>
    </div>
);


const DashboardView = () => {
    // Placeholder stats - eventually fetch from DB
    const { data: totalUsers } = useUserStats();

    const stats = [
        { label: "Utilizadores Totais", value: totalUsers?.toString() || "0", change: "0%", icon: Users, color: "bg-blue-500" },
        { label: "Eventos Ativos", value: "0", change: "0", icon: Calendar, color: "bg-[#009CDE]" },
        { label: "Trocas na Loja", value: "0", change: "0%", icon: ShoppingBag, color: "bg-purple-500" },
        { label: "Kms Percorridos (Mês)", value: "0", change: "0%", icon: MapPin, color: "bg-orange-500" },
    ];

    return (
        <div className="p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>
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
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-800">Atividade Recente</h3><button className="text-sm text-[#009CDE] font-bold">Ver relatório</button></div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 text-center py-8">Sem atividade recente para mostrar.</p>
                    </div>
                </div>
                <div className="bg-[#002D72] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-4">Ações Rápidas</h3>
                        <div className="space-y-3"><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><Plus className="w-4 h-4" /> Criar Novo Evento</button><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><Bell className="w-4 h-4" /> Enviar Notificação Push</button><button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-3 transition text-sm font-medium"><UploadCloud className="w-4 h-4" /> Exportar Dados (CSV)</button></div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#009CDE] rounded-full opacity-20 blur-2xl"></div>
                </div>
            </div>
        </div>
    );
};

// Imported hooks
import { useEvents, useCreateEvent, useDeleteEvent } from '../hooks/useEvents';
import { ActivityType } from '../types';

import { EventsManager } from '../components/admin/EventsManager';

import { useAdminStore } from '../hooks/useAdminStore';
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
            alert("Erro ao carregar imagem");
        } finally {
            setIsUploading(false);
        }
    };



    if (loading) return <div>Carregando loja...</div>;

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-800">Loja & Prémios</h2><p className="text-gray-500 text-sm">Gerir catálogo e aprovar trocas de pontos.</p></div><button onClick={openCreateModal} className="bg-[#002D72] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition shadow-lg"><Plus className="w-5 h-5" /> Novo Produto</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Truck className="w-4 h-4 text-[#009CDE]" /> Pedidos de Troca Recentes</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full">{orders.filter(o => o.status === "pending").length} Pendentes</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Colaborador</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Item</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th><th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-blue-50/30">
                                    <td className="px-6 py-4"><div className="font-bold text-sm text-gray-900">{order.user_email}</div><div className="text-xs text-gray-400">{formatDate(order.created_at)}</div></td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{order.product?.name}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        {order.status === 'pending' && (<div className="flex justify-end gap-2">
                                            <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-green-50 text-green-600 p-1.5 rounded hover:bg-green-100" title="Aprovar"><CheckCircle2 className="w-4 h-4" /></button>
                                            <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100" title="Rejeitar"><XCircle className="w-4 h-4" /></button>
                                        </div>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-[#009CDE]" /> Catálogo Atual</h3></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {products.map(prod => (
                            <div key={prod.id} className="flex gap-3 items-center p-3 border border-gray-100 rounded-xl hover:shadow-md transition bg-white">
                                <img src={prod.image_url} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        {prod.name}
                                        {prod.is_featured && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Destaque</span>}
                                    </p>
                                    <div className="flex justify-between mt-1"><span className="text-xs font-bold text-[#009CDE]">{prod.cost} pts</span><span className="text-xs text-gray-500">Stock: {prod.stock}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(prod)} className="text-gray-400 hover:text-[#009CDE]"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={async () => { if (confirm('Apagar produto?')) await deleteProduct(prod.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showProductModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-[#002D72] mb-6">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custo (Pts)</label><input type="number" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" value={newProduct.cost} onChange={e => setNewProduct({ ...newProduct, cost: parseInt(e.target.value) })} /></div>
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
                                    Destacar este produto na loja
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagem</label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        {newProduct.image_url && <img src={newProduct.image_url} className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-200" />}
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm mb-2"
                                                placeholder="Ou cole um URL..."
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
                                                    <span className="text-xs font-bold text-gray-500">{isUploading ? 'A Carregar...' : 'Carregar Ficheiro'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setShowProductModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Cancelar</button>
                                <button onClick={handleSaveProduct} disabled={isUploading} className="flex-1 py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900 flex items-center justify-center gap-2">
                                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingProduct ? 'Guardar' : 'Adicionar'}
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
        alert("Funcionalidade de bónus a implementar com backend.");
    };

    return (
        <div className="p-8 animate-fade-in h-full">
            <div className="flex justify-between items-center mb-8"><div><h2 className="text-2xl font-bold text-gray-800">Utilizadores</h2><p className="text-gray-500 text-sm">Gerir colaboradores, permissões e gamificação.</p></div></div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">A carregar utilizadores...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Colaborador</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cargo & Escritório</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Pontos (Saldo)</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/50 transition">
                                    <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={user.avatar} className="w-8 h-8 rounded-full bg-gray-200" /><div><div className="font-bold text-gray-900">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div></div></td>
                                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{user.role}</div><div className="text-xs text-[#009CDE] font-medium">{user.office}</div></td>
                                    <td className="px-6 py-4"><div className="font-bold text-gray-700">{user.points.toLocaleString()} pts</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span></td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => handleBonus(user.id)} title="Bónus" className="bg-yellow-100 text-yellow-600 p-2 rounded-lg hover:bg-yellow-200 transition"><Gift className="w-4 h-4" /></button><button title="Editar" className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"><Edit2 className="w-4 h-4" /></button><button title="Bloquear" className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition"><Ban className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

import { useCMS, useUpdateCMS, useNotifications, useCreateNotification, uploadCMSMedia } from '../hooks/useCMS';
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
        alert("Enviado com sucesso!");
    };

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div><h2 className="text-2xl font-bold text-gray-800">Comunicações</h2><p className="text-gray-500 text-sm">Envie notificações e emails para a organização.</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Send className="w-4 h-4 text-[#009CDE]" /> Nova Mensagem</h3>
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#009CDE] outline-none" value={newMessage.title} onChange={e => setNewMessage({ ...newMessage, title: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensagem</label><textarea className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#009CDE] outline-none h-32" value={newMessage.message} onChange={e => setNewMessage({ ...newMessage, message: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label><select className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none" value={newMessage.type} onChange={e => setNewMessage({ ...newMessage, type: e.target.value as any })}><option value="info">Informação</option><option value="warning">Aviso Importante</option><option value="success">Sucesso / Parabéns</option></select></div>
                        <button onClick={handleSend} className="w-full py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar Notificação</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Clock className="w-4 h-4 text-[#009CDE]" /> Histórico Recente</h3>
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
        if (confirm("Marcar como resolvido?")) {
            await updateTicket.mutateAsync({ id, status: 'resolved' });
        }
    };

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Suporte & Helpdesk</h2>
                    <p className="text-gray-500 text-sm">Gerir pedidos de suporte.</p>
                </div>
                <span className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm">
                    {stats?.open || 0} Tickets Abertos
                </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm flex flex-col h-full max-h-[calc(100vh-250px)]">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex gap-4">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'all' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>Todos</button>
                        <button onClick={() => setFilter('open')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'open' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>Abertos</button>
                        <button onClick={() => setFilter('resolved')} className={`px-4 py-2 rounded-lg font-bold transition ${filter === 'resolved' ? 'bg-[#002D72] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'}`}>Resolvidos</button>
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
                        <div className="p-8 text-center text-gray-400">Carregando tickets...</div>
                    ) : (
                        <table className="w-full text-left relative">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-500 uppercase">Utilizador</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 uppercase">Assunto</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 uppercase">Prioridade</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 uppercase text-right">Ação</th>
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
                                                <button onClick={() => handleResolve(t.id)} className="text-[#009CDE] font-bold hover:underline">Resolver</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!isLoading && tickets.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">Não há tickets para mostrar.</p>
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
        if (confirm("Isto irá atualizar o menu da App para todos os utilizadores. Continuar?")) {
            await updateMenu.mutateAsync(localMenu);
            alert("Menu atualizado com sucesso!");
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

    // Sync local state when data loads
    useEffect(() => {
        if (config) setLocalConfig(config);
    }, [config]);

    const handleSave = async () => {
        await updateCMS.mutateAsync(localConfig);
        alert("Guardado com sucesso!");
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

    if (isLoading || !localConfig) return <div>Carregando CMS...</div>;

    const isVideo = localConfig.heroImage?.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-8">
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
        </div>
    );
};

const SettingsView = () => (
    <div className="p-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Definições Globais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Regras de Gamificação</h3><div className="space-y-6"><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Pontos por Km (Corrida) <span className="text-[#009CDE]">10 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Pontos por 1000 Passos <span className="text-[#009CDE]">5 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div><div><label className="flex justify-between text-sm font-bold text-gray-700 mb-2">Bónus de Check-in Evento <span className="text-[#009CDE]">50 pts</span></label><input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-red-500" /> Metas da Empresa</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objetivo Mensal Global (Pontos)</label><input type="number" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" defaultValue="40000" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prémio Batalha Escritórios</label><input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" defaultValue="Almoço de Equipa" /></div><div className="flex items-center gap-2 mt-2"><input type="checkbox" checked className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm text-gray-600">Reiniciar Ranking automaticamente ao dia 1</span></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2"><h3 className="font-bold text-[#002D72] mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500" /> Integrações API</h3><div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50"><div className="flex items-center gap-4"><div className="bg-[#FC4C02] p-2 rounded-lg"><Activity className="w-6 h-6 text-white" /></div><div><h4 className="font-bold text-gray-800">Strava API</h4><p className="text-xs text-gray-500">Sincronização de atividades</p></div></div><div className="flex items-center gap-4"><span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Operacional</span><button className="text-gray-400 hover:text-gray-600"><Settings className="w-5 h-5" /></button></div></div></div>
        </div>
    </div>
);

// --- MAIN LAYOUT ---

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const logout = useLogout();

    return (
        <div className="flex min-h-screen bg-[#F3F4F6] font-sans">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 ml-64 overflow-y-auto">
                <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-gray-500 text-sm"><span>Admin</span><ChevronRight className="w-4 h-4" /><span className="text-[#002D72] font-bold capitalize">{activeTab}</span></div>
                    <div className="flex items-center gap-4">
                        <div className="relative"><Bell className="w-5 h-5 text-gray-500 hover:text-[#002D72] cursor-pointer transition" /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span></div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <button onClick={logout} className="text-sm font-bold text-gray-600 hover:text-[#002D72]">Sair</button>
                    </div>
                </header>
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'events' && <EventsManager />}
                {activeTab === 'results' && <ResultsManager />}
                {activeTab === 'store' && <StoreManagerView />}
                {activeTab === 'communications' && <CommunicationsView />}
                {activeTab === 'support' && <SupportView />}
                {activeTab === 'app_menu' && <MenuManagerView />}
                {activeTab === 'cms' && <CMSView />}
                {activeTab === 'users' && <UsersView />}
                {activeTab === 'settings' && <SettingsView />}
            </main>
        </div>
    );
}
