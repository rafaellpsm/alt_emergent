import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { Button } from './ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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

              <a href="/admin/dashboard" className="nav-link py-3 px-3 whitespace-nowrap">Dashboard</a>

              <a href="/admin/candidaturas" className="nav-link py-3 px-3 whitespace-nowrap">Candidaturas</a>

              <a href="/admin/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Imóveis</a>

              <a href="/admin/usuarios" className="nav-link py-3 px-3 whitespace-nowrap">Usuários</a>

              <a href="/admin/conteudo" className="nav-link py-3 px-3 whitespace-nowrap">Conteúdo</a>

              <a href="/admin/comunicacao" className="nav-link py-3 px-3 whitespace-nowrap">Comunicação</a>

            </>

          )}



          {user.role === 'membro' && (

            <>

              <a href="/meus-imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Meus Imóveis</a>

              <a href="/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Todos os Imóveis</a>

            </>

          )}



          {user.role === 'parceiro' && (

            <>

              <a href="/meu-perfil" className="nav-link py-3 px-3 whitespace-nowrap">Meu Perfil</a>

              <a href="/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Imóveis</a>

            </>

          )}



          <a href="/parceiros" className="nav-link py-3 px-3 whitespace-nowrap">Parceiros</a>

        </div>

      </div>

    </nav>

  );

};



// Página de Detalhes do Imóvel

