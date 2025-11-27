import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { CandidaturaMembroPage, CandidaturaParceiroPage, CandidaturaAssociadoPage } from './components/Forms';
import { MeusImoveisPage, TodosImoveisPage, ParceirosPage, MeuPerfilPage } from './components/MemberPages';
import { ImovelDetalhePage, ParceiroDetalhePage } from './components/DetalhesPages';
import { AlterarSenhaPage } from './components/AlterarSenhaPage';
import RecuperarSenhaModal from './components/RecuperarSenhaModal';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import { Badge } from './components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Menu, LogOut, Key, User, Home, FileText, Users, Briefcase, ArrowRight, Utensils, Eye } from 'lucide-react';
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
            <Link to={user.role === 'parceiro' ? '/meu-perfil' : '/perfil'}>
              <User className="mr-2 h-4 w-4" /> Meu Perfil
            </Link>
          </DropdownMenuItem>
        )}

        {user.role !== 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/alterar-senha">
              <Key className="mr-2 h-4 w-4" /> Alterar Senha
            </Link>
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

// --- Navegação Melhorada ---
const Navigation = ({ isMobile = false, isHomePage = false, onNavClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  const baseMobileClass = "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium";
  const activeMobileClass = "bg-primary-teal/10 text-primary-teal border-l-4 border-primary-teal";
  const inactiveMobileClass = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  const baseDesktopClass = "text-sm font-medium transition-colors duration-200 flex items-center gap-2";
  const homeDesktopClass = "text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md";
  const defaultDesktopClass = "text-gray-600 hover:text-primary-teal hover:bg-gray-100 px-3 py-2 rounded-md";

  const getNavLinkClass = (path) => {
    if (isMobile) {
      return `${baseMobileClass} ${location.pathname === path ? activeMobileClass : inactiveMobileClass}`;
    }
    return `${baseDesktopClass} ${isHomePage ? homeDesktopClass : defaultDesktopClass}`;
  };

  const publicNavLinks = [
    { href: "/imoveis", text: "Imóveis", icon: Home },
    { href: "/parceiros", text: "Parceiros", icon: Users }
  ];

  const memberNavLinks = [
    { href: "/meus-imoveis", text: "Meus Imóveis", icon: Briefcase },
    { href: "/imoveis", text: "Todos os Imóveis", icon: Home },
    { href: "/parceiros", text: "Parceiros", icon: Users }
  ];

  const partnerNavLinks = [
    { href: "/meu-perfil", text: "Meu Negócio", icon: Briefcase },
    { href: "/imoveis", text: "Imóveis", icon: Home },
    { href: "/parceiros", text: "Parceiros", icon: Users }
  ];

  const adminNavLinks = [
    { href: "/admin/dashboard", text: "Dashboard", icon: Home },
    { href: "/imoveis", text: "Ver Site", icon: Eye }
  ];

  let linksToRender = publicNavLinks;
  if (user) {
    if (user.role === 'admin') linksToRender = adminNavLinks;
    else if (user.role === 'membro') linksToRender = memberNavLinks;
    else if (user.role === 'parceiro') linksToRender = partnerNavLinks;
  }

  return (
    <nav className={isMobile ? "flex flex-col space-y-2 w-full" : "flex items-center space-x-2"}>
      {linksToRender.map(link => (
        <Link
          key={link.href}
          to={link.href}
          className={getNavLinkClass(link.href)}
          onClick={onNavClick}
        >
          {isMobile && link.icon && <link.icon className={`h-5 w-5 ${location.pathname === link.href ? "text-primary-teal" : "text-gray-400"}`} />}
          <span>{link.text}</span>
        </Link>
      ))}
    </nav>
  );
};

// --- Header Padrão ---
const DefaultHeader = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 h-20'>
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="bg-primary-teal/10 p-2 rounded-lg group-hover:bg-primary-teal/20 transition-colors">
            <img src="/assets/logo.png" alt="Logo" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-primary-gray tracking-tight">ALT<span className="text-primary-teal">Ilhabela</span></span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Navigation />
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          {user ? (
            <UserProfileMenu user={user} logout={logout} />
          ) : (
            <Button size="sm" onClick={() => window.location.href = '/login'} className="btn-primary shadow-md hover:shadow-lg transition-all">
              Entrar
            </Button>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <Menu className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col border-l-0">
              <div className="p-6 bg-gray-50 border-b">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary-teal text-white flex items-center justify-center text-xl font-bold shadow-md">
                      {user.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{user.nome}</p>
                      <p className="text-xs text-gray-500 capitalize badge-beige px-2 py-0.5 rounded-full inline-block mt-1">{user.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-primary-gray">Bem-vindo!</h3>
                    <p className="text-sm text-gray-500">Faça login para aceder à sua conta.</p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-2">
                <Navigation isMobile={true} onNavClick={() => setIsOpen(false)} />
                {user && user.role !== 'admin' && (
                  <>
                    <div className="my-4 border-t border-gray-100 mx-4"></div>
                    <Link
                      to="/alterar-senha"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <Key className="h-5 w-5 text-gray-400" />
                      <span>Alterar Senha</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 mt-auto">
                {user ? (
                  <Button variant="destructive" className="w-full justify-start" onClick={() => { logout(); setIsOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair da Conta
                  </Button>
                ) : (
                  <div className="grid gap-3">
                    <Button className="w-full btn-primary" onClick={() => { window.location.href = '/login'; setIsOpen(false); }}>
                      Entrar
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

// --- Header da Home ---
const HomeHeader = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
    }`;

  const logoSrc = isScrolled
    ? "https://img.icons8.com/ios-filled/50/459894/beach.png"
    : "https://img.icons8.com/ios-filled/50/ffffff/beach.png";

  const textColor = isScrolled ? "text-primary-gray" : "text-white";

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <img src={logoSrc} alt="Logo" className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span className={`text-2xl font-bold ${textColor} tracking-tight`}>ALT Ilhabela</span>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          <Navigation isHomePage={!isScrolled} />
          {user ? (
            <UserProfileMenu user={user} logout={logout} isHomePage={!isScrolled} />
          ) : (
            <Button
              variant={isScrolled ? "default" : "outline"}
              size="sm"
              onClick={() => window.location.href = '/login'}
              className={isScrolled
                ? 'btn-primary shadow-sm'
                : 'text-white border-white hover:bg-white hover:text-primary-gray backdrop-blur-sm bg-white/10'}
            >
              Entrar
            </Button>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={isScrolled ? "text-gray-800" : "text-white hover:bg-white/20"}>
                <Menu className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 flex flex-col border-l-0">
              <div className="p-6 bg-gray-50 border-b">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary-teal text-white flex items-center justify-center text-xl font-bold shadow-md">
                      {user.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{user.nome}</p>
                      <p className="text-xs text-gray-500 capitalize badge-beige px-2 py-0.5 rounded-full inline-block mt-1">{user.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-primary-gray">Bem-vindo!</h3>
                    <p className="text-sm text-gray-500">Descubra o melhor de Ilhabela.</p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-2">
                <Navigation isMobile={true} onNavClick={() => setIsOpen(false)} />
                {user && user.role !== 'admin' && (
                  <Link
                    to="/alterar-senha"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium mt-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Key className="h-5 w-5 text-gray-400" />
                    <span>Alterar Senha</span>
                  </Link>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 mt-auto">
                {user ? (
                  <Button variant="destructive" className="w-full justify-start" onClick={() => { logout(); setIsOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair da Conta
                  </Button>
                ) : (
                  <Button className="w-full btn-primary" onClick={() => { window.location.href = '/login'; setIsOpen(false); }}>
                    Entrar na Conta
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

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

// --- Componentes de Página ---
const HomePage = () => {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({ imoveis_destaque: [], parceiros_destaque: [], noticias_destaque: [] });

  const handleScrollToDestaques = () => {
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
        console.error("Erro na home:", error);
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
              <div className="news-highlight-grid">
                <div className="news-highlight-main" onClick={() => navigate(`/noticia/${pageData.noticias_destaque[0].id}`)}>
                  <img
                    src={pageData.noticias_destaque[0].fotos?.[0] || 'https://placehold.co/800x600?text=Imagem'}
                    alt={pageData.noticias_destaque[0].titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="news-highlight-overlay">
                    <Badge className="badge-teal mb-2">{pageData.noticias_destaque[0].categoria}</Badge>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">{pageData.noticias_destaque[0].titulo}</h3>
                  </div>
                </div>
                <div className="news-highlight-side">
                  {pageData.noticias_destaque.slice(1, 3).map((noticia) => (
                    <div key={noticia.id} className="news-side-card" onClick={() => navigate(`/noticia/${noticia.id}`)}>
                      <div className="news-side-card-image">
                        <img src={noticia.fotos?.[0] || 'https://placehold.co/400x300'} alt={noticia.titulo} className="w-full h-full object-cover" />
                      </div>
                      <div className="news-side-card-content">
                        <Badge className="badge-beige mb-2 text-xs">{noticia.categoria}</Badge>
                        <h4 className="font-bold text-primary-gray leading-tight">{noticia.titulo}</h4>
                        <span className="text-primary-teal text-sm mt-auto">Ler Mais →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
        {pageData.imoveis_destaque && pageData.imoveis_destaque.length > 0 && (
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
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
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