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
    return <Navigate to="/dashboard" replace />;
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
            href="/dashboard" 
            className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </a>
          
          {user.role === 'admin' && (
            <>
              <a 
                href="/admin/candidaturas" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Candidaturas
              </a>
              <a 
                href="/admin/usuarios" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Usuários
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
                href="/imoveis" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Meus Imóveis
              </a>
              <a 
                href="/membros" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Membros
              </a>
              <a 
                href="/parceiros" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Parceiros
              </a>
            </>
          )}
          
          {user.role === 'parceiro' && (
            <>
              <a 
                href="/perfil-parceiro" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Meu Perfil
              </a>
              <a 
                href="/membros" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                Membros
              </a>
              <a 
                href="/parceiros" 
                className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
              Parceiros
              </a>
            </>
          )}
          
          {(user.role === 'associado' || user.role === 'membro' || user.role === 'parceiro') && (
            <a 
              href="/noticias" 
              className="py-3 px-1 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600"
            >
              Notícias
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

// Home Page
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
    return <Navigate to="/dashboard" replace />;
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

// Application Forms
const CandidaturaMembroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    num_imoveis: 1,
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Membro
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações do Candidato</CardTitle>
              <CardDescription>
                Preencha as informações abaixo para se candidatar como membro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    data-testid="membro-nome-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    data-testid="membro-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                    data-testid="membro-telefone-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endereco">Endereço dos Imóveis</Label>
                  <Textarea
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    required
                    data-testid="membro-endereco-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="num_imoveis">Número de Imóveis</Label>
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
                
                <div>
                  <Label htmlFor="mensagem">Mensagem (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos um pouco sobre você e seus imóveis..."
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

// Candidatura Parceiro Page
const CandidaturaParceiroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nome_empresa: '',
    categoria: '',
    website: '',
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Parceiro
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Preencha as informações abaixo para se candidatar como parceiro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Responsável</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    data-testid="parceiro-nome-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    data-testid="parceiro-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                    data-testid="parceiro-telefone-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                    required
                    data-testid="parceiro-empresa-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
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
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="website">Website (Opcional)</Label>
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
                  <Label htmlFor="mensagem">Mensagem (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos sobre seus serviços e como pode contribuir com a ALT..."
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

// Candidatura Associado Page
const CandidaturaAssociadoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    ocupacao: '',
    motivo_interesse: '',
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
        motivo_interesse: '',
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            Candidatura para Associado
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações do Candidato</CardTitle>
              <CardDescription>
                Preencha as informações abaixo para se candidatar como associado da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    data-testid="associado-nome-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    data-testid="associado-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                    data-testid="associado-telefone-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ocupacao">Ocupação</Label>
                  <Input
                    id="ocupacao"
                    value={formData.ocupacao}
                    onChange={(e) => setFormData({...formData, ocupacao: e.target.value})}
                    required
                    placeholder="Ex: Advogado, Empresário, Aposentado..."
                    data-testid="associado-ocupacao-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="motivo_interesse">Por que deseja ser associado?</Label>
                  <Textarea
                    id="motivo_interesse"
                    value={formData.motivo_interesse}
                    onChange={(e) => setFormData({...formData, motivo_interesse: e.target.value})}
                    required
                    placeholder="Explique sua motivação para apoiar a ALT Ilhabela..."
                    data-testid="associado-motivo-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="mensagem">Mensagem Adicional (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Informações adicionais que gostaria de compartilhar..."
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

// Admin Dashboard with Statistics
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_membros: 0,
    total_parceiros: 0,
    total_associados: 0,
    candidaturas_pendentes: 0,
    total_imoveis: 0,
    total_noticias: 0
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Candidaturas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.candidaturas_pendentes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Imóveis Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_imoveis}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Notícias Publicadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.total_noticias}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total_membros}</div>
              <p className="text-gray-600">Proprietários de imóveis</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parceiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.total_parceiros}</div>
              <p className="text-gray-600">Empresas parceiras</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Associados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.total_associados}</div>
              <p className="text-gray-600">Apoiadores da ALT</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Admin Panel for Applications
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
      fetchCandidaturas(); // Refresh data
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
      fetchCandidaturas(); // Refresh data
    } catch (error) {
      toast({
        title: "Erro ao recusar",
        description: error.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const CandidaturaCard = ({ candidatura, tipo }) => (
    <Card key={candidatura.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{candidatura.nome}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {new Date(candidatura.created_at).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </div>
        <CardDescription>{candidatura.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Telefone:</strong> {candidatura.telefone}</p>
            {candidatura.endereco && <p><strong>Endereço:</strong> {candidatura.endereco}</p>}
            {candidatura.num_imoveis && <p><strong>Nº Imóveis:</strong> {candidatura.num_imoveis}</p>}
            {candidatura.nome_empresa && <p><strong>Empresa:</strong> {candidatura.nome_empresa}</p>}
            {candidatura.categoria && <p><strong>Categoria:</strong> {candidatura.categoria}</p>}
            {candidatura.ocupacao && <p><strong>Ocupação:</strong> {candidatura.ocupacao}</p>}
          </div>
          <div>
            {candidatura.mensagem && (
              <div>
                <p><strong>Mensagem:</strong></p>
                <p className="text-gray-700 text-sm mt-1">{candidatura.mensagem}</p>
              </div>
            )}
            {candidatura.motivo_interesse && (
              <div>
                <p><strong>Motivo do Interesse:</strong></p>
                <p className="text-gray-700 text-sm mt-1">{candidatura.motivo_interesse}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => handleAprovar(tipo, candidatura.id)}
            className="bg-green-600 hover:bg-green-700"
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
        <h1 className="text-3xl font-bold mb-8">Gerenciar Candidaturas</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="membros">Membros ({candidaturasMembros.length})</TabsTrigger>
            <TabsTrigger value="parceiros">Parceiros ({candidaturasParceiros.length})</TabsTrigger>
            <TabsTrigger value="associados">Associados ({candidaturasAssociados.length})</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <TabsContent value="membros" className="space-y-4">
                <h2 className="text-xl font-semibold">Candidaturas para Membro</h2>
                {candidaturasMembros.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
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
                <h2 className="text-xl font-semibold">Candidaturas para Parceiro</h2>
                {candidaturasParceiros.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
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
                <h2 className="text-xl font-semibold">Candidaturas para Associado</h2>
                {candidaturasAssociados.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
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

// Content Management
const AdminConteudo = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [novaNoticia, setNovaNoticia] = useState({
    titulo: '',
    conteudo: ''
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
      setNovaNoticia({ titulo: '', conteudo: '' });
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Conteúdo</h1>
          <Button onClick={() => setShowForm(true)}>
            Criar Nova Notícia
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nova Notícia</CardTitle>
              <CardDescription>
                Crie uma nova notícia para ser exibida na área dos membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateNoticia} className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={novaNoticia.titulo}
                    onChange={(e) => setNovaNoticia({...novaNoticia, titulo: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="conteudo">Conteúdo</Label>
                  <Textarea
                    id="conteudo"
                    rows={6}
                    value={novaNoticia.conteudo}
                    onChange={(e) => setNovaNoticia({...novaNoticia, conteudo: e.target.value})}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Publicar</Button>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {noticias.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhuma notícia publicada
                </CardContent>
              </Card>
            ) : (
              noticias.map(noticia => (
                <Card key={noticia.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{noticia.titulo}</CardTitle>
                        <CardDescription>
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
                    <p className="whitespace-pre-wrap">{noticia.conteudo}</p>
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

// Communication (Mass Email)
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
        <h1 className="text-3xl font-bold mb-8">Comunicação</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Enviar Email em Massa</CardTitle>
            <CardDescription>
              Envie emails para grupos específicos de usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <Label>Destinatários</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'admin', label: 'Administradores' },
                    { value: 'membro', label: 'Membros' },
                    { value: 'parceiro', label: 'Parceiros' },
                    { value: 'associado', label: 'Associados' },
                    { value: 'todos', label: 'Todos os Usuários' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={emailData.destinatarios.includes(option.value)}
                        onChange={(e) => handleDestinatarioChange(option.value, e.target.checked)}
                        className="rounded"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="assunto">Assunto</Label>
                <Input
                  id="assunto"
                  value={emailData.assunto}
                  onChange={(e) => setEmailData({...emailData, assunto: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  rows={8}
                  value={emailData.mensagem}
                  onChange={(e) => setEmailData({...emailData, mensagem: e.target.value})}
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Dashboard Page Router
const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard - {user?.role}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {user?.nome}!</CardTitle>
            <CardDescription>
              Funcionalidades específicas para seu perfil estão sendo implementadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Em breve você terá acesso a todas as funcionalidades do seu perfil de {user?.role}.
            </p>
          </CardContent>
        </Card>
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
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/candidaturas" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCandidaturas />
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
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;