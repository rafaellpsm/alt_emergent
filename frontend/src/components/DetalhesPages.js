import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, X, ArrowRight, ChevronLeft, ChevronRight, MapPin, Home, Users, Bed, Bath, Maximize } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// --- COMPONENTE CARROSSEL RESPONSIVO ---
const ModernCarousel = ({ photos, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!photos || photos.length === 0) return null;

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  return (
    <div className="mb-6 md:mb-8 select-none">
      {/* Imagem Principal */}
      <div
        className="relative aspect-video bg-gray-200 rounded-xl md:rounded-2xl overflow-hidden shadow-md group cursor-zoom-in"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={photos[currentIndex]}
          alt={`${title} - Foto ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Setas de Navegação */}
        {photos.length > 1 && (
          <>
            {/* Seta Esquerda - Sempre visível no mobile, hover no desktop */}
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            {/* Seta Direita */}
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </>
        )}

        {/* Contador Mobile/Desktop */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-black/50 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Miniaturas (Scrollável no mobile) */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all snap-start ${currentIndex === index ? 'border-primary-teal ring-2 ring-primary-teal/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
            >
              <img src={photo} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox (Tela Cheia) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-50">
            <X className="h-8 w-8 md:h-10 md:w-10" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
            <img
              src={photos[currentIndex]}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {photos.length > 1 && (
              <>
                <button onClick={prevSlide} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-4"><ChevronLeft className="h-10 w-10 md:h-16 md:w-16" /></button>
                <button onClick={nextSlide} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-4"><ChevronRight className="h-10 w-10 md:h-16 md:w-16" /></button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- PÁGINA DE DETALHE DO IMÓVEL ---
export const ImovelDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anfitriao, setAnfitriao] = useState(null);
  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImovel = async () => {
      try {
        const response = await axios.get(`${API}/imoveis/${id}`);
        setImovel(response.data);

        const hostRes = await axios.get(`${API}/imoveis/${id}/proprietario`);
        if (hostRes.data?.id) {
          const perfilRes = await axios.get(`${API}/usuarios/${hostRes.data.id}/perfil-publico`);
          setAnfitriao(perfilRes.data);
        }
      } catch (error) {
        toast({ title: "Erro", description: "Imóvel não encontrado.", variant: "destructive" });
      }
      setLoading(false);
    };
    fetchImovel();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>;
  if (!imovel) return <div className="text-center py-20 text-xl md:text-2xl text-gray-400">Imóvel não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      {/* Cabeçalho */}
      <div className="bg-white border-b sticky top-16 z-20 md:relative md:top-0">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-primary-teal pl-0 -ml-2 md:ml-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Título e Badges */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="badge-teal text-xs md:text-sm">{imovel.tipo}</Badge>
              {imovel.destaque && <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs md:text-sm">Destaque</Badge>}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-primary-gray leading-tight">{imovel.titulo}</h1>
            <div className="flex items-center text-gray-500 text-sm md:text-base mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{imovel.regiao}</span>
              {imovel.endereco_completo && (
                <>
                  <span className="mx-2 hidden md:inline">•</span>
                  <span className="hidden md:inline truncate">{imovel.endereco_completo.split(',')[0]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grid Principal - 1 Coluna no Mobile, 3 no Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">

          {/* CONTEÚDO PRINCIPAL (Fotos + Texto) - Ocupa 2 colunas no PC */}
          <div className="lg:col-span-2 order-1">
            <ModernCarousel photos={imovel.fotos} title={imovel.titulo} />

            {/* Ícones de Comodidades Rápidas */}
            <div className="flex flex-wrap gap-4 md:gap-6 py-4 md:py-6 border-y border-gray-100 mb-6 md:mb-8 text-gray-600 text-sm md:text-base">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /> <span>{imovel.capacidade} Hóspedes</span></div>
              <div className="flex items-center gap-2"><Bed className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /> <span>{imovel.num_quartos} Quartos</span></div>
              <div className="flex items-center gap-2"><Bath className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /> <span>{imovel.num_banheiros} Banheiros</span></div>
              {imovel.area_m2 && <div className="flex items-center gap-2"><Maximize className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /> <span>{imovel.area_m2} m²</span></div>}
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed text-sm md:text-base">
              <h3 className="text-lg md:text-xl font-bold text-primary-gray mb-3 md:mb-4">Sobre este lugar</h3>
              <ReactMarkdown>{imovel.descricao}</ReactMarkdown>
            </div>

            {imovel.video_url && (
              <div className="mt-8 md:mt-10">
                <h3 className="text-lg md:text-xl font-bold text-primary-gray mb-3 md:mb-4">Vídeo do Imóvel</h3>
                <div className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden shadow-lg bg-black">
                  <video src={imovel.video_url} controls className="w-full h-full object-contain" poster={imovel.fotos[0] || ''}>
                    Seu navegador não suporta o player de vídeo.
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* BARRA LATERAL (Sidebar) - Ocupa 1 coluna no PC, vai para baixo no Mobile */}
          <div className="lg:col-span-1 order-2">
            <div className="sticky top-24 space-y-6">

              {/* Card de Reserva */}
              <Card className="border-none shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
                <CardContent className="p-5 md:p-6 bg-white">
                  <h3 className="text-lg font-bold text-primary-gray mb-4 md:mb-6">Gostou deste imóvel?</h3>

                  <div className="flex flex-col gap-3">
                    {imovel.link_booking && (
                      <Button asChild className="w-full btn-primary py-5 md:py-6 text-base md:text-lg shadow-md transition-transform active:scale-95 hover:scale-[1.02]">
                        <a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">Reservar no Booking</a>
                      </Button>
                    )}
                    {imovel.link_airbnb && (
                      <Button asChild variant="outline" className="w-full py-5 md:py-6 text-base md:text-lg border-2 border-[#FF5A5F] text-[#FF5A5F] hover:bg-[#FF5A5F] hover:text-white transition-all active:scale-95">
                        <a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">Reservar no Airbnb</a>
                      </Button>
                    )}
                    {!imovel.link_booking && !imovel.link_airbnb && (
                      <div className="text-center text-gray-500 italic p-4 bg-gray-50 rounded-lg text-sm">
                        Links de reserva não disponíveis.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card de Detalhes Extras */}
              <Card className="border shadow-sm rounded-xl md:rounded-2xl">
                <CardContent className="p-5 md:p-6">
                  <h3 className="font-bold text-primary-gray mb-4">Comodidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {imovel.possui_piscina && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">🏊 Piscina</Badge>}
                    {imovel.possui_churrasqueira && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">🍖 Churrasqueira</Badge>}
                    {imovel.possui_wifi && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">📶 Wi-Fi</Badge>}
                    {imovel.permite_pets && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">🐾 Pet Friendly</Badge>}
                    {imovel.tem_vista_mar && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">🌊 Vista Mar</Badge>}
                    {imovel.tem_ar_condicionado && <Badge variant="outline" className="px-2 py-1 md:px-3 border-primary-teal text-primary-teal text-xs md:text-sm">❄️ Ar Condicionado</Badge>}
                  </div>
                </CardContent>
              </Card>

              {/* Card do Anfitrião */}
              {user && user.role === 'admin' && anfitriao && (
                <div className="bg-white rounded-xl md:rounded-2xl border shadow-sm p-4 md:p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/anfitriao/${anfitriao.id}`)}>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal font-bold text-lg md:text-xl flex-shrink-0">
                    {anfitriao.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Anfitrião</p>
                    <p className="font-bold text-primary-gray text-base md:text-lg truncate">{anfitriao.nome}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA DE DETALHE DO PARCEIRO (RESPONSIVA) ---
export const ParceiroDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parceiro, setParceiro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParceiro = async () => {
      try {
        const response = await axios.get(`${API}/parceiros/${id}`);
        setParceiro(response.data);
      } catch (error) {
        toast({ title: "Erro", description: "Parceiro não encontrado.", variant: "destructive" });
      }
      setLoading(false);
    };
    fetchParceiro();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>;
  if (!parceiro) return <div className="text-center py-20 text-xl text-gray-400">Parceiro não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 md:pb-20">
      <div className="bg-white border-b sticky top-16 z-20 md:relative md:top-0">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-primary-teal pl-0 -ml-2 md:ml-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <Badge className="badge-teal mb-2 text-xs md:text-sm">{parceiro.categoria}</Badge>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-gray leading-tight">{parceiro.nome_empresa}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          <div className="lg:col-span-2 order-1">
            <ModernCarousel photos={parceiro.fotos} title={parceiro.nome_empresa} />

            <div className="prose max-w-none text-gray-700 leading-relaxed bg-white p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm text-sm md:text-base">
              <h3 className="text-lg md:text-xl font-bold text-primary-gray mb-3 md:mb-4">Sobre</h3>
              <ReactMarkdown>{parceiro.descricao}</ReactMarkdown>
            </div>

            {parceiro.video_url && (
              <div className="mt-8">
                <h3 className="text-lg md:text-xl font-bold text-primary-gray mb-3 md:mb-4">Apresentação em Vídeo</h3>
                <div className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden shadow-lg bg-black">
                  <video src={parceiro.video_url} controls className="w-full h-full object-contain">
                    Seu navegador não suporta o player de vídeo.
                  </video>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 order-2">
            <div className="sticky top-24 space-y-6">
              <Card className="border-none shadow-lg rounded-xl md:rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-5 md:p-6 space-y-6">
                  <h3 className="text-lg font-bold text-primary-gray border-byb-2">Contatos e Localização</h3>

                  <div className="space-y-4 text-sm md:text-base">
                    <div className="flex items-start gap-3">
                      <div className="bg-teal-50 p-2 rounded-lg"><MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /></div>
                      <div><p className="font-semibold text-xs text-gray-500 uppercase">Endereço</p><p className="text-gray-800">{parceiro.endereco || "Não informado"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-teal-50 p-2 rounded-lg"><Users className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /></div>
                      <div><p className="font-semibold text-xs text-gray-500 uppercase">Telefone</p><p className="text-gray-800">{parceiro.telefone}</p></div>
                    </div>
                    {parceiro.horario_funcionamento && (
                      <div className="flex items-start gap-3">
                        <div className="bg-teal-50 p-2 rounded-lg"><Home className="h-4 w-4 md:h-5 md:w-5 text-primary-teal" /></div>
                        <div><p className="font-semibold text-xs text-gray-500 uppercase">Horário</p><p className="text-gray-800">{parceiro.horario_funcionamento}</p></div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 pt-4">
                    {parceiro.website && <Button asChild className="w-full btn-primary py-5 md:py-6"><a href={parceiro.website} target="_blank" rel="noopener noreferrer">Visitar Site Oficial</a></Button>}
                    <div className="flex gap-3">
                      {parceiro.instagram && <Button asChild variant="outline" className="flex-1 py-5 md:py-6"><a href={parceiro.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></Button>}
                      {parceiro.facebook && <Button asChild variant="outline" className="flex-1 py-5 md:py-6"><a href={parceiro.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {parceiro.servicos_oferecidos && (
                <Card className="border-none shadow-sm rounded-xl md:rounded-2xl bg-teal-50/50">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="font-bold text-primary-teal mb-2">Serviços</h3>
                    <p className="text-gray-700 text-sm md:text-base whitespace-pre-line">{parceiro.servicos_oferecidos}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};