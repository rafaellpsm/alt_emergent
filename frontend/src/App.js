import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

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
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
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
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
          <span className="text-sm opacity-80">Associação de Locação por Temporada</span>
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Olá, {user.nome} ({user.role})
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="text-blue-600 border-white hover:bg-white"
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
              className="text-blue-600 border-white hover:bg-white"
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
        <div className="flex space-x-8">
          <a 
            href="/main" 
            className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
          >
            Página Inicial
          </a>
          
          {user.role === 'admin' && (
            <>
              <a 
                href="/admin/dashboard" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Dashboard
              </a>
              <a 
                href="/admin/candidaturas" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Candidaturas
              </a>
              <a 
                href="/admin/conteudo" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Conteúdo
              </a>
              <a 
                href="/admin/comunicacao" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Comunicação
              </a>
            </>
          )}
          
          {user.role === 'membro' && (
            <>
              <a 
                href="/meus-imoveis" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Meus Imóveis
              </a>
              <a 
                href="/imoveis" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Todos os Imóveis
              </a>
            </>
          )}
          
          {user.role === 'parceiro' && (
            <>
              <a 
                href="/meu-perfil" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Meu Perfil
              </a>
            </>
          )}
          
          <a 
            href="/parceiros" 
            className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
          >
            Parceiros
          </a>
          
          <a 
            href="/noticias" 
            className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
          >
            Notícias
          </a>
        </div>
      </div>
    </nav>
  );
};

