import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '../hooks/use-toast';
import {
    Users, Home, FileText, Mail, Star,
    ClipboardList, TrendingUp, Bell, ChevronRight,
    LayoutDashboard, Megaphone
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// --- COMPONENTE DE CARTÃO DE AÇÃO ---
const ActionCard = ({ title, description, icon: Icon, colorClass, link, badgeCount, onClick }) => (
    <div
        onClick={onClick}
        className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
        {/* Barra lateral colorida */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorClass}`} />

        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-gray-50 group-hover:scale-110 transition-transform duration-300 ${colorClass.replace('bg-', 'text-')}`}>
                <Icon className="h-6 w-6" />
            </div>
            {badgeCount > 0 && (
                <span className="flex items-center justify-center bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                    {badgeCount} pendentes
                </span>
            )}
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-primary-teal transition-colors">
            {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
            {description}
        </p>

        <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-primary-teal transition-colors">
            Aceder <ChevronRight className="h-4 w-4 ml-1" />
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API}/admin/dashboard`);
                setStats(response.data);
            } catch (error) {
                toast({ title: "Erro ao carregar dashboard", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><div className="spinner"></div></div>;
    }

    if (!stats) return null;

    // Definição dos Cartões de Gestão
    const managementActions = [
        {
            title: "Candidaturas",
            description: "Aprovar ou recusar novos membros, parceiros e associados.",
            icon: ClipboardList,
            color: "bg-orange-500",
            link: "/admin/candidaturas",
            badge: stats.candidaturas_pendentes // Mostra número se houver pendências
        },
        {
            title: "Imóveis",
            description: "Gerir anúncios, aprovar publicações e verificar status.",
            icon: Home,
            color: "bg-blue-500",
            link: "/admin/imoveis",
            // Assumindo que criaste um campo 'imoveis_pendentes' no stats, senão 0
            badge: 0
        },
        {
            title: "Conteúdo & Notícias",
            description: "Publicar novidades, artigos de turismo e eventos.",
            icon: FileText,
            color: "bg-emerald-500",
            link: "/admin/conteudo",
            badge: 0
        },
        {
            title: "Utilizadores",
            description: "Gerir lista de utilizadores, permissões e acessos.",
            icon: Users,
            color: "bg-violet-500",
            link: "/admin/usuarios",
            badge: 0
        },
        {
            title: "Destaques da Home",
            description: "Escolher quais imóveis e parceiros aparecem na página principal.",
            icon: Star,
            color: "bg-yellow-500",
            link: "/admin/destaques",
            badge: 0
        },
        {
            title: "Comunicação",
            description: "Enviar e-mails em massa para grupos de usuários.",
            icon: Mail,
            color: "bg-pink-500",
            link: "/admin/comunicacao",
            badge: 0
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="container mx-auto px-4 py-8 md:py-12">

                {/* --- CABEÇALHO --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <LayoutDashboard className="h-8 w-8 text-primary-teal" />
                            Painel Administrativo
                        </h1>
                        <p className="text-gray-500 mt-2">Bem-vindo de volta! Aqui está o resumo da plataforma hoje.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-gray-600">Sistema Online</span>
                    </div>
                </div>

                {/* --- SECÇÃO 1: ANALYTICS (VISUALIZAÇÃO RÁPIDA) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-blue-100 font-medium">Total Utilizadores</p>
                                <Users className="h-5 w-5 text-blue-200" />
                            </div>
                            <h3 className="text-3xl font-bold">{stats.total_users}</h3>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-teal-100 font-medium">Imóveis Ativos</p>
                                <Home className="h-5 w-5 text-teal-200" />
                            </div>
                            <h3 className="text-3xl font-bold">{stats.total_imoveis}</h3>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-indigo-100 font-medium">Parceiros</p>
                                <Megaphone className="h-5 w-5 text-indigo-200" />
                            </div>
                            <h3 className="text-3xl font-bold">{stats.total_parceiros}</h3>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-white text-gray-800 border-l-4 border-orange-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-gray-500 font-medium">Pendências</p>
                                <Bell className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-orange-600">{stats.candidaturas_pendentes}</h3>
                        </CardContent>
                    </Card>
                </div>

                {/* --- SECÇÃO 2: GESTÃO (A PARTE QUE PEDISTE) --- */}
                <div className="mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary-teal" />
                    <h2 className="text-xl font-bold text-gray-800">Centro de Gestão</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managementActions.map((action, index) => (
                        <ActionCard
                            key={index}
                            title={action.title}
                            description={action.description}
                            icon={action.icon}
                            colorClass={action.color}
                            link={action.link}
                            badgeCount={action.badge}
                            onClick={() => navigate(action.link)}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;