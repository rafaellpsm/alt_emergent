import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { CandidaturaMembroPage, CandidaturaParceiroPage, CandidaturaAssociadoPage } from './components/Forms';
import { MeusImoveisPage, TodosImoveisPage, ParceirosPage, MeuPerfilPage } from './components/MemberPages';
import { ImovelDetalhePage, ParceiroDetalhePage } from './components/DetalhesPages';
import { AlterarSenhaPage } from './components/AlterarSenhaPage';
import RecuperarSenhaModal from './components/RecuperarSenhaModal';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import { Badge } from './components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Menu, LogOut, Key, User, Home, FileText, Users, Briefcase, ArrowRight, Utensils } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import { AdminCandidaturasPage, AdminImoveisPage, AdminUsuariosPage, AdminConteudoPage, AdminComunicacaoPage, AdminDestaquesPage } from './components/AdminPages';
import { AnfitriaoPerfilPage } from "./components/AnfitriaoPerfilPage";
import { PerfilPage } from "./components/PerfilPage";
import { NoticiaDetalhePage } from './components/NoticiaDetalhePage';




// Interceptador do Axios para lidar com respostas 401 (Não Autorizado)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      toast({
        title: "Sessão Expirada",
        description: "Por favor, faça o login novamente para continuar.",
        variant: "destructive",
      });
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Configuração da URL da API
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Contexto de Autenticação para gerenciar o estado do usuário
const AuthContext = React.createContext();

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
      return { success: false, error: error.response?.data?.detail || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// --- Componentes de Layout ---

const DefaultLayout = () => (
  <>
    <DefaultHeader />
    <main className="pt-20 bg-gray-50 min-h-screen">
      <Outlet />
    </main>
  </>
);

const HomeLayout = () => <Outlet />;

// --- Rota Protegida ---
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- Menu de Perfil ---
const UserProfileMenu = ({ user, logout, isHomePage = false }) => {
  const triggerClass = isHomePage
    ? 'text-white hover:bg-white/10'
    : 'text-gray-700 hover:bg-gray-100';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClass}>
          <User className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{user.nome}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>{user.nome} <Badge className="ml-2 badge-teal">{user.role}</Badge></DropdownMenuLabel>

        <DropdownMenuSeparator />
        {user.role !== 'admin' && (
          <DropdownMenuItem asChild>
            <a href={user.role === 'parceiro' ? '/meu-perfil' : '/perfil'}>
              <User className="mr-2 h-4 w-4" /> Meu Perfil
            </a>
          </DropdownMenuItem>
        )}

        {user.role !== 'admin' && (
          <DropdownMenuItem asChild>
            <a href="/alterar-senha">
              <Key className="mr-2 h-4 w-4" /> Alterar Senha
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Componente de Link de Navegação (Refatorado) ---
const NavLink = ({ href, children, className, icon: Icon, isMobile = false }) => (
  <a href={href} className={className}>
    {Icon && isMobile && <Icon className="h-5 w-5 mr-2" />}
    <span>{children}</span>
  </a>
);


// --- Navegação ---
const Navigation = ({ isMobile = false, isHomePage = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavLinkClass = (path) =>
    isMobile
      ? `flex items-center space-x-2 py-2 px-3 rounded-md ${location.pathname === path ? 'bg-primary-teal text-white' : 'text-gray-700 hover:bg-gray-100'}`
      : `nav-link-desktop ${isHomePage ? 'text-white hover:text-white/80' : 'text-primary-gray hover:text-primary-teal'}`;

  const publicNavLinks = [{ href: "/imoveis", text: "Imóveis", icon: Home }, { href: "/parceiros", text: "Parceiros", icon: Users }];
  const memberNavLinks = [{ href: "/meus-imoveis", text: "Meus Imóveis", icon: Briefcase }, { href: "/imoveis", text: "Todos os Imóveis", icon: Home }, { href: "/parceiros", text: "Parceiros", icon: Users }];
  const partnerNavLinks = [{ href: "/imoveis", text: "Imóveis", icon: Home }, { href: "/parceiros", text: "Parceiros", icon: Users }];
  const adminNavLinks = [{ href: "/admin/dashboard", text: "Dashboard", icon: Home }];

  let linksToRender = publicNavLinks;
  if (user) {
    if (user.role === 'admin') linksToRender = adminNavLinks;
    else if (user.role === 'membro') linksToRender = memberNavLinks;
    else if (user.role === 'parceiro') linksToRender = partnerNavLinks;
  }

  return (
    <nav className={isMobile ? "flex flex-col space-y-2 pt-4" : "flex items-center space-x-6"}>
      {linksToRender.map(link => (
        <NavLink
          key={link.href}
          href={link.href}
          className={getNavLinkClass(link.href)}
          icon={link.icon}
          isMobile={isMobile}
        >
          {link.text}
        </NavLink>
      ))}
    </nav>
  );
};


// --- Headers ---

const DefaultHeader = () => {
  const { user, logout } = useAuth();
  return (
    <header className='bg-white shadow-md fixed top-0 left-0 right-0 z-50'>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center text-primary-gray">
        <a href="/" className="flex items-center space-x-3">
          <img src="https://img.icons8.com/ios-filled/50/459894/beach.png" alt="ALT Ilhabela Logo" className="h-8 w-8" />
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
        </a>

        {/* Navegação Desktop */}
        <div className="hidden sm:flex items-center space-x-4">
          <Navigation />
          {user ? (
            <UserProfileMenu user={user} logout={logout} />
          ) : (
            <Button size="sm" onClick={() => window.location.href = '/login'} className="btn-primary">
              Entrar
            </Button>
          )}
        </div>

        {/* Menu Mobile */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-gray">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 pt-8">
                {user ? (
                  <>
                    <h3 className="font-bold text-lg text-primary-teal border-b pb-2">Olá, {user.nome}</h3>
                    <Navigation isMobile={true} />
                  </>
                ) : (
                  <Navigation isMobile={true} />
                )}
              </nav>
              {user ? (
                <div className="absolute bottom-4 left-4 right-4">
                  <Button variant="destructive" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 right-4">
                  <Button className="w-full btn-primary" onClick={() => window.location.href = '/login'}>Entrar</Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const HomeHeader = () => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
    ? 'bg-white/80 backdrop-blur-sm shadow-md text-primary-gray'
    : 'bg-transparent text-white'
    }`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center space-x-3">
          <img
            src={isScrolled ? "https://img.icons8.com/ios-filled/50/459894/beach.png" : "https://img.icons8.com/ios-filled/50/ffffff/beach.png"}
            alt="ALT Ilhabela Logo"
            className="h-8 w-8 transition-all"
          />
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
        </a>

        {/* Navegação Desktop */}
        <div className="hidden sm:flex items-center space-x-4">
          <Navigation isHomePage={!isScrolled} />
          {user ? (
            <UserProfileMenu user={user} logout={logout} isHomePage={!isScrolled} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/login'}
              className={isScrolled ? 'text-primary-teal border-primary-teal hover:bg-primary-teal hover:text-white' : 'text-white border-white/50 hover:bg-white hover:text-primary-gray'}
            >
              Entrar
            </Button>
          )}
        </div>

        {/* Menu Mobile */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 pt-8">
                {user ? (
                  <>
                    <h3 className="font-bold text-lg text-primary-teal border-b pb-2">Olá, {user.nome}</h3>
                    <Navigation isMobile={true} />
                  </>
                ) : (
                  <Navigation isMobile={true} />
                )}
              </nav>
              {user ? (
                <div className="absolute bottom-4 left-4 right-4">
                  <Button variant="destructive" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 right-4">
                  <Button className="w-full btn-primary" onClick={() => window.location.href = '/login'}>Entrar</Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

// --- Componentes de Página ---

const HomePage = () => {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({ imoveis_destaque: [], parceiros_destaque: [], noticias_destaque: [] });

  // PASSO 2: A NOVA FUNÇÃO DE ROLAGEM
  const handleScrollToDestaques = () => {
    // CORREÇÃO: O ID da seção de imóveis foi alterado para ser mais específico
    const section = document.getElementById('section-2');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const fetchMainPageData = async () => {
      try {
        const response = await axios.get(`${API}/main-page`);
        setPageData(response.data);
      } catch (error) {
        toast({ title: "Erro ao carregar conteúdo da página", variant: "destructive" });
      }
    };
    fetchMainPageData();
  }, []);

  const CategoryCard = ({ icon, title, description, link }) => (
    <a href={link} className="category-card">
      <div className="category-card-icon">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-primary-gray">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="flex items-center text-primary-teal font-semibold">
        Ver mais <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </a>
  );

  return (
    <div className="bg-gray-50">
      <HomeHeader />
      <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden pt-20">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover" poster="https://images.alphacoders.com/103/1031883.jpg">
          <source src="https://videos.pexels.com/video-files/4433435/4433435-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
        <div className="relative z-10 p-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in-up">ALT Ilhabela</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-300">Descubra acomodações e experiências únicas, com selo de qualidade ALT.</p>

          {/* PASSO 3: BOTÃO ATUALIZADO */}
          <Button size="lg" className="btn-primary-inverse text-lg px-8 py-6 animate-fade-in-up animation-delay-600" onClick={handleScrollToDestaques}>
            Saiba Mais!
          </Button>

        </div>
      </section>
      <main>
        <section id="section-2" className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <CategoryCard icon={<Home className="h-8 w-8" />} title="Explore Nossos Imóveis" description="Casas, apartamentos e chalés selecionados para uma estadia inesquecível." link="/imoveis" />
              <CategoryCard icon={<Utensils className="h-8 w-8" />} title="Conheça Nossos Parceiros" description="Os melhores restaurantes, passeios e serviços para completar sua viagem." link="/parceiros" />
              <CategoryCard icon={<FileText className="h-8 w-8" />} title="Fique por Dentro" description="Acompanhe as últimas notícias, eventos e dicas sobre Ilhabela." link="#noticias" />
            </div>
          </div>
        </section>
        {pageData.noticias_destaque && pageData.noticias_destaque.length > 0 && (
          <section id="noticias" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-10 text-center text-primary-gray">Fique por Dentro</h2>

              {(() => {
                const noticiaPrincipal = pageData.noticias_destaque[0];
                const outrasNoticias = pageData.noticias_destaque.slice(1, 3);

                return (
                  <div className="news-highlight-grid">
                    {/* Card Principal (Grande, à Esquerda) */}
                    <div className="news-highlight-main" onClick={() => navigate(`/noticia/${noticiaPrincipal.id}`)}>
                      <img
                        // CORREÇÃO APLICADA AQUI
                        src={noticiaPrincipal.fotos && noticiaPrincipal.fotos.length > 0 ? noticiaPrincipal.fotos[0] : 'https://placehold.co/800x600?text=Imagem+Indisponível'}
                        alt={noticiaPrincipal.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="news-highlight-overlay">
                        <Badge className="badge-teal mb-2">{noticiaPrincipal.categoria || 'Geral'}</Badge>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">{noticiaPrincipal.titulo}</h3>
                        <p className="text-gray-200 text-sm hidden md:block">{noticiaPrincipal.resumo}</p>
                      </div>
                    </div>

                    {/* Container para os Cards Secundários (à Direita) */}
                    <div className="news-highlight-side">
                      {outrasNoticias.map((noticia) => (
                        <div key={noticia.id} className="news-side-card" onClick={() => navigate(`/noticia/${noticia.id}`)}>
                          <div className="news-side-card-image">
                            <img
                              // CORREÇÃO APLICADA AQUI
                              src={noticia.fotos && noticia.fotos.length > 0 ? noticia.fotos[0] : 'https://placehold.co/400x300?text=Imagem'}
                              alt={noticia.titulo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="news-side-card-content">
                            <Badge className="badge-beige mb-2 text-xs">{noticia.categoria || 'Geral'}</Badge>
                            <h4 className="font-bold text-primary-gray leading-tight">{noticia.titulo}</h4>
                            <span className="text-primary-teal text-sm mt-auto">Ler Mais →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}
        {pageData.imoveis_destaque && pageData.imoveis_destaque.length > 0 && (
          // PASSO 1: ID ADICIONADO À SECÇÃO
          <section id="imoveis-destaque-section" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-10 text-center text-primary-gray">Imóveis em Destaque</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pageData.imoveis_destaque.map((imovel) => (
                  <div key={imovel.id} className="property-card-v2" onClick={() => navigate(`/imovel/${imovel.id}`)}>
                    <div className="relative">
                      <img src={imovel.fotos[0] || 'https://via.placeholder.com/400x300'} alt={imovel.titulo} className="w-full h-64 object-cover" />
                      <Badge className="absolute top-4 left-4 bg-white/90 text-primary-gray">{imovel.regiao}</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-primary-gray mb-2">{imovel.titulo}</h3>
                      <p className="text-sm text-gray-500 mb-4">{imovel.capacidade} hóspedes · {imovel.num_quartos} quartos</p>
                      <div className="text-lg font-bold text-primary-teal">R$ {imovel.preco_diaria} <span className="text-sm font-normal text-gray-600">/ noite</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* Bloco 1: Adicionar Parceiros em Destaque */}
        {pageData.parceiros_destaque && pageData.parceiros_destaque.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-10 text-center text-primary-gray">Parceiros em Destaque</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pageData.parceiros_destaque.map((parceiro) => (
                  <div key={parceiro.id} className="property-card-v2" onClick={() => navigate(`/parceiro/${parceiro.id}`)}>
                    <div className="relative">
                      <img src={parceiro.fotos[0] || 'https://via.placeholder.com/400x300'} alt={parceiro.nome_empresa} className="w-full h-64 object-cover" />
                      <Badge className="absolute top-4 left-4 bg-white/90 text-primary-gray">{parceiro.categoria}</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-primary-gray mb-2">{parceiro.nome_empresa}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{parceiro.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <section id="sobre" className="py-20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-primary-gray">Qualidade e Confiança: O selo ALT Ilhabela</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">A Associação de Locação por Temporada (ALT) de Ilhabela reúne os melhores anfitriões e parceiros da ilha, comprometidos com um turismo de excelência.</p>
              <p className="text-gray-600 mb-6 leading-relaxed">Ao escolher um imóvel ou serviço com o selo ALT, você tem a certeza de encontrar qualidade, segurança e a verdadeira hospitalidade caiçara.</p>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <Button className="btn-primary" onClick={() => navigate('/candidatura/membro')}>Seja um Membro</Button>
                <Button variant="outline" className="btn-outline-primary" onClick={() => navigate('/candidatura/parceiro')}>Seja um Parceiro</Button>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <img src="https://images.pexels.com/photos/1032646/pexels-photo-1032646.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Pessoas na praia de Ilhabela" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      toast({ title: "Erro no login", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-gray">Entrar na ALT Ilhabela</h2>
        </div>
        <Card className="card-custom">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full btn-primary" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center">
                <Button type="button" variant="link" onClick={() => setShowRecuperarSenha(true)} className="text-sm text-primary-teal hover:underline">
                  Esqueci minha senha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
          <Button type="button" variant="link" onClick={() => window.location.href = '/'} className="text-sm text-primary-teal hover:underline">
            Voltar para a tela inicial
          </Button>
        </div>
        <RecuperarSenhaModal isOpen={showRecuperarSenha} onClose={() => setShowRecuperarSenha(false)} />
      </div>
    </div>
  );
};

// --- Componente Principal (Roteador) ---
const MainApp = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route element={<DefaultLayout />}>
          <Route path="/imoveis" element={<TodosImoveisPage />} />
          <Route path="/parceiros" element={<ParceirosPage />} />
          <Route path="/imovel/:id" element={<ImovelDetalhePage />} />
          <Route path="/parceiro/:id" element={<ParceiroDetalhePage />} />
          <Route path="/meus-imoveis" element={<ProtectedRoute allowedRoles={['membro']}><MeusImoveisPage /></ProtectedRoute>} />
          <Route path="/meu-perfil" element={<ProtectedRoute allowedRoles={['parceiro']}><MeuPerfilPage /></ProtectedRoute>} />
          <Route path="/anfitriao/:id" element={<AnfitriaoPerfilPage />} />
          <Route path="/alterar-senha" element={<ProtectedRoute><AlterarSenhaPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/candidaturas" element={<ProtectedRoute allowedRoles={['admin']}><AdminCandidaturasPage /></ProtectedRoute>} />
          <Route path="/admin/imoveis" element={<ProtectedRoute allowedRoles={['admin']}><AdminImoveisPage /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsuariosPage /></ProtectedRoute>} />
          <Route path="/admin/conteudo" element={<ProtectedRoute allowedRoles={['admin']}><AdminConteudoPage /></ProtectedRoute>} />
          <Route path="/admin/comunicacao" element={<ProtectedRoute allowedRoles={['admin']}><AdminComunicacaoPage /></ProtectedRoute>} />
          <Route path="/admin/destaques" element={<ProtectedRoute allowedRoles={['admin']}><AdminDestaquesPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/noticia/:id" element={<NoticiaDetalhePage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/candidatura/membro" element={<CandidaturaMembroPage />} />
        <Route path="/candidatura/parceiro" element={<CandidaturaParceiroPage />} />
        <Route path="/candidatura/associado" element={<CandidaturaAssociadoPage />} />
        <Route path="/main" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </AuthProvider>
);

export default MainApp;