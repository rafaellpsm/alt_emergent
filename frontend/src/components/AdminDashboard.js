import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, FileText, Briefcase, BarChart2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API}/admin/dashboard`);
                setStats(response.data);
            } catch (error) {
                toast({
                    title: "Erro ao carregar estatísticas",
                    description: "Não foi possível buscar os dados do painel. Tente recarregar a página.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Painel do Administrador</h1>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={<Users className="h-8 w-8 text-primary-teal" />} title="Total de Usuários" value={stats.total_users} />
                    <StatCard icon={<Briefcase className="h-8 w-8 text-primary-teal" />} title="Total de Imóveis" value={stats.total_imoveis} />
                    <StatCard icon={<FileText className="h-8 w-8 text-primary-teal" />} title="Candidaturas Pendentes" value={stats.candidaturas_pendentes} />
                    <StatCard icon={<BarChart2 className="h-8 w-8 text-primary-teal" />} title="Imóveis em Destaque" value={stats.imoveis_destaque} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardLinkCard href="/admin/candidaturas" title="Gerir Candidaturas" description="Aprove ou recuse novas candidaturas de membros e parceiros." />
                <DashboardLinkCard href="/admin/imoveis" title="Gerir Imóveis" description="Visualize e edite os imóveis cadastrados na plataforma." />
                <DashboardLinkCard href="/admin/usuarios" title="Gerir Usuários" description="Administre os usuários do sistema, altere permissões e status." />
                <DashboardLinkCard href="/admin/conteudo" title="Gerir Conteúdo" description="Crie e edite notícias, páginas e outros conteúdos do site." />
                <DashboardLinkCard href="/admin/comunicacao" title="Comunicação" description="Envie emails e comunicados para os usuários da plataforma." />
                <DashboardLinkCard href="/admin/destaques" title="Gerir Destaques" description="Defina quais imóveis e parceiros aparecerão na página inicial." />
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value }) => (
    <Card className="card-custom">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-primary-gray">{value}</div>
        </CardContent>
    </Card>
);

const DashboardLinkCard = ({ href, title, description }) => (
    <a href={href} className="block">
        <Card className="card-custom h-full hover:border-primary-teal">
            <CardHeader>
                <CardTitle className="text-lg text-primary-gray">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600">{description}</p>
            </CardContent>
        </Card>
    </a>
);


export default AdminDashboard;