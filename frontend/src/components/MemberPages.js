import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component
const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.log('Error fetching user info');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
  };

  return (
    <header className="header-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
          <span className="text-sm opacity-90 hidden md:block">Associação de Locação por Temporada</span>
        </div>
        
        {user && (
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
        )}
      </div>
    </header>
  );
};

// Navigation for logged-in users
const Navigation = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        console.log('Navigation: User not logged in');
      }
    };
    fetchUser();
  }, []);
  
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

// All Properties View Page (for members to see all properties)  
export const TodosImoveisPage = () => {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    regiao: '',
    preco_max: '',
    possui_piscina: false,
    permite_pets: false
  });

  useEffect(() => {
    fetchTodosImoveis();
  }, []);

  const fetchTodosImoveis = async () => {
    try {
      const response = await axios.get(`${API}/imoveis/todos`);
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

  const aplicarFiltros = () => {
    // Filter logic can be implemented later
    fetchTodosImoveis();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-primary-gray mb-8">Todos os Imóveis</h1>
        
        {/* Filter Section */}
        <Card className="card-custom mb-8">
          <CardHeader>
            <CardTitle className="text-primary-gray">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="form-label">Tipo</Label>
                <Select value={filtros.tipo} onValueChange={(value) => setFiltros({...filtros, tipo: value})}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="pousada">Pousada</SelectItem>
                    <SelectItem value="chale">Chalé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="form-label">Região</Label>
                <Select value={filtros.regiao} onValueChange={(value) => setFiltros({...filtros, regiao: value})}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Todas as regiões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="centro">Centro</SelectItem>
                    <SelectItem value="perequê">Perequê</SelectItem>
                    <SelectItem value="vila">Vila</SelectItem>
                    <SelectItem value="barra-velha">Barra Velha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="form-label">Preço máximo/dia</Label>
                <Input
                  type="number"
                  className="form-input"
                  placeholder="Ex: 500"
                  value={filtros.preco_max}
                  onChange={(e) => setFiltros({...filtros, preco_max: e.target.value})}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={aplicarFiltros} className="w-full btn-primary">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.length === 0 ? (
              <Card className="card-custom col-span-full">
                <CardContent className="py-12 text-center text-gray-500">
                  Nenhum imóvel encontrado
                </CardContent>
              </Card>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id} className="card-custom hover-lift">
                  {imovel.fotos && imovel.fotos.length > 0 ? (
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
                  
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-primary-gray">{imovel.titulo}</CardTitle>
                        <CardDescription>{imovel.tipo} • {imovel.regiao}</CardDescription>
                      </div>
                      <Badge className="badge-beige">{imovel.tipo}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
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
                    
                    {/* Property features */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {imovel.possui_piscina && <Badge className="badge-teal text-xs">Piscina</Badge>}
                      {imovel.possui_wifi && <Badge className="badge-teal text-xs">Wi-Fi</Badge>}
                      {imovel.permite_pets && <Badge className="badge-teal text-xs">Pet-Friendly</Badge>}
                      {imovel.tem_vista_mar && <Badge className="badge-teal text-xs">Vista Mar</Badge>}
                    </div>
                    
                    {/* Booking links */}
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

// Partners Page (for all users to see partners)
export const ParceirosPage = () => {
  const [parceiros, setParceiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  useEffect(() => {
    fetchParceiros();
  }, []);

  const fetchParceiros = async () => {
    try {
      const response = await axios.get(`${API}/parceiros`);
      setParceiros(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar parceiros",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const categoriasDisponiveis = [...new Set(parceiros.map(p => p.categoria))];

  const parceirsFiltrados = categoriaFiltro 
    ? parceiros.filter(p => p.categoria === categoriaFiltro)
    : parceiros;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-primary-gray mb-8">Nossos Parceiros</h1>
        
        {/* Category Filter */}
        {categoriasDisponiveis.length > 1 && (
          <Card className="card-custom mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Label className="form-label">Filtrar por categoria:</Label>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger className="form-input w-48">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categoriasDisponiveis.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parceirsFiltrados.length === 0 ? (
              <Card className="card-custom col-span-full">
                <CardContent className="py-12 text-center text-gray-500">
                  Nenhum parceiro encontrado
                </CardContent>
              </Card>
            ) : (
              parceirsFiltrados.map((parceiro) => (
                <Card key={parceiro.id} className="card-custom hover-lift">
                  {parceiro.fotos && parceiro.fotos.length > 0 && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg mb-4 overflow-hidden">
                      <img 
                        src={parceiro.fotos[0]} 
                        alt={parceiro.nome_empresa}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-primary-gray">{parceiro.nome_empresa}</CardTitle>
                      <Badge className="badge-beige">{parceiro.categoria}</Badge>
                    </div>
                    {parceiro.nome_responsavel && (
                      <CardDescription>Por {parceiro.nome_responsavel}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                      {parceiro.descricao}
                    </p>
                    
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4 text-sm">
                      {parceiro.telefone && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Telefone:</span>
                          <span className="text-gray-600">{parceiro.telefone}</span>
                        </div>
                      )}
                      {parceiro.email && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Email:</span>
                          <span className="text-gray-600">{parceiro.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Services offered */}
                    {parceiro.servicos_oferecidos && (
                      <div className="mb-4">
                        <span className="font-medium text-sm">Serviços:</span>
                        <p className="text-gray-600 text-xs mt-1">{parceiro.servicos_oferecidos}</p>
                      </div>
                    )}
                    
                    {/* Links */}
                    <div className="flex space-x-2">
                      {parceiro.website && (
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <a href={parceiro.website} target="_blank" rel="noopener noreferrer">
                            Site
                          </a>
                        </Button>
                      )}
                      {parceiro.instagram && (
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <a href={parceiro.instagram} target="_blank" rel="noopener noreferrer">
                            Instagram
                          </a>
                        </Button>
                      )}
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

// Member Properties Management Page
export const MeusImoveisPage = () => {
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
          <h1 className="text-3xl font-bold text-primary-gray">Meus Imóveis</h1>
          <Button 
            className="btn-primary"
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
          <Card className="card-custom mb-8">
            <CardHeader>
              <CardTitle className="text-primary-gray">
                {editingImovel ? 'Editar Imóvel' : 'Novo Imóvel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titulo" className="form-label">Título do Imóvel *</Label>
                    <Input
                      id="titulo"
                      className="form-input"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      required
                      placeholder="Casa com vista para o mar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo" className="form-label">Tipo de Imóvel *</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value) => setFormData({...formData, tipo: value})}
                    >
                      <SelectTrigger className="form-input">
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
                  <Label htmlFor="descricao" className="form-label">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    className="form-input"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    required
                    rows={4}
                    placeholder="Descreva as características e diferenciais do seu imóvel..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regiao" className="form-label">Região *</Label>
                    <Select 
                      value={formData.regiao} 
                      onValueChange={(value) => setFormData({...formData, regiao: value})}
                    >
                      <SelectTrigger className="form-input">
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
                    <Label htmlFor="area_m2" className="form-label">Área (m²)</Label>
                    <Input
                      id="area_m2"
                      type="number"
                      className="form-input"
                      value={formData.area_m2}
                      onChange={(e) => setFormData({...formData, area_m2: e.target.value})}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endereco_completo" className="form-label">Endereço Completo *</Label>
                  <Textarea
                    id="endereco_completo"
                    className="form-input"
                    value={formData.endereco_completo}
                    onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
                    required
                    placeholder="Rua, número, bairro, CEP..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="preco_diaria" className="form-label">Preço por Dia (R$) *</Label>
                    <Input
                      id="preco_diaria"
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.preco_diaria}
                      onChange={(e) => setFormData({...formData, preco_diaria: e.target.value})}
                      required
                      placeholder="250.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preco_semanal" className="form-label">Preço por Semana (R$)</Label>
                    <Input
                      id="preco_semanal"
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.preco_semanal}
                      onChange={(e) => setFormData({...formData, preco_semanal: e.target.value})}
                      placeholder="1500.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preco_mensal" className="form-label">Preço por Mês (R$)</Label>
                    <Input
                      id="preco_mensal"
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.preco_mensal}
                      onChange={(e) => setFormData({...formData, preco_mensal: e.target.value})}
                      placeholder="5000.00"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="num_quartos" className="form-label">Quartos *</Label>
                    <Input
                      id="num_quartos"
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.num_quartos}
                      onChange={(e) => setFormData({...formData, num_quartos: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="num_banheiros" className="form-label">Banheiros *</Label>
                    <Input
                      id="num_banheiros"
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.num_banheiros}
                      onChange={(e) => setFormData({...formData, num_banheiros: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="capacidade" className="form-label">Capacidade (pessoas) *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({...formData, capacidade: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="form-label">Comodidades</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { key: 'possui_piscina', label: 'Piscina' },
                      { key: 'possui_churrasqueira', label: 'Churrasqueira' },
                      { key: 'possui_wifi', label: 'Wi-Fi' },
                      { key: 'permite_pets', label: 'Aceita Pets' },
                      { key: 'tem_vista_mar', label: 'Vista para o Mar' },
                      { key: 'tem_ar_condicionado', label: 'Ar Condicionado' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={key}
                          checked={formData[key]}
                          onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                          className="rounded focus-teal"
                        />
                        <Label htmlFor={key} className="form-label mb-0">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="video_url" className="form-label">Link do Vídeo</Label>
                    <Input
                      id="video_url"
                      type="url"
                      className="form-input"
                      value={formData.video_url}
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_booking" className="form-label">Link Booking</Label>
                    <Input
                      id="link_booking"
                      type="url"
                      className="form-input"
                      value={formData.link_booking}
                      onChange={(e) => setFormData({...formData, link_booking: e.target.value})}
                      placeholder="https://booking.com/..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_airbnb" className="form-label">Link Airbnb</Label>
                    <Input
                      id="link_airbnb"
                      type="url"
                      className="form-input"
                      value={formData.link_airbnb}
                      onChange={(e) => setFormData({...formData, link_airbnb: e.target.value})}
                      placeholder="https://airbnb.com/rooms/..."
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1 btn-primary">
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
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {imoveis.length === 0 ? (
              <Card className="card-custom col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">Você ainda não cadastrou nenhum imóvel.</p>
                  <Button className="btn-primary" onClick={() => setShowForm(true)}>
                    Cadastrar Primeiro Imóvel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id} className="card-custom">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-primary-gray">
                          {imovel.titulo}
                          {imovel.destaque && <Badge className="badge-teal">Destaque</Badge>}
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
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
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
                      <div className="text-lg font-bold text-primary-teal">
                        R$ {imovel.preco_diaria}/dia
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(imovel.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* Links for booking platforms */}
                    {(imovel.link_booking || imovel.link_airbnb) && (
                      <div className="flex space-x-2 mt-4">
                        {imovel.link_booking && (
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">
                              Booking
                            </a>
                          </Button>
                        )}
                        {imovel.link_airbnb && (
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">
                              Airbnb
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