export const ImovelDetalhePage = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [imovel, setImovel] = useState(null);

  const [proprietario, setProprietario] = useState(null);

  const [loading, setLoading] = useState(true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);



  useEffect(() => {

    fetchImovelDetalhes();

  }, [id]);



  const fetchImovelDetalhes = async () => {

    try {

      const response = await axios.get(`${API}/imoveis/${id}`);

      setImovel(response.data);



      // Buscar dados do proprietário

      const propResponse = await axios.get(`${API}/imoveis/${id}/proprietario`);

      setProprietario(propResponse.data);

    } catch (error) {

      toast({

        title: "Erro ao carregar imóvel",

        description: "Imóvel não encontrado.",

        variant: "destructive",

      });

      navigate('/imoveis');

    }

    setLoading(false);

  };



  const nextPhoto = () => {

    if (imovel?.fotos?.length > 1) {

      setCurrentPhotoIndex((prev) => (prev + 1) % imovel.fotos.length);

    }

  };



  const prevPhoto = () => {

    if (imovel?.fotos?.length > 1) {

      setCurrentPhotoIndex((prev) => (prev - 1 + imovel.fotos.length) % imovel.fotos.length);

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



  if (!imovel) return null;



  return (

    <div className="min-h-screen bg-gray-50">

      <Header />

      <Navigation />



      <div className="container mx-auto px-4 py-8">

        {/* Breadcrumb */}

        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">

          <a href="/imoveis" className="hover:text-primary-teal">Imóveis</a>

          <span>›</span>

          <span>{imovel.titulo}</span>

        </div>



        <div className="grid lg:grid-cols-3 gap-8">

          {/* Galeria de Fotos */}

          <div className="lg:col-span-2">

            <Card className="card-custom overflow-hidden">

              {imovel.fotos && imovel.fotos.length > 0 ? (

                <div className="relative">

                  <div className="aspect-video bg-gray-100">

                    <img

                      src={imovel.fotos[currentPhotoIndex]}

                      alt={`${imovel.titulo} - Foto ${currentPhotoIndex + 1}`}

                      className="w-full h-full object-cover"

                    />

                  </div>



                  {imovel.fotos.length > 1 && (

                    <>

                      <Button

                        variant="ghost"

                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"

                        onClick={prevPhoto}

                      >

                        ‹

                      </Button>

                      <Button

                        variant="ghost"

                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"

                        onClick={nextPhoto}

                      >

                        ›

                      </Button>

                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">

                        {imovel.fotos.map((_, index) => (

                          <button

                            key={index}

                            className={`w-3 h-3 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'

                              }`}

                            onClick={() => setCurrentPhotoIndex(index)}

                          />

                        ))}

                      </div>

                    </>

                  )}

                </div>

              ) : (

                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">

                  <span className="text-gray-500 text-lg">Sem fotos disponíveis</span>

                </div>

              )}



              {/* Thumbnails */}

              {imovel.fotos && imovel.fotos.length > 1 && (

                <div className="p-4">

                  <div className="flex space-x-2 overflow-x-auto">

                    {imovel.fotos.map((foto, index) => (

                      <button

                        key={index}

                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${index === currentPhotoIndex ? 'border-primary-teal' : 'border-transparent'

                          }`}

                        onClick={() => setCurrentPhotoIndex(index)}

                      >

                        <img src={foto} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />

                      </button>

                    ))}

                  </div>

                </div>

              )}

            </Card>



            {/* Descrição */}

            <Card className="card-custom mt-6">

              <CardHeader>

                <CardTitle className="text-primary-gray">Sobre o Imóvel</CardTitle>

              </CardHeader>

              <CardContent>

                {/* --- CÓDIGO DO VÍDEO ADICIONADO AQUI --- */}

                {imovel.video_url && !imovel.video_url.includes("youtube.com") && (

                  <div className="mb-6">

                    <video src={imovel.video_url} controls className="w-full rounded-lg shadow-md" />

                  </div>

                )}

                <div className="text-gray-700 leading-relaxed">

                  {/* Render description with markdown support for images */}

                  {imovel.descricao.split('\n').map((paragraph, index) => {

                    // Check if paragraph contains image markdown

                    const imageMatch = paragraph.match(/!\[([^\]]*)\]\(([^)]+)\)/);

                    if (imageMatch) {

                      return (

                        <div key={index} className="my-4">

                          <img

                            src={imageMatch[2]}

                            alt={imageMatch[1] || 'Imagem do imóvel'}

                            className="w-full max-w-md mx-auto rounded-lg shadow-md"

                          />

                          {imageMatch[1] && (

                            <p className="text-center text-sm text-gray-500 mt-2">{imageMatch[1]}</p>

                          )}

                        </div>

                      );

                    }

                    return paragraph ? <p key={index} className="mb-3">{paragraph}</p> : <br key={index} />;

                  })}

                </div>

              </CardContent>

            </Card>

          </div>



          {/* Informações Laterais */}

          <div className="space-y-6">

            {/* Informações Principais */}

            <Card className="card-custom">

              <CardHeader>

                <CardTitle className="text-2xl text-primary-gray">{imovel.titulo}</CardTitle>

                <CardDescription className="flex items-center space-x-2">

                  <Badge className="badge-teal">{imovel.tipo}</Badge>

                  <span>•</span>

                  <span>{imovel.regiao}</span>

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-4">

                {/* Preços */}

                <div>

                  <h3 className="font-semibold mb-2 text-primary-gray">Preços</h3>

                  <div className="space-y-1">

                    <div className="flex justify-between">

                      <span>Diária:</span>

                      <span className="font-bold text-primary-teal">R$ {imovel.preco_diaria}</span>

                    </div>

                    {imovel.preco_semanal && (

                      <div className="flex justify-between">

                        <span>Semanal:</span>

                        <span className="font-bold text-primary-teal">R$ {imovel.preco_semanal}</span>

                      </div>

                    )}

                    {imovel.preco_mensal && (

                      <div className="flex justify-between">

                        <span>Mensal:</span>

                        <span className="font-bold text-primary-teal">R$ {imovel.preco_mensal}</span>

                      </div>

                    )}

                  </div>

                </div>



                {/* Especificações */}

                <div>

                  <h3 className="font-semibold mb-2 text-primary-gray">Especificações</h3>

                  <div className="grid grid-cols-2 gap-2 text-sm">

                    <div>🛏️ {imovel.num_quartos} quartos</div>

                    <div>🚿 {imovel.num_banheiros} banheiros</div>

                    <div>👥 {imovel.capacidade} pessoas</div>

                    {imovel.area_m2 && <div>📐 {imovel.area_m2}m²</div>}

                  </div>

                </div>



                {/* Comodidades */}

                <div>

                  <h3 className="font-semibold mb-2 text-primary-gray">Comodidades</h3>

                  <div className="flex flex-wrap gap-2">

                    {imovel.possui_piscina && <Badge className="badge-teal">🏊 Piscina</Badge>}

                    {imovel.possui_churrasqueira && <Badge className="badge-teal">🔥 Churrasqueira</Badge>}

                    {imovel.possui_wifi && <Badge className="badge-teal">📶 Wi-Fi</Badge>}

                    {imovel.permite_pets && <Badge className="badge-teal">🐕 Pet-Friendly</Badge>}

                    {imovel.tem_vista_mar && <Badge className="badge-teal">🌊 Vista Mar</Badge>}

                    {imovel.tem_ar_condicionado && <Badge className="badge-teal">❄️ Ar Condicionado</Badge>}

                  </div>

                </div>



                {/* Links de Reserva */}

                {(imovel.link_booking || imovel.link_airbnb) && (

                  <div>

                    <h3 className="font-semibold mb-3 text-primary-gray">Fazer Reserva</h3>

                    <div className="space-y-2">

                      {imovel.link_booking && (

                        <Button className="w-full btn-primary" asChild>

                          <a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">

                            Reservar no Booking.com

                          </a>

                        </Button>

                      )}

                      {imovel.link_airbnb && (

                        <Button className="w-full btn-primary" asChild>

                          <a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">

                            Reservar no Airbnb

                          </a>

                        </Button>

                      )}

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>



            {/* Localização */}

            <Card className="card-custom">

              <CardHeader>

                <CardTitle className="text-primary-gray">Localização</CardTitle>

              </CardHeader>

              <CardContent>

                <p className="text-gray-700 text-sm">{imovel.endereco_completo}</p>

                <p className="text-primary-teal font-medium mt-1">{imovel.regiao}, Ilhabela/SP</p>

              </CardContent>

            </Card>



            {/* Informações do Proprietário */}

            {proprietario && (

              <Card className="card-custom">

                <CardHeader>

                  <CardTitle className="text-primary-gray">Propriedade de</CardTitle>

                </CardHeader>

                <CardContent>

                  <div className="flex items-center space-x-3">

                    <div className="w-12 h-12 bg-primary-teal rounded-full flex items-center justify-center text-white font-bold">

                      {proprietario.nome.charAt(0)}

                    </div>

                    <div>

                      <p className="font-medium text-primary-gray">{proprietario.nome}</p>

                      <p className="text-sm text-gray-600">Membro ALT Ilhabela</p>

                    </div>

                  </div>

                </CardContent>

              </Card>

            )}



            {/* Estatísticas */}

            <Card className="card-custom">

              <CardContent className="pt-6">

                <div className="text-center space-y-2">

                  <div className="text-2xl font-bold text-primary-teal">{imovel.visualizacoes}</div>

                  <div className="text-sm text-gray-600">Visualizações</div>

                </div>

              </CardContent>

            </Card>

          </div>

        </div>

      </div>

    </div>

  );

};



// Página de Detalhes do Parceiro

export const ParceiroDetalhePage = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [parceiro, setParceiro] = useState(null);

  const [loading, setLoading] = useState(true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);



  useEffect(() => {

    fetchParceiroDetalhes();

  }, [id]);



  const fetchParceiroDetalhes = async () => {

    try {

      const response = await axios.get(`${API}/parceiros`);

      const parceiroEncontrado = response.data.find(p => p.id === id);



      if (parceiroEncontrado) {

        setParceiro(parceiroEncontrado);

      } else {

        toast({

          title: "Erro ao carregar parceiro",

          description: "Parceiro não encontrado.",

          variant: "destructive",

        });

        navigate('/parceiros');

      }

    } catch (error) {

      toast({

        title: "Erro ao carregar parceiro",

        description: "Tente novamente mais tarde.",

        variant: "destructive",

      });

      navigate('/parceiros');

    }

    setLoading(false);

  };



  const nextPhoto = () => {

    if (parceiro?.fotos?.length > 1) {

      setCurrentPhotoIndex((prev) => (prev + 1) % parceiro.fotos.length);

    }

  };



  const prevPhoto = () => {

    if (parceiro?.fotos?.length > 1) {

      setCurrentPhotoIndex((prev) => (prev - 1 + parceiro.fotos.length) % parceiro.fotos.length);

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



  if (!parceiro) return null;



  return (

    <div className="min-h-screen bg-gray-50">

      <Header />

      <Navigation />



      <div className="container mx-auto px-4 py-8">

        {/* Breadcrumb */}

        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">

          <a href="/parceiros" className="hover:text-primary-teal">Parceiros</a>

          <span>›</span>

          <span>{parceiro.nome_empresa}</span>

        </div>



        <div className="grid lg:grid-cols-3 gap-8">

          {/* Galeria de Fotos */}

          <div className="lg:col-span-2">

            <Card className="card-custom overflow-hidden">

              {parceiro.fotos && parceiro.fotos.length > 0 ? (

                <div className="relative">

                  <div className="aspect-video bg-gray-100">

                    <img

                      src={parceiro.fotos[currentPhotoIndex]}

                      alt={`${parceiro.nome_empresa} - Foto ${currentPhotoIndex + 1}`}

                      className="w-full h-full object-cover"

                    />

                  </div>



                  {parceiro.fotos.length > 1 && (

                    <>

                      <Button

                        variant="ghost"

                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"

                        onClick={prevPhoto}

                      >

                        ‹

                      </Button>

                      <Button

                        variant="ghost"

                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"

                        onClick={nextPhoto}

                      >

                        ›

                      </Button>

                    </>

                  )}

                </div>

              ) : (

                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">

                  <span className="text-gray-500 text-lg">Sem fotos disponíveis</span>

                </div>

              )}

            </Card>



            {/* Sobre a Empresa */}

            <Card className="card-custom mt-6">

              <CardHeader>

                <CardTitle className="text-primary-gray">Sobre {parceiro.nome_empresa}</CardTitle>

              </CardHeader>

              <CardContent>

                {/* --- CÓDIGO DO VÍDEO ADICIONADO AQUI --- */}

                {parceiro.video_url && !parceiro.video_url.includes("youtube.com") && (

                  <div className="mb-6">

                    <video src={parceiro.video_url} controls className="w-full rounded-lg shadow-md" />

                  </div>

                )}

                <p className="text-gray-700 leading-relaxed whitespace-pre-line">

                  {parceiro.descricao}

                </p>



                {parceiro.servicos_oferecidos && (

                  <div className="mt-4">

                    <h3 className="font-semibold mb-2 text-primary-gray">Serviços Oferecidos:</h3>

                    <p className="text-gray-700">{parceiro.servicos_oferecidos}</p>

                  </div>

                )}

              </CardContent>

            </Card>

          </div>



          {/* Informações Laterais */}

          <div className="space-y-6">

            {/* Informações Principais */}

            <Card className="card-custom">

              <CardHeader>

                <CardTitle className="text-2xl text-primary-gray">{parceiro.nome_empresa}</CardTitle>

                <CardDescription>

                  <Badge className="badge-teal">{parceiro.categoria}</Badge>

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-4">

                {/* Contato */}

                <div>

                  <h3 className="font-semibold mb-2 text-primary-gray">Contato</h3>

                  <div className="space-y-2 text-sm">

                    {parceiro.telefone && (

                      <div className="flex items-center space-x-2">

                        <span>📞</span>

                        <a href={`tel:${parceiro.telefone}`} className="text-primary-teal hover:underline">

                          {parceiro.telefone}

                        </a>

                      </div>

                    )}

                    {parceiro.email && (

                      <div className="flex items-center space-x-2">

                        <span>✉️</span>

                        <a href={`mailto:${parceiro.email}`} className="text-primary-teal hover:underline">

                          {parceiro.email}

                        </a>

                      </div>

                    )}

                    {parceiro.whatsapp && (

                      <div className="flex items-center space-x-2">

                        <span>💬</span>

                        <a

                          href={`https://wa.me/${parceiro.whatsapp.replace(/\D/g, '')}`}

                          target="_blank"

                          rel="noopener noreferrer"

                          className="text-primary-teal hover:underline"

                        >

                          WhatsApp

                        </a>

                      </div>

                    )}

                  </div>

                </div>



                {/* Horário */}

                {parceiro.horario_funcionamento && (

                  <div>

                    <h3 className="font-semibold mb-2 text-primary-gray">Horário de Funcionamento</h3>

                    <p className="text-sm text-gray-700">{parceiro.horario_funcionamento}</p>

                  </div>

                )}



                {/* Links Sociais */}

                <div>

                  <h3 className="font-semibold mb-3 text-primary-gray">Links</h3>

                  <div className="space-y-2">

                    {parceiro.website && (

                      <Button variant="outline" className="w-full" asChild>

                        <a href={parceiro.website} target="_blank" rel="noopener noreferrer">

                          🌐 Website

                        </a>

                      </Button>

                    )}

                    {parceiro.instagram && (

                      <Button variant="outline" className="w-full" asChild>

                        <a href={parceiro.instagram} target="_blank" rel="noopener noreferrer">

                          📷 Instagram

                        </a>

                      </Button>

                    )}

                    {parceiro.facebook && (

                      <Button variant="outline" className="w-full" asChild>

                        <a href={parceiro.facebook} target="_blank" rel="noopener noreferrer">

                          📘 Facebook

                        </a>

                      </Button>

                    )}

                  </div>

                </div>

              </CardContent>

            </Card>



            {/* Localização */}

            <Card className="card-custom">

              <CardHeader>

                <CardTitle className="text-primary-gray">Localização</CardTitle>

              </CardHeader>

              <CardContent>

                <p className="text-gray-700 text-sm">{parceiro.endereco}</p>

              </CardContent>

            </Card>



            {/* Informações Adicionais */}

            <Card className="card-custom">

              <CardHeader>

                <CardTitle className="text-primary-gray">Informações</CardTitle>

              </CardHeader>

              <CardContent className="space-y-3 text-sm">

                {parceiro.tempo_operacao && (

                  <div className="flex justify-between">

                    <span className="text-gray-600">Tempo de operação:</span>

                    <span className="font-medium">{parceiro.tempo_operacao}</span>

                  </div>

                )}

                {parceiro.preco_medio && (

                  <div className="flex justify-between">

                    <span className="text-gray-600">Preço médio:</span>

                    <span className="font-medium">{parceiro.preco_medio}</span>

                  </div>

                )}

                <div className="flex justify-between">

                  <span className="text-gray-600">Membro desde:</span>

                  <span className="font-medium">

                    {new Date(parceiro.created_at).toLocaleDateString('pt-BR')}

                  </span>

                </div>

              </CardContent>

            </Card>

          </div>

        </div>

      </div>

    </div>

  );

};