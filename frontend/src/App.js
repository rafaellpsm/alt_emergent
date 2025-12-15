import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { CandidaturaMembroPage, CandidaturaParceiroPage, CandidaturaAssociadoPage } from './components/Forms';
import { MeusImoveisPage, TodosImoveisPage, ParceirosPage, MeuPerfilPage } from './components/MemberPages';
import { ImovelDetalhePage, ParceiroDetalhePage } from './components/DetalhesPages';
import { AlterarSenhaPage } from './components/AlterarSenhaPage';
import RecuperarSenhaModal from './components/RecuperarSenhaModal';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import { Badge } from './components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import {
  Menu, LogOut, Key, User, Home, FileText, Users, Briefcase, ArrowRight,
  Utensils, Eye, MapPin, Calendar, ExternalLink, Compass, Ticket, Phone,
  Siren, Shield, Stethoscope, Clock, Truck, Megaphone, Leaf, Heart, BookOpen,
  VolumeX, LifeBuoy, Building2
} from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import { AdminCandidaturasPage, AdminImoveisPage, AdminUsuariosPage, AdminConteudoPage, AdminComunicacaoPage, AdminDestaquesPage } from './components/AdminPages';
import { AnfitriaoPerfilPage } from "./components/AnfitriaoPerfilPage";
import { PerfilPage } from "./components/PerfilPage";
import { NoticiaDetalhePage } from './components/NoticiaDetalhePage';
import logoTeal from './assets/logo_horiz.png';
import logoGray from './assets/logo_horiz.png';
import logoPraia from './assets/logo_praia.png';
import peixe1 from './assets/galeria/sardinha_ilhabela.png';
import parque2 from './assets/galeria/parque_ilhabela.png';
import cachoeira3 from './assets/galeria/cachoeira_ilhabela.png';
import praia4 from './assets/galeria/praia_ilhabela.png';
import mirante5 from './assets/galeria/mirante_ilhabela.png';
import farol6 from './assets/galeria/farol_ilhabela.png';
import pescador7 from './assets/galeria/trabalhador_Ilhabela.png';

// --- CONFIGURAÇÃO E HOOKS ---
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      toast({ title: "Sessão Expirada", description: "Faça login novamente.", variant: "destructive" });
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AuthContext = React.createContext();

// --- ANIMAÇÃO (Fade In) ---
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setVisible(entry.isIntersecting));
    });
    const currentElement = domRef.current;
    if (currentElement) observer.observe(currentElement);
    return () => { if (currentElement) observer.unobserve(currentElement); };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- AUTH PROVIDER ---
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    } else { setLoading(false); }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally { setLoading(false); }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return { success: true };
    } catch (error) { return { success: false, error: error.response?.data?.detail || 'Erro ao fazer login' }; }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};
const useAuth = () => React.useContext(AuthContext);