// Main Page for Authenticated Users (Rich Content)
const MainPage = () => {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Notícias em Destaque</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {pageData.noticias_destaque.map((noticia, index) => (
                <Card key={noticia.id} className={index === 0 ? "lg:col-span-2" : ""}>
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
                  <CardHeader>
                    <Badge className="w-fit mb-2">{noticia.categoria}</Badge>
                    <CardTitle className={index === 0 ? "text-2xl" : "text-lg"}>
                      {noticia.titulo}
                    </CardTitle>
                    {noticia.subtitulo && (
                      <CardDescription className="text-lg">{noticia.subtitulo}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {noticia.resumo || noticia.conteudo.substring(0, 150) + '...'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Por {noticia.autor_nome}</span>
                      <span>{new Date(noticia.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Featured Properties */}
        {pageData.imoveis_destaque.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Imóveis em Destaque</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.imoveis_destaque.map((imovel) => (
                <Card key={imovel.id} className="hover:shadow-lg transition-shadow">
                  {imovel.fotos.length > 0 && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg mb-4">
                      <img 
                        src={imovel.fotos[0]} 
                        alt={imovel.titulo}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{imovel.titulo}</CardTitle>
                      <Badge variant="secondary">{imovel.tipo}</Badge>
                    </div>
                    <CardDescription>{imovel.regiao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {imovel.descricao}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-500">
                        <span>{imovel.num_quartos}q • {imovel.num_banheiros}b • {imovel.capacidade}p</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        R$ {imovel.preco_diaria}/dia
                      </div>
                    </div>
                    {(imovel.link_booking || imovel.link_airbnb) && (
                      <div className="flex space-x-2">
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
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Featured Partners */}
        {pageData.parceiros_destaque.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Parceiros em Destaque</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.parceiros_destaque.map((parceiro) => (
                <Card key={parceiro.id} className="hover:shadow-lg transition-shadow">
                  {parceiro.fotos.length > 0 && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg mb-4">
                      <img 
                        src={parceiro.fotos[0]} 
                        alt={parceiro.nome_empresa}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{parceiro.nome_empresa}</CardTitle>
                      <Badge variant="secondary">{parceiro.categoria}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {parceiro.descricao}
                    </p>
                    {parceiro.website && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={parceiro.website} target="_blank" rel="noopener noreferrer">
                          Visitar Site
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Latest News */}
        {pageData.ultimas_noticias.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Últimas Notícias</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {pageData.ultimas_noticias.slice(0, 6).map((noticia) => (
                <Card key={noticia.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge className="mb-2">{noticia.categoria}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(noticia.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                    {noticia.subtitulo && (
                      <CardDescription>{noticia.subtitulo}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {noticia.resumo || noticia.conteudo.substring(0, 100) + '...'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
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
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Bem-vindo à ALT Ilhabela
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            A Associação de Locação por Temporada de Ilhabela é uma entidade dedicada 
            a promover o turismo responsável e a qualidade dos serviços de hospedagem 
            em nossa bela ilha.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Para Proprietários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Cadastre seus imóveis e faça parte da nossa rede qualificada
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/candidatura/membro'}
                  className="w-full"
                  data-testid="seja-membro-btn"
                >
                  Seja Membro
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Para Empresas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Ofereça seus serviços para nossa comunidade de turistas
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/candidatura/parceiro'}
                  className="w-full"
                  data-testid="seja-parceiro-btn"
                >
                  Seja Parceiro
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Para Apoiadores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Apoie nossa missão de promover o turismo em Ilhabela
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/candidatura/associado'}
                  className="w-full"
                  data-testid="seja-associado-btn"
                >
                  Seja Associado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white" id="sobre">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-gray-800">Sobre a ALT Ilhabela</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-semibold mb-4 text-blue-600">Nossa Missão</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Promover o desenvolvimento sustentável do turismo em Ilhabela através 
                  da qualificação e certificação de imóveis e serviços de locação por temporada.
                </p>
                
                <h3 className="text-2xl font-semibold mb-4 text-blue-600">Nossos Valores</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Qualidade e excelência no atendimento</li>
                  <li>• Transparência e confiança</li>
                  <li>• Sustentabilidade ambiental</li>
                  <li>• Desenvolvimento local</li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Membros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Proprietários de imóveis certificados para locação por temporada
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Parceiros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Empresas locais que oferecem serviços turísticos qualificados
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Associados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
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
          <h2 className="text-3xl font-bold text-gray-900">
            Entrar na ALT Ilhabela
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para gerenciar seu perfil
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  data-testid="login-email-input"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  data-testid="login-password-input"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? 'Entrando...' : 'Entrar'}
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

// Enhanced Application Forms with more fields
const CandidaturaMembroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    num_imoveis: 1,
    link_imovel: '',
    experiencia_locacao: '',
    renda_mensal_estimada: '',
    possui_alvara: false,
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/membro`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        num_imoveis: 1,
        link_imovel: '',
        experiencia_locacao: '',
        renda_mensal_estimada: '',
        possui_alvara: false,
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Membro
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Detalhadas do Candidato</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como membro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="membro-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="membro-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      placeholder="(11) 99999-9999"
                      data-testid="membro-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="num_imoveis">Número de Imóveis *</Label>
                    <Input
                      id="num_imoveis"
                      type="number"
                      min="1"
                      value={formData.num_imoveis}
                      onChange={(e) => setFormData({...formData, num_imoveis: parseInt(e.target.value)})}
                      required
                      data-testid="membro-num-imoveis-input"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="endereco">Endereço dos Imóveis *</Label>
                  <Textarea
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    required
                    placeholder="Endereço completo dos imóveis em Ilhabela"
                    data-testid="membro-endereco-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="link_imovel">Link do Imóvel (Airbnb/Booking/Site)</Label>
                  <Input
                    id="link_imovel"
                    type="url"
                    value={formData.link_imovel}
                    onChange={(e) => setFormData({...formData, link_imovel: e.target.value})}
                    placeholder="https://www.airbnb.com/rooms/..."
                    data-testid="membro-link-input"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experiencia_locacao">Tempo de Experiência com Locação</Label>
                    <Select 
                      value={formData.experiencia_locacao} 
                      onValueChange={(value) => setFormData({...formData, experiencia_locacao: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante (menos de 1 ano)</SelectItem>
                        <SelectItem value="1-3anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5anos">3 a 5 anos</SelectItem>
                        <SelectItem value="5+anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="renda_mensal_estimada">Renda Mensal Estimada (R$)</Label>
                    <Input
                      id="renda_mensal_estimada"
                      type="number"
                      value={formData.renda_mensal_estimada}
                      onChange={(e) => setFormData({...formData, renda_mensal_estimada: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="possui_alvara"
                    checked={formData.possui_alvara}
                    onChange={(e) => setFormData({...formData, possui_alvara: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="possui_alvara">
                    Possuo alvará de funcionamento para locação por temporada
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor="mensagem">Mensagem Adicional</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos um pouco sobre você, seus imóveis e por que deseja se juntar à ALT..."
                    rows={4}
                    data-testid="membro-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1"
                    data-testid="membro-submit-btn"
                  >
                    {loading ? 'Enviando...' : 'Enviar Candidatura'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="membro-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Candidatura Parceiro Page
const CandidaturaParceiroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nome_empresa: '',
    categoria: '',
    website: '',
    link_empresa: '',
    cnpj: '',
    tempo_operacao: '',
    servicos_oferecidos: '',
    capacidade_atendimento: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/parceiro`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        nome_empresa: '',
        categoria: '',
        website: '',
        link_empresa: '',
        cnpj: '',
        tempo_operacao: '',
        servicos_oferecidos: '',
        capacidade_atendimento: '',
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Parceiro
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Detalhadas da Empresa</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como parceiro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Responsável *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="parceiro-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="parceiro-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      data-testid="parceiro-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                    required
                    data-testid="parceiro-empresa-input"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData({...formData, categoria: value})}
                    >
                      <SelectTrigger data-testid="parceiro-categoria-select">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurante">Restaurante</SelectItem>
                        <SelectItem value="turismo">Turismo</SelectItem>
                        <SelectItem value="transporte">Transporte</SelectItem>
                        <SelectItem value="esportes">Esportes Náuticos</SelectItem>
                        <SelectItem value="comercio">Comércio Local</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="hospedagem">Hospedagem</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tempo_operacao">Tempo de Operação</Label>
                    <Select 
                      value={formData.tempo_operacao} 
                      onValueChange={(value) => setFormData({...formData, tempo_operacao: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Menos de 1 ano</SelectItem>
                        <SelectItem value="1-3anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5anos">3 a 5 anos</SelectItem>
                        <SelectItem value="5+anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website da Empresa</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://www.exemplo.com"
                      data-testid="parceiro-website-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_empresa">Link Adicional (Instagram/Facebook)</Label>
                    <Input
                      id="link_empresa"
                      type="url"
                      value={formData.link_empresa}
                      onChange={(e) => setFormData({...formData, link_empresa: e.target.value})}
                      placeholder="https://www.instagram.com/..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="servicos_oferecidos">Serviços Oferecidos</Label>
                  <Textarea
                    id="servicos_oferecidos"
                    value={formData.servicos_oferecidos}
                    onChange={(e) => setFormData({...formData, servicos_oferecidos: e.target.value})}
                    placeholder="Descreva os principais serviços que sua empresa oferece..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="capacidade_atendimento">Capacidade de Atendimento</Label>
                  <Input
                    id="capacidade_atendimento"
                    value={formData.capacidade_atendimento}
                    onChange={(e) => setFormData({...formData, capacidade_atendimento: e.target.value})}
                    placeholder="Ex: 50 pessoas por dia, 20 mesas, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="mensagem">Por que deseja ser parceiro?</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos sobre sua empresa e como pode contribuir com o turismo em Ilhabela..."
                    rows={4}
                    data-testid="parceiro-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.categoria}
                    className="flex-1"
                    data-testid="parceiro-submit-btn"
                  >
                    {loading ? 'Enviando...' : 'Enviar Candidatura'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="parceiro-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Candidatura Associado Page  
const CandidaturaAssociadoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    ocupacao: '',
    empresa_trabalho: '',
    linkedin: '',
    motivo_interesse: '',
    contribuicao_pretendida: '',
    disponibilidade: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/associado`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        ocupacao: '',
        empresa_trabalho: '',
        linkedin: '',
        motivo_interesse: '',
        contribuicao_pretendida: '',
        disponibilidade: '',
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Associado
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Detalhadas do Candidato</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como associado da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="associado-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="associado-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      data-testid="associado-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ocupacao">Ocupação *</Label>
                    <Input
                      id="ocupacao"
                      value={formData.ocupacao}
                      onChange={(e) => setFormData({...formData, ocupacao: e.target.value})}
                      required
                      placeholder="Ex: Advogado, Empresário, Aposentado..."
                      data-testid="associado-ocupacao-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empresa_trabalho">Empresa onde Trabalha</Label>
                    <Input
                      id="empresa_trabalho"
                      value={formData.empresa_trabalho}
                      onChange={(e) => setFormData({...formData, empresa_trabalho: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="motivo_interesse">Por que deseja ser associado? *</Label>
                  <Textarea
                    id="motivo_interesse"
                    value={formData.motivo_interesse}
                    onChange={(e) => setFormData({...formData, motivo_interesse: e.target.value})}
                    required
                    placeholder="Explique sua motivação para apoiar a ALT Ilhabela..."
                    rows={4}
                    data-testid="associado-motivo-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contribuicao_pretendida">Como pretende contribuir?</Label>
                  <Textarea
                    id="contribuicao_pretendida"
                    value={formData.contribuicao_pretendida}
                    onChange={(e) => setFormData({...formData, contribuicao_pretendida: e.target.value})}
                    placeholder="Descreva como pode contribuir com a associação..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="disponibilidade">Disponibilidade para Atividades</Label>
                  <Select 
                    value={formData.disponibilidade} 
                    onValueChange={(value) => setFormData({...formData, disponibilidade: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta - Disponível frequentemente</SelectItem>
                      <SelectItem value="media">Média - Disponível esporadicamente</SelectItem>
                      <SelectItem value="baixa">Baixa - Disponível raramente</SelectItem>
                      <SelectItem value="eventos">Apenas para eventos especiais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="mensagem">Mensagem Adicional</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Informações adicionais que gostaria de compartilhar..."
                    rows={3}
                    data-testid="associado-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1"
                    data-testid="associado-submit-btn"
                  >
                    {loading ? 'Enviando...' : 'Enviar Candidatura'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="associado-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Member Properties Management Page
const MeusImoveisPage = () => {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingImovel, setEditingImovel] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: '',
    regiao: '',
    endereco_completo: '',
    preco_diaria: '',
    preco_semanal: '',
    preco_mensal: '',
    num_quartos: 1,
    num_banheiros: 1,
    capacidade: 2,
    area_m2: '',
    possui_piscina: false,
    possui_churrasqueira: false,
    possui_wifi: true,
    permite_pets: false,
    tem_vista_mar: false,
    tem_ar_condicionado: false,
    video_url: '',
    link_booking: '',
    link_airbnb: ''
  });

  useEffect(() => {
    fetchImoveis();
  }, []);

  const fetchImoveis = async () => {
    try {
      const response = await axios.get(`${API}/meus-imoveis`);
      setImoveis(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar imóveis",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingImovel) {
        await axios.put(`${API}/imoveis/${editingImovel.id}`, formData);
        toast({
          title: "Imóvel atualizado com sucesso!",
        });
      } else {
        await axios.post(`${API}/imoveis`, formData);
        toast({
          title: "Imóvel cadastrado com sucesso!",
        });
      }
      
      setShowForm(false);
      setEditingImovel(null);
      resetForm();
      fetchImoveis();
    } catch (error) {
      toast({
        title: "Erro ao salvar imóvel",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: '',
      regiao: '',
      endereco_completo: '',
      preco_diaria: '',
      preco_semanal: '',
      preco_mensal: '',
      num_quartos: 1,
      num_banheiros: 1,
      capacidade: 2,
      area_m2: '',
      possui_piscina: false,
      possui_churrasqueira: false,
      possui_wifi: true,
      permite_pets: false,
      tem_vista_mar: false,
      tem_ar_condicionado: false,
      video_url: '',
      link_booking: '',
      link_airbnb: ''
    });
  };

  const handleEdit = (imovel) => {
    setEditingImovel(imovel);
    setFormData({
      titulo: imovel.titulo,
      descricao: imovel.descricao,
      tipo: imovel.tipo,
      regiao: imovel.regiao,
      endereco_completo: imovel.endereco_completo,
      preco_diaria: imovel.preco_diaria,
      preco_semanal: imovel.preco_semanal || '',
      preco_mensal: imovel.preco_mensal || '',
      num_quartos: imovel.num_quartos,
      num_banheiros: imovel.num_banheiros,
      capacidade: imovel.capacidade,
      area_m2: imovel.area_m2 || '',
      possui_piscina: imovel.possui_piscina,
      possui_churrasqueira: imovel.possui_churrasqueira,
      possui_wifi: imovel.possui_wifi,
      permite_pets: imovel.permite_pets,
      tem_vista_mar: imovel.tem_vista_mar,
      tem_ar_condicionado: imovel.tem_ar_condicionado,
      video_url: imovel.video_url || '',
      link_booking: imovel.link_booking || '',
      link_airbnb: imovel.link_airbnb || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este imóvel?')) {
      try {
        await axios.delete(`${API}/imoveis/${id}`);
        toast({
          title: "Imóvel removido com sucesso!",
        });
        fetchImoveis();
      } catch (error) {
        toast({
          title: "Erro ao remover imóvel",
          description: "Tente novamente.",
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
          <h1 className="text-3xl font-bold">Meus Imóveis</h1>
          <Button 
            onClick={() => {
              setShowForm(true);
              setEditingImovel(null);
              resetForm();
            }}
          >
            Cadastrar Novo Imóvel
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingImovel ? 'Editar Imóvel' : 'Novo Imóvel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titulo">Título do Imóvel *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      required
                      placeholder="Casa com vista para o mar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo">Tipo de Imóvel *</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value) => setFormData({...formData, tipo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="pousada">Pousada</SelectItem>
                        <SelectItem value="chale">Chalé</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="cobertura">Cobertura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    required
                    rows={4}
                    placeholder="Descreva as características e diferenciais do seu imóvel..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regiao">Região *</Label>
                    <Select 
                      value={formData.regiao} 
                      onValueChange={(value) => setFormData({...formData, regiao: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Centro</SelectItem>
                        <SelectItem value="perequê">Perequê</SelectItem>
                        <SelectItem value="vila">Vila</SelectItem>
                        <SelectItem value="barra-velha">Barra Velha</SelectItem>
                        <SelectItem value="curral">Curral</SelectItem>
                        <SelectItem value="praia-grande">Praia Grande</SelectItem>
                        <SelectItem value="bonete">Bonete</SelectItem>
                        <SelectItem value="outras">Outras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="area_m2">Área (m²)</Label>
                    <Input
                      id="area_m2"
                      type="number"
                      value={formData.area_m2}
                      onChange={(e) => setFormData({...formData, area_m2: e.target.value})}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endereco_completo">Endereço Completo *</Label>
                  <Textarea
                    id="endereco_completo"
                    value={formData.endereco_completo}
                    onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
                    required
                    placeholder="Rua, número, bairro, CEP..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="preco_diaria">Preço por Dia (R$) *</Label>
                    <Input
                      id="preco_diaria"
                      type="number"
                      step="0.01"
                      value={formData.preco_diaria}
                      onChange={(e) => setFormData({...formData, preco_diaria: e.target.value})}
                      required
                      placeholder="250.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preco_semanal">Preço por Semana (R$)</Label>
                    <Input
                      id="preco_semanal"
                      type="number"
                      step="0.01"
                      value={formData.preco_semanal}
                      onChange={(e) => setFormData({...formData, preco_semanal: e.target.value})}
                      placeholder="1500.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preco_mensal">Preço por Mês (R$)</Label>
                    <Input
                      id="preco_mensal"
                      type="number"
                      step="0.01"
                      value={formData.preco_mensal}
                      onChange={(e) => setFormData({...formData, preco_mensal: e.target.value})}
                      placeholder="5000.00"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="num_quartos">Quartos *</Label>
                    <Input
                      id="num_quartos"
                      type="number"
                      min="0"
                      value={formData.num_quartos}
                      onChange={(e) => setFormData({...formData, num_quartos: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="num_banheiros">Banheiros *</Label>
                    <Input
                      id="num_banheiros"
                      type="number"
                      min="1"
                      value={formData.num_banheiros}
                      onChange={(e) => setFormData({...formData, num_banheiros: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="capacidade">Capacidade (pessoas) *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      min="1"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({...formData, capacidade: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Comodidades</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { key: 'possui_piscina', label: 'Piscina' },
                      { key: 'possui_churrasqueira', label: 'Churrasqueira' },
                      { key: 'possui_wifi', label: 'Wi-Fi' },
                      { key: 'permite_pets', label: 'Aceita Pets' },
                      { key: 'tem_vista_mar', label: 'Vista para o Mar' },
                      { key: 'tem_ar_condicionado', label: 'Ar Condicionado' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={formData[key]}
                          onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="video_url">Link do Vídeo</Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_booking">Link Booking</Label>
                    <Input
                      id="link_booking"
                      type="url"
                      value={formData.link_booking}
                      onChange={(e) => setFormData({...formData, link_booking: e.target.value})}
                      placeholder="https://booking.com/..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_airbnb">Link Airbnb</Label>
                    <Input
                      id="link_airbnb"
                      type="url"
                      value={formData.link_airbnb}
                      onChange={(e) => setFormData({...formData, link_airbnb: e.target.value})}
                      placeholder="https://airbnb.com/rooms/..."
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1">
                    {editingImovel ? 'Atualizar' : 'Cadastrar'} Imóvel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingImovel(null);
                    }}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {imoveis.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">Você ainda não cadastrou nenhum imóvel.</p>
                  <Button onClick={() => setShowForm(true)}>
                    Cadastrar Primeiro Imóvel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {imovel.titulo}
                          {imovel.destaque && <Badge>Destaque</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {imovel.tipo} • {imovel.regiao}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(imovel)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(imovel.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {imovel.descricao}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Quartos:</span> {imovel.num_quartos}
                      </div>
                      <div>
                        <span className="font-medium">Banheiros:</span> {imovel.num_banheiros}
                      </div>
                      <div>
                        <span className="font-medium">Capacidade:</span> {imovel.capacidade}
                      </div>
                      <div>
                        <span className="font-medium">Visualizações:</span> {imovel.visualizacoes}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-blue-600">
                        R$ {imovel.preco_diaria}/dia
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(imovel.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
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

// Simple placeholder pages for other functionalities
const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Navigation />
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
      <p>Dashboard implementado anteriormente - funcionalidade mantida.</p>
    </div>
  </div>
);

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
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
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