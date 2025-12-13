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
import { PhotoUpload } from './PhotoUpload';
import { VideoUpload } from './VideoUpload';
import PageHeader from './PageHeader';
import { Checkbox } from './ui/checkbox';
import { Trash2, Edit, Eye, MapPin, Bed, Bath, Users, TicketPercent, Phone, Globe, Instagram, Facebook } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TodosImoveisPage = () => {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    regiao: '',
    num_quartos: '',
    possui_piscina: false,
    permite_pets: false
  });

  const fetchTodosImoveis = async () => {
    setLoading(true);
    try {
      const params = {};
      for (const key in filtros) {
        if (filtros[key]) {
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

  useEffect(() => {
    fetchTodosImoveis();
  }, []);

  const handleFilterChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      tipo: '', regiao: '', num_quartos: '',
      possui_piscina: false, permite_pets: false
    };
    setFiltros(clearedFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <PageHeader title="Todos os Imóveis" showBackButton={false} />

        <Card className="card-custom mb-8 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-primary-gray">Filtros de Pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="mb-1 block text-xs uppercase text-gray-500 font-semibold">Tipo</Label>
                <Select value={filtros.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="casa">Casas</SelectItem>
                    <SelectItem value="pousada">Pousadas</SelectItem>
                    <SelectItem value="suite">Suítes</SelectItem>
                    <SelectItem value="chale">Chalés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs uppercase text-gray-500 font-semibold">Região</Label>
                <Select value={filtros.regiao} onValueChange={(value) => handleFilterChange('regiao', value)}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Todas" /></SelectTrigger>
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
                <Label className="mb-1 block text-xs uppercase text-gray-500 font-semibold">Quartos (mín.)</Label>
                <Input type="number" className="bg-white" placeholder="Ex: 2" value={filtros.num_quartos} onChange={(e) => handleFilterChange('num_quartos', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border">
                <Checkbox id="possui_piscina" checked={filtros.possui_piscina} onCheckedChange={(checked) => handleFilterChange('possui_piscina', checked)} />
                <Label htmlFor="possui_piscina" className="cursor-pointer mb-0">Com Piscina</Label>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border">
                <Checkbox id="permite_pets" checked={filtros.permite_pets} onCheckedChange={(checked) => handleFilterChange('permite_pets', checked)} />
                <Label htmlFor="permite_pets" className="cursor-pointer mb-0">Aceita Pets</Label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={fetchTodosImoveis} className="flex-1 btn-primary">Aplicar Filtros</Button>
              <Button onClick={handleClearFilters} className="flex-1 sm:flex-none" variant="outline">Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                Nenhum imóvel encontrado com estes filtros.
              </div>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id} className="card-custom hover-lift cursor-pointer overflow-hidden group" onClick={() => navigate(`/imovel/${imovel.id}`)}>
                  <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                    {imovel.fotos && imovel.fotos.length > 0 ? (
                      <img src={imovel.fotos[0]} alt={imovel.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">Sem foto</div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-primary-gray backdrop-blur-sm shadow-sm">{imovel.tipo}</Badge>
                    {imovel.destaque && <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900">Destaque</Badge>}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs text-primary-teal font-semibold uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {imovel.regiao}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-3 line-clamp-1">{imovel.titulo}</h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1"><Bed className="h-4 w-4" /> {imovel.num_quartos}</div>
                      <div className="flex items-center gap-1"><Bath className="h-4 w-4" /> {imovel.num_banheiros}</div>
                      <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {imovel.capacidade}</div>
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
    video_url: '',
    desconto_alt: ''
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
          video_url: response.data.video_url || '',
          desconto_alt: response.data.desconto_alt || ''
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast({ title: "Erro ao carregar perfil", variant: "destructive" });
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
      toast({ title: "Erro ao salvar perfil", description: "Verifique os dados.", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Meu Negócio">
          {perfil && !editing && (
            <Button onClick={() => setEditing(true)} className="btn-primary gap-2">
              <Edit className="h-4 w-4" /> Editar Informações
            </Button>
          )}
        </PageHeader>

        {(editing || !perfil) ? (
          <Card className="card-custom max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-primary-gray">{perfil ? 'Editar Perfil' : 'Criar Perfil de Parceiro'}</CardTitle>
              <CardDescription>Mantenha as informações do seu negócio sempre atualizadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input id="nome_empresa" value={formData.nome_empresa} onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input id="categoria" placeholder="Ex: Restaurante, Passeios..." value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} required />
                  </div>
                </div>

                <div className="bg-teal-50 p-5 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TicketPercent className="h-5 w-5 text-primary-teal" />
                    <Label className="text-primary-teal font-bold text-base">Desconto Exclusivo para Hóspedes ALT</Label>
                  </div>
                  <Input
                    placeholder="Ex: 15% de desconto em todo o cardápio ou Drink de cortesia"
                    value={formData.desconto_alt}
                    onChange={(e) => setFormData({ ...formData, desconto_alt: e.target.value })}
                    className="bg-white border-teal-200 focus:border-teal-500"
                  />
                  <p className="text-xs text-teal-700 mt-2">✨ Este benefício aparecerá em destaque no cartão do seu negócio na página inicial.</p>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea id="descricao" rows={4} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Telefone *</Label><Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} required /></div>
                  <div><Label>WhatsApp</Label><Input value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} /></div>
                </div>

                <div><Label>Endereço</Label><Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} /></div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div><Label>Instagram</Label><Input value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@seu_insta" /></div>
                  <div><Label>Facebook</Label><Input value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} /></div>
                  <div><Label>Website</Label><Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} /></div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Horário de Funcionamento</Label><Input value={formData.horario_funcionamento} onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })} /></div>
                  <div><Label>Serviços Oferecidos</Label><Input value={formData.servicos_oferecidos} onChange={(e) => setFormData({ ...formData, servicos_oferecidos: e.target.value })} /></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                  <PhotoUpload photos={formData.fotos} onPhotosChange={(f) => setFormData({ ...formData, fotos: f })} maxPhotos={10} label="Fotos do Negócio" />
                  <VideoUpload videoUrl={formData.video_url} onVideoChange={(v) => setFormData({ ...formData, video_url: v })} label="Vídeo de Apresentação" />
                </div>

                <div className="flex space-x-4 pt-6 border-t">
                  <Button type="submit" className="flex-1 btn-primary py-6 text-lg">{perfil ? 'Salvar Alterações' : 'Criar Perfil'}</Button>
                  {editing && <Button type="button" variant="outline" className="flex-1 py-6" onClick={() => setEditing(false)}>Cancelar</Button>}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-custom max-w-4xl mx-auto overflow-hidden">
            <div className="relative h-64 bg-gray-200">
              {perfil.fotos && perfil.fotos.length > 0 ? (
                <img src={perfil.fotos[0]} alt={perfil.nome_empresa} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sem capa</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                <h2 className="text-3xl font-bold text-white">{perfil.nome_empresa}</h2>
                <Badge className="badge-teal mt-2">{perfil.categoria}</Badge>
              </div>
            </div>

            <CardContent className="p-8">
              {perfil.desconto_alt && (
                <div className="mb-8 bg-teal-50 border border-teal-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                  <div className="bg-white p-3 rounded-full shadow-md text-primary-teal">
                    <TicketPercent className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-teal-800 uppercase tracking-wide mb-1">Benefício Exclusivo Hóspede ALT</p>
                    <p className="text-xl text-gray-800 font-bold">{perfil.desconto_alt}</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary-gray mb-2">Sobre</h3>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">{perfil.descricao}</p>
                  </div>
                  {perfil.fotos.length > 1 && (
                    <div>
                      <h3 className="text-lg font-bold text-primary-gray mb-4">Galeria</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {perfil.fotos.slice(1).map((foto, i) => (
                          <img key={i} src={foto} alt="" className="rounded-lg h-20 w-full object-cover cursor-pointer hover:opacity-80" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="h-5 w-5 text-primary-teal" />
                      <span>{perfil.telefone}</span>
                    </div>
                    {perfil.whatsapp && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <span className="font-bold text-green-600">WhatsApp:</span>
                        <span>{perfil.whatsapp}</span>
                      </div>
                    )}
                    {perfil.endereco && (
                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin className="h-5 w-5 text-primary-teal shrink-0" />
                        <span>{perfil.endereco}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {perfil.instagram && <Button size="icon" variant="outline" asChild><a href={perfil.instagram} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" /></a></Button>}
                      {perfil.facebook && <Button size="icon" variant="outline" asChild><a href={perfil.facebook} target="_blank" rel="noreferrer"><Facebook className="h-4 w-4" /></a></Button>}
                      {perfil.website && <Button size="icon" variant="outline" asChild><a href={perfil.website} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" /></a></Button>}
                    </div>
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
      toast({ title: "Erro ao carregar parceiros", variant: "destructive" });
    }
    setLoading(false);
  };

  const categoriasDisponiveis = [...new Set(parceiros.map(p => p.categoria))];
  const parceirsFiltrados = categoriaFiltro ? parceiros.filter(p => p.categoria === categoriaFiltro) : parceiros;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <PageHeader title="Nossos Parceiros" showBackButton={false} />

        {categoriasDisponiveis.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
            <Button variant={categoriaFiltro === '' ? 'default' : 'outline'} onClick={() => setCategoriaFiltro('')} className="rounded-full whitespace-nowrap">Todos</Button>
            {categoriasDisponiveis.map(cat => (
              <Button key={cat} variant={categoriaFiltro === cat ? 'default' : 'outline'} onClick={() => setCategoriaFiltro(cat)} className="rounded-full whitespace-nowrap capitalize">{cat}</Button>
            ))}
          </div>
        )}

        {loading ? <div className="flex justify-center py-12"><div className="spinner"></div></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parceirsFiltrados.map((parceiro) => (
              <Card key={parceiro.id} className="card-custom hover-lift cursor-pointer overflow-hidden flex flex-col h-full" onClick={() => navigate(`/parceiro/${parceiro.id}`)}>
                <div className="aspect-video bg-gray-200 relative">
                  {parceiro.fotos && parceiro.fotos.length > 0 && (
                    <img src={parceiro.fotos[0]} alt={parceiro.nome_empresa} className="w-full h-full object-cover" />
                  )}
                  <Badge className="absolute top-3 left-3 bg-white/90 text-primary-gray">{parceiro.categoria}</Badge>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-primary-gray mb-2">{parceiro.nome_empresa}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-1">{parceiro.descricao}</p>

                  {parceiro.desconto_alt && (
                    <div className="mt-auto bg-teal-50 border border-teal-100 rounded p-2 flex items-center gap-2">
                      <TicketPercent className="h-4 w-4 text-primary-teal" />
                      <span className="text-xs font-bold text-teal-800">{parceiro.desconto_alt}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
      num_quartos: 1,
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-primary-gray">Meus Imóveis</h1>
          {!showForm && (
            <Button
              className="btn-primary w-full sm:w-auto"
              onClick={() => {
                setEditingImovel(null);
                resetForm();
                setShowForm(true);
              }}
            >
              + Cadastrar Novo Imóvel
            </Button>
          )}
        </div>

        {showForm ? (
          <Card className="card-custom mb-8">
            <CardHeader>
              <CardTitle className="text-primary-gray">
                {editingImovel ? 'Editar Imóvel' : 'Novo Imóvel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                    rows={4}
                    placeholder="Descreva as características e diferenciais do seu imóvel..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div>
                    <Label htmlFor="area_m2" className="form-label">Área (m²)</Label>
                    <Input
                      id="area_m2"
                      type="number"
                      className="form-input"
                      value={formData.area_m2}
                      onChange={(e) => setFormData({ ...formData, area_m2: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                    required
                    placeholder="Rua, número, bairro, CEP..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="capacidade" className="form-label">Capacidade *</Label>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <Label htmlFor={key} className="form-label mb-0 cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="mt-6 pt-6 border-t">
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
                    </div>
                  </div>
                </div>
                {formData.fotos.length > 0 && (
                  <div>
                    <Label className="form-label">Fotos para Inserir na Descrição</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 border rounded-lg bg-gray-50">
                      {formData.fotos.map((foto, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer border rounded overflow-hidden hover:ring-2 hover:ring-primary-teal aspect-video"
                          onClick={() => {
                            const fotoUrl = `![Foto ${index + 1}](${foto})`;
                            const newDescricao = formData.descricao + `\n\n${fotoUrl}\n`;
                            setFormData({ ...formData, descricao: newDescricao });
                          }}
                        >
                          <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100">Inserir</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Clique em uma foto acima para inseri-la na descrição
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" className="flex-1 btn-primary py-6 text-lg">
                    {editingImovel ? 'Atualizar' : 'Cadastrar'} Imóvel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 py-6"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {imoveis.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
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
              </div>
            ) : (
              imoveis.map((imovel) => (
                <Card key={imovel.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-200 relative group">
                    {imovel.fotos && imovel.fotos.length > 0 ? (
                      <img src={imovel.fotos[0]} className="w-full h-full object-cover" alt={imovel.titulo} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">Sem foto</div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm" onClick={() => handleEdit(imovel)} title="Editar">
                        <Edit className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(imovel.id)} title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {imovel.destaque && <Badge className="absolute top-2 left-2 bg-yellow-400 text-yellow-900">Destaque</Badge>}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-800 truncate text-lg">{imovel.titulo}</h3>
                      <p className="text-sm text-gray-500">{imovel.regiao} • {imovel.tipo}</p>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm h-10">
                      {imovel.descricao}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-1"><Bed className="h-3 w-3" /> {imovel.num_quartos} quartos</div>
                      <div className="flex items-center gap-1"><Bath className="h-3 w-3" /> {imovel.num_banheiros} banheiros</div>
                      <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {imovel.capacidade} pessoas</div>
                      <div className="flex items-center gap-1"><Eye className="h-3 w-3" /> {imovel.visualizacoes} views</div>
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