// --- COMPONENTES DE UI ---
const UserProfileMenu = ({ user, logout, isHomePage = false }) => {
  const triggerClass = isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className={triggerClass}><User className="h-4 w-4 mr-2" /><span className="hidden sm:inline">{user.nome}</span></Button></DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>{user.nome} <Badge className="ml-2 badge-teal">{user.role}</Badge></DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role !== 'admin' && <DropdownMenuItem asChild><Link to={user.role === 'parceiro' ? '/meu-perfil' : '/perfil'}><User className="mr-2 h-4 w-4" /> Meu Perfil</Link></DropdownMenuItem>}
        {user.role !== 'admin' && <DropdownMenuItem asChild><Link to="/alterar-senha"><Key className="mr-2 h-4 w-4" /> Alterar Senha</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer"><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- NAVEGAÇÃO INTELIGENTE ---
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
    if (user.role === 'admin') {
      linksToRender = [
        ...adminNavLinks,
        { href: "/meus-imoveis", text: "Gerir Meus Imóveis", icon: Briefcase },
        { href: "/meu-perfil", text: "Meu Negócio (Parceiro)", icon: Briefcase },
        { href: "/parceiros", text: "Parceiros", icon: Users }
      ];
    }
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

const DefaultHeader = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 h-20'>
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <img
            src={logoTeal}
            alt="Logo"
            className="h-14 w-auto transition-transform group-hover:scale-110"
          />
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

const HomeHeader = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`;
  const logoSrc = isScrolled ? logoTeal : logoGray;
  const textColor = isScrolled ? "text-primary-gray" : "text-white";

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <img src={logoSrc} alt="Logo" className="h-14 w-auto transition-transform group-hover:scale-110" />
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          <Navigation isHomePage={!isScrolled} />
          {user ? <UserProfileMenu user={user} logout={logout} isHomePage={!isScrolled} /> : <Button variant={isScrolled ? "default" : "outline"} size="sm" onClick={() => window.location.href = '/login'} className={isScrolled ? 'btn-primary' : 'text-white border-white hover:bg-white hover:text-primary-gray'}>Entrar</Button>}
        </div>
        <div className="md:hidden"><Sheet open={isOpen} onOpenChange={setIsOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className={isScrolled ? "text-gray-800" : "text-white"}><Menu className="h-7 w-7" /></Button></SheetTrigger><SheetContent side="right"><Navigation isMobile={true} onNavClick={() => setIsOpen(false)} /></SheetContent></Sheet></div>
      </div>
    </header>
  );
};

// --- LAYOUTS ---
const DefaultLayout = () => (
  <>
    <DefaultHeader />
    <main className="pt-20 bg-gray-50 min-h-screen">
      <Outlet />
    </main>
  </>
);

const HomeLayout = () => <Outlet />;

// --- ROTA PROTEGIDA ---
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

// --- SECÇÃO: TELEFONES ÚTEIS ---
const TelefonesUteisSection = () => {
  const phones = [
    { title: "Prefeitura de Ilhabela", number: "(12) 3895-8400", desc: "Informações gerais e serviços públicos", icon: Building2 },
    { title: "Emergência", number: "193 (Bombeiros) / 192 (SAMU)", desc: "Atendimento emergencial 24 horas", icon: Siren },
    { title: "Hospital", number: "(12) 3896-1234", desc: "Hospital Municipal de Ilhabela", icon: Stethoscope },
    { title: "Fila Hora Marcada", number: "(12) 3896-5000", desc: "Agendamento de travessia de balsa", icon: Clock },
    { title: "Polícia Militar", number: "190", desc: "Emergências policiais", icon: Shield },
    { title: "Táxi / Transporte", number: "(12) 3896-1500", desc: "Serviço de táxi local", icon: Truck },
    { title: "Lei do Silêncio", number: "(12) 3895-8400", desc: "Denúncias de perturbação sonora", icon: VolumeX },
    { title: "Defesa Civil", number: "199", desc: "Ocorrências ambientais e climáticas", icon: LifeBuoy },
  ];

  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary-gray mb-4">Telefones Úteis</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Principais contatos e serviços de Ilhabela para sua segurança e comodidade</p>
          </div>
        </FadeInSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phones.map((p, idx) => (
            <FadeInSection key={idx} delay={idx * 50}>
              <Card className="hover:shadow-lg transition-shadow border-none shadow h-full bg-gray-50 hover:bg-teal-50/30">
                <CardContent className="p-6 flex flex-col items-start">
                  <div className="bg-primary-teal text-white p-3 rounded-lg mb-4">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-primary-gray mb-1">{p.title}</h3>
                  <p className="text-primary-teal font-medium mb-2">{p.number}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
        <FadeInSection delay={400}>
          <div className="mt-10 bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
            <Siren className="h-8 w-8 text-primary-teal mx-auto mb-2" />
            <h4 className="font-bold text-lg text-teal-900">Em caso de emergência</h4>
            <p className="text-teal-800">Ligue 193 (Bombeiros), 192 (SAMU) ou 190 (Polícia)</p>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
};

// --- SECÇÃO: SOBRE ILHABELA ---
const SobreSection = () => {
  return (
    <section className="bg-white w-full">
      <FadeInSection>
        <div className="grid grid-cols-2 md:grid-cols-4 h-48 md:h-64">
          {/* Peixe */}
          <div className="w-full h-full overflow-hidden">
            <img src={peixe1} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Cultura Caiçara" />
          </div>
          {/* Placa Parque (Usando natureza similar) */}
          <div className="w-full h-full overflow-hidden">
            <img src={parque2} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Parque Estadual" />
          </div>
          {/* Cachoeira */}
          <div className="w-full h-full overflow-hidden">
            <img src={cachoeira3} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Cachoeiras" />
          </div>
          {/* Praia/Barco */}
          <div className="w-full h-full overflow-hidden">
            <img src={praia4} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Praias" />
          </div>
        </div>
      </FadeInSection>

      {/* 2ª Fileira: Logo Centralizada */}
      <FadeInSection delay={200}>
        <div className="flex items-center justify-center py-16 md:py-24 bg-white">
          <img src={logoTeal} className="h-20 md:h-32 w-auto animate-fade-in-up" alt="Logo ALT" />
        </div>
      </FadeInSection>

      {/* 3ª Fileira: 3 Imagens (Letreiro, Farol, Pescador) */}
      <FadeInSection delay={400}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-auto md:h-80">
          {/* Letreiro Ilhabela (Usando visual praia colorida) */}
          <div className="w-full h-64 md:h-full overflow-hidden">
            <img src={mirante5} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Ilhabela" />
          </div>
          {/* Farol */}
          <div className="w-full h-64 md:h-full overflow-hidden">
            <img src={farol6} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Farol" />
          </div>
          {/* Pescador/Rede */}
          <div className="w-full h-64 md:h-full overflow-hidden">
            <img src={pescador7} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Pescador" />
          </div>
        </div>
      </FadeInSection>
    </section>
  );
};

// --- SECÇÃO: EXPLORE ILHABELA ---
const ExploreIlhabelaSection = () => {
  const regions = [
    { name: 'Centro', link: 'https://turismoilhabela.com/centro-2/' },
    { name: 'Norte', link: 'https://turismoilhabela.com/norte/' },
    { name: 'Leste', link: 'https://turismoilhabela.com/leste/' },
    { name: 'Sul', link: 'https://turismoilhabela.com/sul/' }
  ];

  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#459894] to-[#2c6e6b] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
              <video
                src="https://videos.pexels.com/video-files/4552029/4552029-hd_1920_1080_30fps.mp4"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                controls
                poster="https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h3 className="text-white text-2xl md:text-3xl font-bold drop-shadow-md text-center px-4">Viva a Experiência Ilhabela</h3>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <Badge className="badge-teal mb-2">Explore</Badge>
                <h2 className="text-3xl font-bold text-primary-gray leading-tight">Descubra cada Canto</h2>
                <p className="text-gray-600 mt-2">A ilha é dividida em regiões únicas. Escolha o seu destino.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {regions.map((region, index) => (
                <a key={index} href={region.link} target="_blank" rel="noopener noreferrer" className="group relative h-24 rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#459894] to-[#2c6e6b] opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex items-center gap-2 text-white font-bold text-lg"><Compass className="h-5 w-5" /> {region.name}</div>
                </a>
              ))}
            </div>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <p className="text-sm text-teal-800 flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /> Quer saber mais sobre praias, trilhas e atrações turísticas de cada região? Clique nos botões acima para visitar o guia oficial.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- SECÇÃO: CTA (SEJA MEMBRO/PARCEIRO) ---
const CTASection = ({ navigate }) => {
  return (
    <section className="py-24 relative overflow-hidden bg-[#f8f9fa]"> {/* Fundo claro suave */}
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Lado do Texto */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Qualidade e Confiança: <br />
              <span className="text-primary-teal">O selo ALT Ilhabela</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-xl">
              A Associação de Locação por Temporada (ALT) de Ilhabela reúne os melhores anfitriões e parceiros da ilha, comprometidos com um turismo de excelência, segurança e sustentabilidade.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              variant="outline"
              className="border-2 border-gray-200 text-gray-700 hover:border-primary-teal hover:text-primary-teal hover:bg-teal-50 font-bold text-lg px-8 py-7 h-auto rounded-xl transition-all"
              onClick={() => navigate('/candidatura/membro')}
            >
              Seja um Membro
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-200 text-gray-700 hover:border-primary-teal hover:text-primary-teal hover:bg-teal-50 font-bold text-lg px-8 py-7 h-auto rounded-xl transition-all"
              onClick={() => navigate('/candidatura/parceiro')}
            >
              Seja um Parceiro
            </Button>
          </div>
        </div>

        {/* Lado da Imagem (Visual Clean) */}
        <div className="relative">
          <div className="absolute -inset-4 bg-primary-teal/10 rounded-[2rem] transform rotate-3 transition-transform group-hover:rotate-6"></div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
            <img
              src={logoPraia}
              alt="Logo na praia de Ilhabela"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
          </div>
          {/* Elemento Decorativo Flutuante */}
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Confiança</p>
                <p className="font-bold text-gray-900">Selo Verificado</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
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

        {/* --- IMÓVEIS EM DESTAQUE --- */}
        {pageData.imoveis_destaque && pageData.imoveis_destaque.length > 0 && (
          <section id="imoveis-destaque-section" className="py-20 bg-white border-t border-gray-100">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold mb-10 text-center text-primary-gray">Imóveis em Destaque</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pageData.imoveis_destaque.map((imovel) => (
                  <div key={imovel.id} className="property-card-v2" onClick={() => navigate(`/imovel/${imovel.id}`)}>
                    <div className="relative">
                      <img src={imovel.fotos[0] || 'https://via.placeholder.com/400x300'} alt={imovel.titulo} className="w-full h-56 object-cover" />
                      <Badge className="absolute top-4 left-4 bg-white/90 text-primary-gray">{imovel.regiao}</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-primary-gray mb-2">{imovel.titulo}</h3>
                      <p className="text-sm text-gray-500 mb-4">{imovel.capacidade} hóspedes · {imovel.num_quartos} quartos</p>
                      <div className="text-sm text-primary-teal font-medium flex items-center gap-1">
                        <Home className="h-4 w-4" /> Ver detalhes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* --- PARCEIROS EM DESTAQUE COM BANNER VERDE TEAL --- */}
        {pageData.parceiros_destaque && pageData.parceiros_destaque.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              {/* Banner de Descontos - Cor Teal Oficial */}
              <FadeInSection>
                <div className="bg-[#459894] rounded-xl shadow-xl p-8 mb-12 text-white flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto text-center md:text-left">
                  <div className="bg-white/10 p-4 rounded-full">
                    <Ticket className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Descontos Exclusivos para Hóspedes ALT!</h2>
                    <p className="text-teal-50">Apresente seu voucher de hospedagem em qualquer parceiro ALT e aproveite descontos especiais em restaurantes, passeios, lojas e muito mais.</p>
                  </div>
                </div>
              </FadeInSection>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pageData.parceiros_destaque.map((parceiro, idx) => (
                  <FadeInSection key={parceiro.id} delay={idx * 100}>
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group border border-gray-100" onClick={() => navigate(`/parceiro/${parceiro.id}`)}>
                      <div className="relative h-56 overflow-hidden">
                        <img src={parceiro.fotos[0] || 'https://via.placeholder.com/400x300'} alt={parceiro.nome_empresa} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <Badge className="absolute top-4 right-4 bg-[#459894] hover:bg-[#3d8682] text-white shadow-sm">{parceiro.categoria}</Badge>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{parceiro.nome_empresa}</h3>
                        <p className="text-gray-600 mb-6 text-sm line-clamp-3 flex-1">{parceiro.descricao}</p>

                        {/* BOX DO DESCONTO ESTILIZADA */}
                        {parceiro.desconto_alt ? (
                          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 flex items-center gap-3 mb-6">
                            <Ticket className="h-5 w-5 text-[#459894]" />
                            <span className="text-sm font-medium text-teal-900">{parceiro.desconto_alt}</span>
                          </div>
                        ) : (
                          <div className="mb-6 h-[46px]"></div> // Espaço vazio
                        )}

                        <Button className="w-full bg-[#459894] hover:bg-[#3d8682] text-white font-medium h-10 rounded-md">Ver Detalhes</Button>
                      </div>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* --- EXPLORE ILHABELA --- */}
        <ExploreIlhabelaSection />

        {/* --- CTA: SEJA MEMBRO --- */}
        <CTASection navigate={navigate} />

        {/* --- SOBRE NÓS (MOSAICO DE FOTOS) --- */}
        <SobreSection />

        {/* --- TELEFONES ÚTEIS --- */}
        <TelefonesUteisSection />

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
          <Route path="/meus-imoveis" element={<ProtectedRoute allowedRoles={['membro', 'admin']}><MeusImoveisPage /></ProtectedRoute>} />
          <Route path="/meu-perfil" element={<ProtectedRoute allowedRoles={['parceiro', 'admin']}><MeuPerfilPage /></ProtectedRoute>} />
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