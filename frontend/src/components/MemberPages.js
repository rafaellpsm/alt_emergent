import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import PhotoUpload from './PhotoUpload';
import { VideoUpload } from './VideoUpload';
import PageHeader from './PageHeader';
import { Checkbox } from './ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// All Properties View Page (PUBLIC)
export const TodosImoveisPage = () => {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    regiao: '',
    preco_max: '',
    num_quartos: '',
    possui_piscina: false,
    permite_pets: false
  });

  // Função que busca os imóveis, agora com base nos filtros
  const fetchTodosImoveis = async () => {
    setLoading(true);
    try {
      // Cria um objeto de parâmetros apenas com os filtros preenchidos
      const params = {};
      for (const key in filtros) {
        if (filtros[key]) { // Adiciona apenas valores que não são vazios ou falsos
          params[key] = filtros[key];
        }
      }
      const response = await axios.get(`${API}/imoveis`, { params });
      setImoveis(response.data);
    } catch (error) {
      toast({
        title: "Erro ao buscar imóveis",
        description: "Não foi possível carregar os imóveis com os filtros selecionados.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Busca inicial de imóveis quando a página carrega
  useEffect(() => {
    fetchTodosImoveis();
  }, []);

  const handleFilterChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      tipo: '', regiao: '', preco_max: '', num_quartos: '',
      possui_piscina: false, permite_pets: false
    };
    setFiltros(clearedFilters);
    // A busca será refeita no próximo ciclo de renderização por causa do useEffect abaixo
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Todos os Imóveis" showBackButton={false} />
        <Card className="card-custom mb-8">
          <CardHeader>
            <CardTitle className="text-primary-gray">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="form-label">Tipo</Label>
                <Select value={filtros.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="pousada">Pousada</SelectItem>
                    <SelectItem value="chale">Chalé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="form-label">Região</Label>
                <Select value={filtros.regiao} onValueChange={(value) => handleFilterChange('regiao', value)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="centro">Centro</SelectItem>
                    <SelectItem value="perequê">Perequê</SelectItem>
                    <SelectItem value="vila">Vila</SelectItem>
                    <SelectItem value="barra-velha">Barra Velha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="form-label">Preço Máximo/dia</Label>
                <Input type="number" className="form-input" placeholder="Ex: 500" value={filtros.preco_max} onChange={(e) => handleFilterChange('preco_max', e.target.value)} />
              </div>
              <div>
                <Label className="form-label">Nº de Quartos (mín.)</Label>
                <Input type="number" className="form-input" placeholder="Ex: 2" value={filtros.num_quartos} onChange={(e) => handleFilterChange('num_quartos', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox id="possui_piscina" checked={filtros.possui_piscina} onCheckedChange={(checked) => handleFilterChange('possui_piscina', checked)} />
                <Label htmlFor="possui_piscina">Com Piscina</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="permite_pets" checked={filtros.permite_pets} onCheckedChange={(checked) => handleFilterChange('permite_pets', checked)} />
                <Label htmlFor="permite_pets">Aceita Pets</Label>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Button onClick={fetchTodosImoveis} className="w-full btn-primary">Aplicar Filtros</Button>
              <Button onClick={handleClearFilters} className="w-full" variant="outline">Limpar Filtros</Button>
            </div>
          </CardContent>
        </Card>
        {loading ? (
          <div className="flex justify-center items-center py-12"><div className="spinner"></div></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.length === 0 ? (
              <Card className="card-custom col-span-full">
                <CardContent className="py-12 text-center text-gray-500">Nenhum imóvel encontrado com estes filtros.</CardContent>
              </Card>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id} className="card-custom hover-lift cursor-pointer" onClick={() => navigate(`/imovel/${imovel.id}`)}>
                  {imovel.fotos && imovel.fotos.length > 0 ? (
                    <div className="property-image"><img src={imovel.fotos[0]} alt={imovel.titulo} className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="property-image bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><span className="text-gray-500">Sem foto</span></div>
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
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{imovel.descricao}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs text-gray-500"><span>{imovel.num_quartos}q • {imovel.num_banheiros}b • {imovel.capacidade}p</span></div>
                      <div className="text-lg font-bold text-primary-teal">R$ {imovel.preco_diaria}/dia</div>
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


// Partner Profile Management Page
export const MeuPerfilPage = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome_empresa: '',
    descricao: '',
    categoria: '',
    telefone: '',
    endereco: '',
    website: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    horario_funcionamento: '',
    servicos_oferecidos: '',
    fotos: [],
    video_url: ''
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const response = await axios.get(`${API}/meu-perfil-parceiro`);
      setPerfil(response.data);
      if (response.data) {
        setFormData({
          nome_empresa: response.data.nome_empresa || '',
          descricao: response.data.descricao || '',
          categoria: response.data.categoria || '',
          telefone: response.data.telefone || '',
          endereco: response.data.endereco || '',
          website: response.data.website || '',
          instagram: response.data.instagram || '',
          facebook: response.data.facebook || '',
          whatsapp: response.data.whatsapp || '',
          horario_funcionamento: response.data.horario_funcionamento || '',
          servicos_oferecidos: response.data.servicos_oferecidos || '',
          fotos: response.data.fotos || [],
          video_url: response.data.video_url || ''
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast({
          title: "Erro ao carregar perfil",
          description: "Tente recarregar a página.",
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (perfil) {
        await axios.put(`${API}/perfil-parceiro/${perfil.id}`, formData);
        toast({ title: "Perfil atualizado com sucesso!" });
      } else {
        await axios.post(`${API}/perfil-parceiro`, formData);
        toast({ title: "Perfil criado com sucesso!" });
      }
      setEditing(false);
      fetchPerfil();
    } catch (error) {
      let errorMessage = "Tente novamente mais tarde.";
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail.map(err => `${err.loc[1]}: ${err.msg}`).join('; ');
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }
      }
      toast({
        title: "Erro ao salvar perfil",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Meu Perfil de Parceiro">
          {perfil && !editing && (
            <Button onClick={() => setEditing(true)} className="btn-primary">
              Editar Perfil
            </Button>
          )}
        </PageHeader>
        {loading ? (
          <div className="flex justify-center items-center py-12"><div className="spinner"></div></div>
        ) : (!perfil && !editing) ? (
          <Card className="card-custom max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-primary-gray">Criar Perfil de Parceiro</CardTitle>
              <CardDescription>
                Você ainda não tem um perfil de parceiro. Crie um para começar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setEditing(true)} className="btn-primary">
                Criar Perfil
              </Button>
            </CardContent>
          </Card>
        ) : (editing) ? (
          <Card className="card-custom max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-primary-gray">{perfil ? 'Editar Perfil' : 'Criar Perfil de Parceiro'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_empresa" className="form-label">Nome da Empresa *</Label>
                    <Input id="nome_empresa" className="form-input" value={formData.nome_empresa} onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="categoria" className="form-label">Categoria *</Label>
                    <Input id="categoria" className="form-input" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="descricao" className="form-label">Descrição *</Label>
                  <Textarea id="descricao" className="form-input" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="form-label">Telefone *</Label>
                    <Input id="telefone" className="form-input" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="endereco" className="form-label">Endereço</Label>
                    <Input id="endereco" className="form-input" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website" className="form-label">Website</Label>
                    <Input id="website" type="url" className="form-input" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="form-label">Instagram</Label>
                    <Input id="instagram" type="url" className="form-input" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook" className="form-label">Facebook</Label>
                    <Input id="facebook" type="url" className="form-input" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="form-label">WhatsApp</Label>
                    <Input id="whatsapp" className="form-input" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horario_funcionamento" className="form-label">Horário de Funcionamento</Label>
                    <Input id="horario_funcionamento" className="form-input" value={formData.horario_funcionamento} onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="servicos_oferecidos" className="form-label">Serviços Oferecidos</Label>
                    <Input id="servicos_oferecidos" className="form-input" value={formData.servicos_oferecidos} onChange={(e) => setFormData({ ...formData, servicos_oferecidos: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                  <div>
                    <PhotoUpload
                      photos={formData.fotos}
                      onPhotosChange={(newPhotos) => setFormData({ ...formData, fotos: newPhotos })}
                      maxPhotos={10}
                      label="Fotos do Negócio"
                    />
                  </div>
                  <div>
                    <VideoUpload
                      videoUrl={formData.video_url}
                      onVideoChange={(newUrl) => setFormData({ ...formData, video_url: newUrl })}
                      label="Vídeo de Apresentação"
                    />
                  </div>
                </div>
                <div className="flex space-x-4 pt-6 border-t">
                  <Button type="submit" className="flex-1 btn-primary">
                    {perfil ? 'Atualizar' : 'Criar'} Perfil
                  </Button>
                  {editing && (
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-custom max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-primary-gray">{perfil.nome_empresa}</CardTitle>
              <CardDescription>
                <Badge className="badge-teal">{perfil.categoria}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {perfil.fotos && perfil.fotos.length > 0 && (
                    <div className="mb-6">
                      <img src={perfil.fotos[0]} alt={perfil.nome_empresa} className="rounded-lg shadow-md" />
                    </div>
                  )}
                  <h3 className="font-semibold mb-2 text-primary-gray">Sobre</h3>
                  <p className="text-gray-700 whitespace-pre-line">{perfil.descricao}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary-gray">Contato</h3>
                    <p className="text-gray-700">{perfil.telefone}</p>
                    {perfil.whatsapp && <p className="text-gray-700">WhatsApp: {perfil.whatsapp}</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-gray">Endereço</h3>
                    <p className="text-gray-700">{perfil.endereco}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-gray">Horário de Funcionamento</h3>
                    <p className="text-gray-700">{perfil.horario_funcionamento}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-gray">Serviços</h3>
                    <p className="text-gray-700">{perfil.servicos_oferecidos}</p>
                  </div>
                  <div className="flex space-x-2 pt-4 border-t">
                    {perfil.website && <Button asChild variant="outline"><a href={perfil.website} target="_blank" rel="noopener noreferrer">Website</a></Button>}
                    {perfil.instagram && <Button asChild variant="outline"><a href={perfil.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></Button>}
                    {perfil.facebook && <Button asChild variant="outline"><a href={perfil.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Partners Page (PUBLIC)
export const ParceirosPage = () => {
  const navigate = useNavigate();
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
  const parceirsFiltrados = categoriaFiltro ? parceiros.filter(p => p.categoria === categoriaFiltro) : parceiros;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Nossos Parceiros" showBackButton={false} />
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
                <Card
                  key={parceiro.id}
                  className="card-custom hover-lift cursor-pointer"
                  onClick={() => navigate(`/parceiro/${parceiro.id}`)}
                >
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
                    {parceiro.servicos_oferecidos && (
                      <div className="mb-4">
                        <span className="font-medium text-sm">Serviços:</span>
                        <p className="text-gray-600 text-xs mt-1">{parceiro.servicos_oferecidos}</p>
                      </div>
                    )}
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
    link_booking: '',
    link_airbnb: '',
    fotos: [],
    video_url: ''
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
        toast({ title: "Imóvel atualizado com sucesso!" });
      } else {
        await axios.post(`${API}/imoveis`, formData);
        toast({ title: "Imóvel cadastrado com sucesso!", description: "O seu imóvel será analisado pelo administrador." });
      }
      setShowForm(false);
      setEditingImovel(null);
      resetForm();
      fetchImoveis();
    } catch (error) {
      console.error('Error creating/updating property:', error);
      let errorMessage = "Tente novamente.";
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail.map(err => `${err.loc[1]}: ${err.msg}`).join('; ');
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }
      }
      toast({ title: "Erro ao salvar imóvel", description: errorMessage, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '', descricao: '', tipo: '', regiao: '', endereco_completo: '',
      preco_diaria: '', preco_semanal: '', preco_mensal: '', num_quartos: 1,
      num_banheiros: 1, capacidade: 2, area_m2: '', possui_piscina: false,
      possui_churrasqueira: false, possui_wifi: true, permite_pets: false,
      tem_vista_mar: false, tem_ar_condicionado: false, link_booking: '',
      link_airbnb: '', fotos: [], video_url: ''
    });
  };

  const handleEdit = (imovel) => {
    setEditingImovel(imovel);
    setFormData({
      titulo: imovel.titulo || '',
      descricao: imovel.descricao || '',
      tipo: imovel.tipo || '',
      regiao: imovel.regiao || '',
      endereco_completo: imovel.endereco_completo || '',
      preco_diaria: imovel.preco_diaria || '',
      preco_semanal: imovel.preco_semanal || '',
      preco_mensal: imovel.preco_mensal || '',
      num_quartos: imovel.num_quartos || 1,
      num_banheiros: imovel.num_banheiros || 1,
      capacidade: imovel.capacidade || 2,
      area_m2: imovel.area_m2 || '',
      possui_piscina: imovel.possui_piscina || false,
      possui_churrasqueira: imovel.possui_churrasqueira || false,
      possui_wifi: imovel.possui_wifi !== undefined ? imovel.possui_wifi : true,
      permite_pets: imovel.permite_pets || false,
      tem_vista_mar: imovel.tem_vista_mar || false,
      tem_ar_condicionado: imovel.tem_ar_condicionado || false,
      link_booking: imovel.link_booking || '',
      link_airbnb: imovel.link_airbnb || '',
      fotos: Array.isArray(imovel.fotos) ? imovel.fotos : [],
      video_url: imovel.video_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este imóvel?')) {
      try {
        await axios.delete(`${API}/imoveis/${id}`);
        toast({ title: "Imóvel removido com sucesso!" });
        fetchImoveis();
      } catch (error) {
        toast({ title: "Erro ao remover imóvel", description: "Tente novamente.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Meus Imóveis">
          {!showForm && (
            <Button
              className="btn-primary"
              onClick={() => {
                setEditingImovel(null);
                resetForm();
                setShowForm(true);
              }}
            >
              Cadastrar Novo Imóvel
            </Button>
          )}
        </PageHeader>

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
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                      placeholder="Casa com vista para o mar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo" className="form-label">Tipo de Imóvel *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="pousada">Pousada</SelectItem>
                        <SelectItem value="chale">Chalé</SelectItem>
                        <SelectItem value="suite">Suíte</SelectItem>
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
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
                      onValueChange={(value) => setFormData({ ...formData, regiao: value })}
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

                </div>
                <div>
                  <Label htmlFor="endereco_completo" className="form-label">Endereço Completo *</Label>
                  <Textarea
                    id="endereco_completo"
                    className="form-input"
                    value={formData.endereco_completo}
                    onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                    required
                    placeholder="Rua, número, bairro, CEP..."
                  />
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
                      onChange={(e) => setFormData({ ...formData, num_quartos: parseInt(e.target.value) || 0 })}
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
                      onChange={(e) => setFormData({ ...formData, num_banheiros: parseInt(e.target.value) || 1 })}
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
                      onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 1 })}
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
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="rounded focus-teal"
                        />
                        <Label htmlFor={key} className="form-label mb-0">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="link_booking" className="form-label">Link Booking.com</Label>
                    <Input
                      id="link_booking"
                      type="url"
                      className="form-input"
                      value={formData.link_booking}
                      onChange={(e) => setFormData({ ...formData, link_booking: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, link_airbnb: e.target.value })}
                      placeholder="https://airbnb.com/..."
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <VideoUpload
                    videoUrl={formData.video_url}
                    onVideoChange={(newUrl) => setFormData({ ...formData, video_url: newUrl })}
                    label="Vídeo do Imóvel"
                  />
                </div>
                <div className="mt-6">
                  <PhotoUpload
                    photos={formData.fotos}
                    onPhotosChange={(newPhotos) => setFormData({ ...formData, fotos: newPhotos })}
                    maxPhotos={20}
                    label="Fotos do Imóvel"
                  />
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📸 Dicas para Fotos Incríveis</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• <strong>Proporção recomendada:</strong> 16:9 ou 4:3 (paisagem horizontal)</p>
                      <p>• <strong>Primeira foto:</strong> Será a foto principal do imóvel</p>
                      <p>• <strong>Sequência sugerida:</strong> Fachada → Sala → Quartos → Cozinha → Banheiros → Área externa</p>
                      <p>• <strong>Qualidade:</strong> Use boa iluminação natural e mantenha o ambiente limpo</p>
                    </div>
                  </div>
                </div>
                {formData.fotos.length > 0 && (
                  <div>
                    <Label className="form-label">Fotos para Inserir na Descrição</Label>
                    <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                      {formData.fotos.map((foto, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer border rounded overflow-hidden hover:ring-2 hover:ring-primary-teal"
                          onClick={() => {
                            const fotoUrl = `![Foto ${index + 1}](${foto})`;
                            const newDescricao = formData.descricao + `\n\n${fotoUrl}\n`;
                            setFormData({ ...formData, descricao: newDescricao });
                          }}
                        >
                          <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-16 object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100">Clique para inserir</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Clique em uma foto acima para inseri-la na descrição
                    </p>
                  </div>
                )}
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

        {!showForm && loading && (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        )}

        {!showForm && !loading && (
          <div className="grid lg:grid-cols-2 gap-6">
            {imoveis.length === 0 ? (
              <Card className="card-custom col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">Você ainda não cadastrou nenhum imóvel.</p>
                  <Button
                    className="btn-primary"
                    onClick={() => {
                      setEditingImovel(null);
                      resetForm();
                      setShowForm(true);
                    }}
                  >
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