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
import { toast } from './components/ui/use-toast';
import { Toaster } from './components/ui/toaster';

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
      // Verify token and get user info
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
      // Navigation will happen automatically via useAuth
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

// Cloudflare Turnstile Component
const TurnstileWidget = ({ onVerify }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && window.turnstile) {
      window.turnstile.render('#turnstile-widget', {
        sitekey: '0x4AAAAAAABkWN-a6T5C_eLd',
        callback: onVerify,
        'error-callback': () => {
          toast({
            title: "Erro na verificação",
            description: "Tente novamente.",
            variant: "destructive",
          });
        },
      });
    }
  }, [isLoaded, onVerify]);

  return (
    <div className="my-4">
      <div id="turnstile-widget"></div>
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
  const [turnstileToken, setTurnstileToken] = useState('');

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
        description: "Tente novamente mais tarde.",
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

// Dashboard (placeholder for now)
const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard - {user?.role}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {user?.nome}!</CardTitle>
            <CardDescription>
              Seu painel de controle será implementado em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Funcionalidades específicas para seu perfil de {user?.role} estão em desenvolvimento.
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
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
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