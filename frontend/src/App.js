import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { CandidaturaMembroPage, CandidaturaParceiroPage, CandidaturaAssociadoPage } from './components/Forms';
import { MeusImoveisPage, TodosImoveisPage, ParceirosPage, MeuPerfilPage } from './components/MemberPages';
import { ImovelDetalhePage, ParceiroDetalhePage } from './components/DetalhesPages';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/main" replace />;
  }

  return children;
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
          <span className="text-sm opacity-90 hidden md:block">Associação de Locação por Temporada</span>
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm hidden sm:block">
              Olá, {user.nome} 
              <Badge className="ml-2 bg-white/20">{user.role}</Badge>
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="text-white border-white/50 hover:bg-white hover:text-gray-800 transition-all"
            >
              Sair
            </Button>
          </div>
        ) : (
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/login'}
              className="text-white border-white/50 hover:bg-white hover:text-gray-800"
            >
              Entrar
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

// Navigation for logged-in users
const Navigation = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex space-x-2 md:space-x-8 overflow-x-auto">
          <a 
            href="/main" 
            className="nav-link py-3 px-3 whitespace-nowrap"
          >
            Início
          </a>
          
          {user.role === 'admin' && (
            <>
              <a 
                href="/admin/dashboard" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Dashboard
              </a>
              <a 
                href="/admin/candidaturas" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Candidaturas
              </a>
              <a 
                href="/admin/imoveis" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Imóveis
              </a>
              <a 
                href="/admin/usuarios" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Usuários
              </a>
              <a 
                href="/admin/conteudo" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Conteúdo
              </a>
              <a 
                href="/admin/comunicacao" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Comunicação
              </a>
            </>
          )}
          
          {user.role === 'membro' && (
            <>
              <a 
                href="/meus-imoveis" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Meus Imóveis
              </a>
              <a 
                href="/imoveis" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Todos os Imóveis
              </a>
            </>
          )}
          
          {user.role === 'parceiro' && (
            <>
              <a 
                href="/meu-perfil" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Meu Perfil
              </a>
              <a 
                href="/imoveis" 
                className="nav-link py-3 px-3 whitespace-nowrap"
              >
                Imóveis
              </a>
            </>
          )}
          
          <a 
            href="/parceiros" 
            className="nav-link py-3 px-3 whitespace-nowrap"
          >
            Parceiros
          </a>
        </div>
      </div>
    </nav>
  );
};

// Main Page for Authenticated Users (Rich Content)
const MainPage = () => {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({
    noticias_destaque: [],
    imoveis_destaque: [],
    parceiros_destaque: [],
    ultimas_noticias: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMainPageData();
  }, []);

  const fetchMainPageData = async () => {
    try {
      const response = await axios.get(`${API}/main-page`);
      setPageData(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar conteúdo",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Featured News */}
        {pageData.noticias_destaque.length > 0 && (
          <section className="mb-12 fade-in">
            <h2 className="text-3xl font-bold mb-6 text-primary-gray">Notícias em Destaque</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {pageData.noticias_destaque.map((noticia, index) => (
                <div key={noticia.id} className={`${index === 0 ? "lg:col-span-2" : ""} news-card`}>
                  {noticia.video_url && (
                    <div className="aspect-video mb-4">
                      <iframe
                        src={noticia.video_url}
                        className="w-full h-full rounded-t-lg"
                        allowFullScreen
                        title={noticia.titulo}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <Badge className="badge-teal mb-3">{noticia.categoria}</Badge>
                    <h3 className={`font-bold mb-3 text-primary-gray ${index === 0 ? "text-2xl" : "text-lg"}`}>
                      {noticia.titulo}
                    </h3>
                    {noticia.subtitulo && (
                      <p className="text-gray-600 mb-4">{noticia.subtitulo}</p>
                    )}
                    <p className="text-gray-600 mb-4">
                      {noticia.resumo || noticia.conteudo.substring(0, 150) + '...'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Por {noticia.autor_nome}</span>
                      <span>{new Date(noticia.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Properties */}
        {pageData.imoveis_destaque.length > 0 && (
          <section className="mb-12 fade-in">
            <h2 className="text-3xl font-bold mb-6 text-primary-gray">Imóveis em Destaque</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.imoveis_destaque.map((imovel) => (
                <div 
                  key={imovel.id} 
                  className="property-card hover-lift cursor-pointer" 
                  onClick={() => navigate(`/imovel/${imovel.id}`)}
                >
                  {imovel.fotos.length > 0 ? (
                    <div className="property-image">
                      <img 
                        src={imovel.fotos[0]} 
                        alt={imovel.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="property-image bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">Sem foto</span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary-gray line-clamp-1">{imovel.titulo}</h3>
                      <Badge className="badge-beige flex-shrink-0 ml-2">{imovel.tipo}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{imovel.regiao}</p>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {imovel.descricao}
                    </p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs text-gray-500">
                        <span>{imovel.num_quartos}q • {imovel.num_banheiros}b • {imovel.capacidade}p</span>
                      </div>
                      <div className="text-lg font-bold text-primary-teal">
                        R$ {imovel.preco_diaria}/dia
                      </div>
                    </div>
                    
                    {(imovel.link_booking || imovel.link_airbnb) && (
                      <div className="flex space-x-2">
                        {imovel.link_booking && (
                          <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                            <a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">
                              Booking
                            </a>
                          </Button>
                        )}
                        {imovel.link_airbnb && (
                          <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                            <a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">
                              Airbnb
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Partners */}
        {pageData.parceiros_destaque.length > 0 && (
          <section className="mb-12 fade-in">
            <h2 className="text-3xl font-bold mb-6 text-primary-gray">Parceiros em Destaque</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.parceiros_destaque.map((parceiro) => (
                <div key={parceiro.id} className="partner-card hover-lift cursor-pointer" onClick={() => window.location.href = `/parceiro/${parceiro.id}`}>
                  {parceiro.fotos.length > 0 && (
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={parceiro.fotos[0]} 
                        alt={parceiro.nome_empresa}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-primary-gray">{parceiro.nome_empresa}</h3>
                    <Badge className="badge-beige">{parceiro.categoria}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                    {parceiro.descricao}
                  </p>
                  
                  {parceiro.website && (
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={parceiro.website} target="_blank" rel="noopener noreferrer">
                        Visitar Site
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest News */}
        {pageData.ultimas_noticias.length > 0 && (
          <section className="fade-in">
            <h2 className="text-3xl font-bold mb-6 text-primary-gray">Últimas Notícias</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {pageData.ultimas_noticias.slice(0, 6).map((noticia) => (
                <div key={noticia.id} className="news-card">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="badge-teal">{noticia.categoria}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(noticia.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-primary-gray">{noticia.titulo}</h3>
                    {noticia.subtitulo && (
                      <p className="text-gray-600 text-sm mb-3">{noticia.subtitulo}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {noticia.resumo || noticia.conteudo.substring(0, 100) + '...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Admin Dashboard with Statistics
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_membros: 0,
    total_parceiros: 0,
    total_associados: 0,
    candidaturas_pendentes: 0,
    total_imoveis: 0,
    total_noticias: 0,
    imoveis_destaque: 0,
    parceiros_destaque: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setStats(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-primary-gray">Dashboard Administrativo</h1>
        
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="stat-card">
            <div className="stat-number">{stats.total_users}</div>
            <div className="stat-label">Total de Usuários</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-orange-500">{stats.candidaturas_pendentes}</div>
            <div className="stat-label">Candidaturas Pendentes</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-green-600">{stats.total_imoveis}</div>
            <div className="stat-label">Imóveis Cadastrados</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-purple-600">{stats.total_noticias}</div>
            <div className="stat-label">Notícias Publicadas</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="card-custom p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-gray">Membros</h3>
            <div className="text-3xl font-bold text-primary-teal mb-2">{stats.total_membros}</div>
            <p className="text-gray-600 text-sm">Proprietários de imóveis</p>
          </Card>
          
          <Card className="card-custom p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-gray">Parceiros</h3>
            <div className="text-3xl font-bold text-primary-teal mb-2">{stats.total_parceiros}</div>
            <p className="text-gray-600 text-sm">Empresas parceiras</p>
          </Card>
          
          <Card className="card-custom p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-gray">Associados</h3>
            <div className="text-3xl font-bold text-primary-teal mb-2">{stats.total_associados}</div>
            <p className="text-gray-600 text-sm">Apoiadores da ALT</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            className="btn-primary h-auto p-6 flex flex-col items-center space-y-2"
            onClick={() => window.location.href = '/admin/candidaturas'}
          >
            <span className="text-lg font-semibold">Gerenciar</span>
            <span className="text-sm">Candidaturas</span>
          </Button>
          
          <Button 
            className="btn-primary h-auto p-6 flex flex-col items-center space-y-2"
            onClick={() => window.location.href = '/admin/conteudo'}
          >
            <span className="text-lg font-semibold">Criar</span>
            <span className="text-sm">Notícia</span>
          </Button>
          
          <Button 
            className="btn-primary h-auto p-6 flex flex-col items-center space-y-2"
            onClick={() => window.location.href = '/admin/comunicacao'}
          >
            <span className="text-lg font-semibold">Enviar</span>
            <span className="text-sm">Email</span>
          </Button>
          
          <Button 
            className="btn-primary h-auto p-6 flex flex-col items-center space-y-2"
            onClick={() => window.location.href = '/admin/usuarios'}
          >
            <span className="text-lg font-semibold">Gerenciar</span>
            <span className="text-sm">Usuários</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Admin Panel for Applications (Restored)
const AdminCandidaturas = () => {
  const [candidaturasMembros, setCandidaturasMembros] = useState([]);
  const [candidaturasParceiros, setCandidaturasParceiros] = useState([]);
  const [candidaturasAssociados, setCandidaturasAssociados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('membros');

  const fetchCandidaturas = async () => {
    setLoading(true);
    try {
      const [membros, parceiros, associados] = await Promise.all([
        axios.get(`${API}/admin/candidaturas/membros`),
        axios.get(`${API}/admin/candidaturas/parceiros`),
        axios.get(`${API}/admin/candidaturas/associados`)
      ]);
      
      setCandidaturasMembros(membros.data);
      setCandidaturasParceiros(parceiros.data);
      setCandidaturasAssociados(associados.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar candidaturas",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidaturas();
  }, []);

  const handleAprovar = async (tipo, id) => {
    try {
      const response = await axios.post(`${API}/admin/candidaturas/${tipo}/${id}/aprovar`);
      toast({
        title: "Candidatura aprovada!",
        description: `Email enviado. Senha temporária: ${response.data.temp_password}`,
      });
      fetchCandidaturas();
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRecusar = async (tipo, id, motivo = '') => {
    try {
      await axios.post(`${API}/admin/candidaturas/${tipo}/${id}/recusar`, 
        {}, 
        { params: { motivo } }
      );
      toast({
        title: "Candidatura recusada",
        description: "Email de notificação enviado.",
      });
      fetchCandidaturas();
    } catch (error) {
      toast({
        title: "Erro ao recusar",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const CandidaturaCard = ({ candidatura, tipo }) => (
    <Card key={candidatura.id} className="card-custom mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-primary-gray">{candidatura.nome}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="badge-beige">
              {new Date(candidatura.created_at).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-primary-teal">{candidatura.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <p><strong>Telefone:</strong> {candidatura.telefone}</p>
            {candidatura.endereco && <p><strong>Endereço:</strong> {candidatura.endereco}</p>}
            {candidatura.num_imoveis && <p><strong>Nº Imóveis:</strong> {candidatura.num_imoveis}</p>}
            {candidatura.link_imovel && (
              <p><strong>Link Imóvel:</strong> 
                <a href={candidatura.link_imovel} target="_blank" rel="noopener noreferrer" className="text-primary-teal ml-1">
                  Ver imóvel
                </a>
              </p>
            )}
            {candidatura.nome_empresa && <p><strong>Empresa:</strong> {candidatura.nome_empresa}</p>}
            {candidatura.categoria && <p><strong>Categoria:</strong> {candidatura.categoria}</p>}
            {candidatura.cnpj && <p><strong>CNPJ:</strong> {candidatura.cnpj}</p>}
            {candidatura.ocupacao && <p><strong>Ocupação:</strong> {candidatura.ocupacao}</p>}
            {candidatura.empresa_trabalho && <p><strong>Empresa:</strong> {candidatura.empresa_trabalho}</p>}
          </div>
          <div className="space-y-2">
            {candidatura.mensagem && (
              <div>
                <p><strong>Mensagem:</strong></p>
                <p className="text-gray-700 text-sm mt-1 p-2 bg-gray-50 rounded">{candidatura.mensagem}</p>
              </div>
            )}
            {candidatura.motivo_interesse && (
              <div>
                <p><strong>Motivo do Interesse:</strong></p>
                <p className="text-gray-700 text-sm mt-1 p-2 bg-gray-50 rounded">{candidatura.motivo_interesse}</p>
              </div>
            )}
            {candidatura.servicos_oferecidos && (
              <div>
                <p><strong>Serviços:</strong></p>
                <p className="text-gray-700 text-sm mt-1">{candidatura.servicos_oferecidos}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => handleAprovar(tipo, candidatura.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
            data-testid={`aprovar-${candidatura.id}`}
          >
            Aprovar
          </Button>
          <Button
            onClick={() => handleRecusar(tipo, candidatura.id)}
            variant="destructive"
            size="sm"
            data-testid={`recusar-${candidatura.id}`}
          >
            Recusar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-primary-gray">Gerenciar Candidaturas</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="membros" className="text-center">
              Membros ({candidaturasMembros.length})
            </TabsTrigger>
            <TabsTrigger value="parceiros" className="text-center">
              Parceiros ({candidaturasParceiros.length})
            </TabsTrigger>
            <TabsTrigger value="associados" className="text-center">
              Associados ({candidaturasAssociados.length})
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <TabsContent value="membros" className="space-y-4">
                <h2 className="text-xl font-semibold text-primary-gray">Candidaturas para Membro</h2>
                {candidaturasMembros.length === 0 ? (
                  <Card className="card-custom">
                    <CardContent className="py-12 text-center text-gray-500">
                      Nenhuma candidatura pendente
                    </CardContent>
                  </Card>
                ) : (
                  candidaturasMembros.map(candidatura => (
                    <CandidaturaCard key={candidatura.id} candidatura={candidatura} tipo="membro" />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="parceiros" className="space-y-4">
                <h2 className="text-xl font-semibold text-primary-gray">Candidaturas para Parceiro</h2>
                {candidaturasParceiros.length === 0 ? (
                  <Card className="card-custom">
                    <CardContent className="py-12 text-center text-gray-500">
                      Nenhuma candidatura pendente
                    </CardContent>
                  </Card>
                ) : (
                  candidaturasParceiros.map(candidatura => (
                    <CandidaturaCard key={candidatura.id} candidatura={candidatura} tipo="parceiro" />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="associados" className="space-y-4">
                <h2 className="text-xl font-semibold text-primary-gray">Candidaturas para Associado</h2>
                {candidaturasAssociados.length === 0 ? (
                  <Card className="card-custom">
                    <CardContent className="py-12 text-center text-gray-500">
                      Nenhuma candidatura pendente
                    </CardContent>
                  </Card>
                ) : (
                  candidaturasAssociados.map(candidatura => (
                    <CandidaturaCard key={candidatura.id} candidatura={candidatura} tipo="associado" />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

// Content Management (Restored)
const AdminConteudo = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [novaNoticia, setNovaNoticia] = useState({
    titulo: '',
    subtitulo: '',
    conteudo: '',
    resumo: '',
    categoria: 'geral',
    video_url: '',
    link_externo: '',
    tags: [],
    destaque: false
  });

  useEffect(() => {
    fetchNoticias();
  }, []);

  const fetchNoticias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/noticias`);
      setNoticias(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar notícias",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCreateNoticia = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/noticias`, novaNoticia);
      toast({
        title: "Notícia criada com sucesso!",
        description: "A notícia foi publicada na área dos membros.",
      });
      setNovaNoticia({
        titulo: '',
        subtitulo: '',
        conteudo: '',
        resumo: '',
        categoria: 'geral',
        video_url: '',
        link_externo: '',
        tags: [],
        destaque: false
      });
      setShowForm(false);
      fetchNoticias();
    } catch (error) {
      toast({
        title: "Erro ao criar notícia",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNoticia = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta notícia?')) {
      try {
        await axios.delete(`${API}/admin/noticias/${id}`);
        toast({
          title: "Notícia removida com sucesso!",
        });
        fetchNoticias();
      } catch (error) {
        toast({
          title: "Erro ao remover notícia",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary-gray">Gerenciar Conteúdo</h1>
          <Button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Criar Nova Notícia
          </Button>
        </div>

        {showForm && (
          <Card className="card-custom mb-8">
            <CardHeader>
              <CardTitle className="text-primary-gray">Nova Notícia</CardTitle>
              <CardDescription>
                Crie uma nova notícia para ser exibida na área dos membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateNoticia} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titulo" className="form-label">Título *</Label>
                    <Input
                      id="titulo"
                      className="form-input"
                      value={novaNoticia.titulo}
                      onChange={(e) => setNovaNoticia({...novaNoticia, titulo: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria" className="form-label">Categoria</Label>
                    <Select 
                      value={novaNoticia.categoria} 
                      onValueChange={(value) => setNovaNoticia({...novaNoticia, categoria: value})}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="promocao">Promoção</SelectItem>
                        <SelectItem value="regulamentacao">Regulamentação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subtitulo" className="form-label">Subtítulo</Label>
                  <Input
                    id="subtitulo"
                    className="form-input"
                    value={novaNoticia.subtitulo}
                    onChange={(e) => setNovaNoticia({...novaNoticia, subtitulo: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="resumo" className="form-label">Resumo</Label>
                  <Textarea
                    id="resumo"
                    className="form-input"
                    rows={3}
                    value={novaNoticia.resumo}
                    onChange={(e) => setNovaNoticia({...novaNoticia, resumo: e.target.value})}
                    placeholder="Breve resumo da notícia..."
                  />
                </div>

                <div>
                  <Label htmlFor="conteudo" className="form-label">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    className="form-input"
                    rows={8}
                    value={novaNoticia.conteudo}
                    onChange={(e) => setNovaNoticia({...novaNoticia, conteudo: e.target.value})}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="video_url" className="form-label">URL do Vídeo</Label>
                    <Input
                      id="video_url"
                      type="url"
                      className="form-input"
                      value={novaNoticia.video_url}
                      onChange={(e) => setNovaNoticia({...novaNoticia, video_url: e.target.value})}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_externo" className="form-label">Link Externo</Label>
                    <Input
                      id="link_externo"
                      type="url"
                      className="form-input"
                      value={novaNoticia.link_externo}
                      onChange={(e) => setNovaNoticia({...novaNoticia, link_externo: e.target.value})}
                      placeholder="https://exemplo.com/..."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="destaque"
                    checked={novaNoticia.destaque}
                    onChange={(e) => setNovaNoticia({...novaNoticia, destaque: e.target.checked})}
                    className="rounded focus-teal"
                  />
                  <Label htmlFor="destaque" className="form-label mb-0">
                    Destacar na página principal
                  </Label>
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" className="btn-primary">Publicar</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {noticias.length === 0 ? (
              <Card className="card-custom">
                <CardContent className="py-12 text-center text-gray-500">
                  Nenhuma notícia publicada
                </CardContent>
              </Card>
            ) : (
              noticias.map(noticia => (
                <Card key={noticia.id} className="card-custom">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="badge-teal">{noticia.categoria}</Badge>
                          {noticia.destaque && <Badge className="badge-beige">Destaque</Badge>}
                        </div>
                        <CardTitle className="text-primary-gray">{noticia.titulo}</CardTitle>
                        {noticia.subtitulo && (
                          <CardDescription className="text-lg mt-2">{noticia.subtitulo}</CardDescription>
                        )}
                        <CardDescription className="mt-1">
                          Por {noticia.autor_nome} • {new Date(noticia.created_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteNoticia(noticia.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {noticia.resumo && (
                      <p className="text-gray-600 mb-3">{noticia.resumo}</p>
                    )}
                    <p className="whitespace-pre-wrap text-gray-700">{noticia.conteudo}</p>
                    {(noticia.video_url || noticia.link_externo) && (
                      <div className="flex space-x-2 mt-4">
                        {noticia.video_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={noticia.video_url} target="_blank" rel="noopener noreferrer">
                              Ver Vídeo
                            </a>
                          </Button>
                        )}
                        {noticia.link_externo && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={noticia.link_externo} target="_blank" rel="noopener noreferrer">
                              Link Externo
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Communication (Mass Email) - Restored
const AdminComunicacao = () => {
  const [emailData, setEmailData] = useState({
    destinatarios: [],
    assunto: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (emailData.destinatarios.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um grupo de destinatários.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/email-massa`, emailData);
      toast({
        title: "Email enviado com sucesso!",
        description: `Enviado para ${response.data.destinatarios} usuários.`,
      });
      setEmailData({ destinatarios: [], assunto: '', mensagem: '' });
    } catch (error) {
      toast({
        title: "Erro ao enviar email",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDestinatarioChange = (value, checked) => {
    if (checked) {
      setEmailData(prev => ({
        ...prev,
        destinatarios: [...prev.destinatarios, value]
      }));
    } else {
      setEmailData(prev => ({
        ...prev,
        destinatarios: prev.destinatarios.filter(d => d !== value)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-primary-gray">Comunicação</h1>
        
        <Card className="card-custom max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-primary-gray">Enviar Email em Massa</CardTitle>
            <CardDescription>
              Envie emails para grupos específicos de usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div>
                <Label className="form-label">Destinatários</Label>
                <div className="space-y-3 mt-2">
                  {[
                    { value: 'admin', label: 'Administradores' },
                    { value: 'membro', label: 'Membros' },
                    { value: 'parceiro', label: 'Parceiros' },
                    { value: 'associado', label: 'Associados' },
                    { value: 'todos', label: 'Todos os Usuários' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailData.destinatarios.includes(option.value)}
                        onChange={(e) => handleDestinatarioChange(option.value, e.target.checked)}
                        className="rounded focus-teal"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="assunto" className="form-label">Assunto *</Label>
                <Input
                  id="assunto"
                  className="form-input"
                  value={emailData.assunto}
                  onChange={(e) => setEmailData({...emailData, assunto: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mensagem" className="form-label">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  className="form-input"
                  rows={8}
                  value={emailData.mensagem}
                  onChange={(e) => setEmailData({...emailData, mensagem: e.target.value})}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full btn-primary"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-4 h-4"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  'Enviar Email'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// User Management - Restored
const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, { ativo: !currentStatus });
      toast({
        title: "Status do usuário atualizado!",
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-primary-gray">Gerenciar Usuários</h1>
        
        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="text-primary-gray">Lista de Usuários</CardTitle>
            <CardDescription>
              Gerencie todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-primary-gray">{user.nome}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.telefone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className="badge-teal">{user.role}</Badge>
                      {user.ativo ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={user.ativo ? "destructive" : "default"}
                      onClick={() => toggleUserStatus(user.id, user.ativo)}
                    >
                      {user.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Home Page (Public - for non-authenticated users)
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">
            Bem-vindo à ALT Ilhabela
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed fade-in">
            A Associação de Locação por Temporada de Ilhabela é uma entidade dedicada 
            a promover o turismo responsável e a qualidade dos serviços de hospedagem 
            em nossa bela ilha.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-6 hover-lift">
              <h3 className="text-xl font-bold mb-4">Para Proprietários</h3>
              <p className="text-white/90 mb-4 text-sm">
                Cadastre seus imóveis e faça parte da nossa rede qualificada
              </p>
              <Button 
                className="btn-secondary w-full hover-lift"
                onClick={() => window.location.href = '/candidatura/membro'}
                data-testid="seja-membro-btn"
              >
                Seja Membro
              </Button>
            </div>

            <div className="glass-card p-6 hover-lift">
              <h3 className="text-xl font-bold mb-4">Para Empresas</h3>
              <p className="text-white/90 mb-4 text-sm">
                Ofereça seus serviços para nossa comunidade de turistas
              </p>
              <Button 
                className="btn-secondary w-full hover-lift"
                onClick={() => window.location.href = '/candidatura/parceiro'}
                data-testid="seja-parceiro-btn"
              >
                Seja Parceiro
              </Button>
            </div>

            <div className="glass-card p-6 hover-lift">
              <h3 className="text-xl font-bold mb-4">Para Apoiadores</h3>
              <p className="text-white/90 mb-4 text-sm">
                Apoie nossa missão de promover o turismo em Ilhabela
              </p>
              <Button 
                className="btn-secondary w-full hover-lift"
                onClick={() => window.location.href = '/candidatura/associado'}
                data-testid="seja-associado-btn"
              >
                Seja Associado
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white" id="sobre">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-primary-gray">Sobre a ALT Ilhabela</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-semibold mb-4 text-primary-teal">Nossa Missão</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Promover o desenvolvimento sustentável do turismo em Ilhabela através 
                  da qualificação e certificação de imóveis e serviços de locação por temporada.
                </p>
                
                <h3 className="text-2xl font-semibold mb-4 text-primary-teal">Nossos Valores</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Qualidade e excelência no atendimento</li>
                  <li>• Transparência e confiança</li>
                  <li>• Sustentabilidade ambiental</li>
                  <li>• Desenvolvimento local</li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <Card className="card-custom hover-lift">
                  <CardHeader>
                    <CardTitle className="text-primary-teal">Membros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      Proprietários de imóveis certificados para locação por temporada
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-custom hover-lift">
                  <CardHeader>
                    <CardTitle className="text-primary-teal">Parceiros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      Empresas locais que oferecem serviços turísticos qualificados
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-custom hover-lift">
                  <CardHeader>
                    <CardTitle className="text-primary-teal">Associados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      Apoiadores da missão de desenvolvimento do turismo local
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/main" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
    } else {
      toast({
        title: "Erro no login",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-gray">
            Entrar na ALT Ilhabela
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para gerenciar seu perfil
          </p>
        </div>
        
        <Card className="card-custom">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="form-label">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="form-input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="login-email-input"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="form-label">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  className="form-input mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-4 h-4"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => window.location.href = '/'}
            data-testid="voltar-home-btn"
          >
            Voltar para a página inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Application Forms remain the same but with improved styling...
// [Previous form components with updated CSS classes applied]

// Admin Property Management
const AdminImoveis = () => {
  const [imoveisPendentes, setImoveisPendentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImoveisPendentes();
  }, []);

  const fetchImoveisPendentes = async () => {
    try {
      const response = await axios.get(`${API}/admin/imoveis-pendentes`);
      setImoveisPendentes(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar imóveis",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleAprovar = async (imovelId) => {
    try {
      await axios.post(`${API}/admin/imoveis/${imovelId}/aprovar`);
      toast({
        title: "Imóvel aprovado!",
        description: "Email de notificação enviado ao proprietário.",
      });
      fetchImoveisPendentes();
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRecusar = async (imovelId, motivo = '') => {
    try {
      await axios.post(`${API}/admin/imoveis/${imovelId}/recusar`, {}, { params: { motivo } });
      toast({
        title: "Imóvel recusado",
        description: "Email de notificação enviado ao proprietário.",
      });
      fetchImoveisPendentes();
    } catch (error) {
      toast({
        title: "Erro ao recusar",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-primary-gray">Gerenciar Imóveis</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="card-custom">
              <CardHeader>
                <CardTitle className="text-primary-gray">Imóveis Pendentes de Aprovação ({imoveisPendentes.length})</CardTitle>
                <CardDescription>
                  Analise e aprove os imóveis enviados pelos membros
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imoveisPendentes.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    Nenhum imóvel pendente de aprovação
                  </div>
                ) : (
                  <div className="space-y-6">
                    {imoveisPendentes.map((imovel) => (
                      <Card key={imovel.id} className="border border-orange-200 bg-orange-50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg text-primary-gray">{imovel.titulo}</CardTitle>
                              <CardDescription>
                                {imovel.tipo} • {imovel.regiao} • R$ {imovel.preco_diaria}/dia
                              </CardDescription>
                              <Badge className="mt-2 bg-orange-100 text-orange-800">Pendente Aprovação</Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleAprovar(imovel.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                Aprovar
                              </Button>
                              <Button
                                onClick={() => {
                                  const motivo = window.prompt('Motivo da recusa (opcional):');
                                  if (motivo !== null) {
                                    handleRecusar(imovel.id, motivo);
                                  }
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                Recusar
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <strong>Descrição:</strong>
                                <p className="text-gray-600 text-sm mt-1">{imovel.descricao}</p>
                              </div>
                              <div>
                                <strong>Endereço:</strong>
                                <p className="text-gray-600 text-sm mt-1">{imovel.endereco_completo}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><strong>Quartos:</strong> {imovel.num_quartos}</div>
                                <div><strong>Banheiros:</strong> {imovel.num_banheiros}</div>
                                <div><strong>Capacidade:</strong> {imovel.capacidade} pessoas</div>
                                {imovel.area_m2 && <div><strong>Área:</strong> {imovel.area_m2}m²</div>}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <strong>Comodidades:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {imovel.possui_piscina && <Badge className="badge-teal text-xs">Piscina</Badge>}
                                  {imovel.possui_churrasqueira && <Badge className="badge-teal text-xs">Churrasqueira</Badge>}
                                  {imovel.possui_wifi && <Badge className="badge-teal text-xs">Wi-Fi</Badge>}
                                  {imovel.permite_pets && <Badge className="badge-teal text-xs">Pet-Friendly</Badge>}
                                  {imovel.tem_vista_mar && <Badge className="badge-teal text-xs">Vista Mar</Badge>}
                                  {imovel.tem_ar_condicionado && <Badge className="badge-teal text-xs">Ar Condicionado</Badge>}
                                </div>
                              </div>
                              <div className="text-sm">
                                <strong>Preços:</strong>
                                <div className="grid grid-cols-1 gap-1 mt-1 text-gray-600">
                                  <div>Diária: R$ {imovel.preco_diaria}</div>
                                  {imovel.preco_semanal && <div>Semanal: R$ {imovel.preco_semanal}</div>}
                                  {imovel.preco_mensal && <div>Mensal: R$ {imovel.preco_mensal}</div>}
                                </div>
                              </div>
                              {(imovel.link_booking || imovel.link_airbnb) && (
                                <div>
                                  <strong>Links:</strong>
                                  <div className="flex space-x-2 mt-1">
                                    {imovel.link_booking && (
                                      <Button size="sm" variant="outline" asChild>
                                        <a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">
                                          Booking
                                        </a>
                                      </Button>
                                    )}
                                    {imovel.link_airbnb && (
                                      <Button size="sm" variant="outline" asChild>
                                        <a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">
                                          Airbnb
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                            Enviado em: {new Date(imovel.created_at).toLocaleString('pt-BR')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/candidatura/membro" element={<CandidaturaMembroPage />} />
            <Route path="/candidatura/parceiro" element={<CandidaturaParceiroPage />} />
            <Route path="/candidatura/associado" element={<CandidaturaAssociadoPage />} />
            
            {/* Main page for authenticated users */}
            <Route 
              path="/main" 
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Member Routes */}
            <Route 
              path="/meus-imoveis" 
              element={
                <ProtectedRoute allowedRoles={['membro']}>
                  <MeusImoveisPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/imoveis" 
              element={
                <ProtectedRoute allowedRoles={['membro', 'parceiro']}>
                  <TodosImoveisPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Partner Routes */}
            <Route 
              path="/meu-perfil" 
              element={
                <ProtectedRoute allowedRoles={['parceiro']}>
                  <MeuPerfilPage />
                </ProtectedRoute>
              } 
            />
            
            {/* General Routes - Accessible by all authenticated users */}
            <Route 
              path="/parceiros" 
              element={
                <ProtectedRoute>
                  <ParceirosPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Detail Pages */}
            <Route 
              path="/imovel/:id" 
              element={
                <ProtectedRoute>
                  <ImovelDetalhePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/parceiro/:id" 
              element={
                <ProtectedRoute>
                  <ParceiroDetalhePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes - All Restored */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/candidaturas" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCandidaturas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/imoveis" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminImoveis />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/conteudo" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminConteudo />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/comunicacao" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminComunicacao />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/usuarios" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsuarios />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect dashboard to main for authenticated users */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigate to="/main" replace />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;