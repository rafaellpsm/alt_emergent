import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import {
  MapPin, Bed, Bath, Users, Check, ArrowRight, Share2,
  Phone, Instagram, Facebook, Globe, TicketPercent, MessageCircle,
  ShieldCheck, Heart, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// --- FUNÇÃO AUXILIAR: Renderizar Markdown de Imagens na Descrição ---
const renderDescriptionWithImages = (text) => {
  if (!text) return null;
  const parts = text.split(/(!\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      return (
        <div key={index} className="my-6 rounded-xl overflow-hidden shadow-sm">
          <img src={imageMatch[2]} alt={imageMatch[1] || "Detalhe do imóvel"} className="w-full h-auto object-cover" loading="lazy" />
        </div>
      );
    }
    return <span key={index} className="whitespace-pre-line text-gray-600 leading-relaxed text-base">{part}</span>;
  });
};

// --- COMPONENTE: DETALHE DO IMÓVEL ---
export const ImovelDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imovel, setImovel] = useState(null);
  const [anfitriao, setAnfitriao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  // Estado do Carrossel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const imovelRes = await axios.get(`${API}/imoveis/${id}`);
        setImovel(imovelRes.data);

        try {
          const anfitriaoRes = await axios.get(`${API}/imoveis/${id}/proprietario`);
          setAnfitriao(anfitriaoRes.data);
        } catch (err) { console.error(err); }

        try {
          const meRes = await axios.get(`${API}/auth/me`);
          setMe(meRes.data);
        } catch (err) { setMe(null); }

      } catch (error) {
        navigate('/imoveis');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id, navigate]);

  // Funções do Carrossel
  const nextImage = () => {
    if (imovel?.fotos) {
      setCurrentImageIndex((prev) => (prev === imovel.fotos.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (imovel?.fotos) {
      setCurrentImageIndex((prev) => (prev === 0 ? imovel.fotos.length - 1 : prev - 1));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copiado!", description: "Pronto para enviar aos amigos." });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
  if (!imovel) return null;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Breadcrumb */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-4 h-14 flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-primary-teal transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/imoveis" className="hover:text-primary-teal transition-colors">Imóveis</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">{imovel.titulo}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
              {imovel.titulo}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary-teal" /> {imovel.endereco_completo}
              </span>
              <span className="hidden md:inline text-gray-300">|</span>
              <Badge variant="secondary" className="bg-teal-50 text-primary-teal hover:bg-teal-100">{imovel.tipo}</Badge>
              <Badge variant="outline" className="border-gray-200 text-gray-600">{imovel.regiao}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full hover:bg-gray-50 border-gray-300 text-gray-600">
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* --- CARROSSEL DE FOTOS --- */}
        <div className="mb-10">
          <div className="relative w-full h-[400px] md:h-[600px] bg-gray-100 rounded-2xl overflow-hidden group shadow-sm border border-gray-200">
            {imovel.fotos && imovel.fotos.length > 0 ? (
              <>
                <img
                  src={imovel.fotos[currentImageIndex]}
                  className="w-full h-full object-contain md:object-cover bg-black/5 backdrop-blur-sm transition-opacity duration-300"
                  alt={`Foto ${currentImageIndex + 1}`}
                />

                {imovel.fotos.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"><ChevronLeft className="h-6 w-6" /></button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"><ChevronRight className="h-6 w-6" /></button>
                  </>
                )}

                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                  {currentImageIndex + 1} / {imovel.fotos.length}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><ImageIcon className="h-12 w-12 mb-2 opacity-50" /><span>Sem fotos disponíveis</span></div>
            )}
          </div>

          {imovel.fotos && imovel.fotos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {imovel.fotos.map((foto, idx) => (
                <div key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all ${currentImageIndex === idx ? 'ring-2 ring-primary-teal opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={foto} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo Principal + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">

          <div className="lg:col-span-2 space-y-10">
            {/* Resumo com FOTO DO ANFITRIÃO */}
            <div className="flex items-center justify-between py-2 border-b pb-8">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Hospedagem por {anfitriao ? anfitriao.nome.split(' ')[0] : 'Anfitrião'}</h2>
                <p className="text-gray-600 flex gap-2 text-sm">
                  <span>{imovel.capacidade} hóspedes</span> •
                  <span>{imovel.num_quartos} quartos</span> •
                  <span>{imovel.num_banheiros} banheiros</span>
                </p>
              </div>
              {anfitriao && (
                <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                  {/* AQUI ESTÁ A LÓGICA DA FOTO */}
                  {anfitriao.foto_url ? (
                    <img src={anfitriao.foto_url} alt={anfitriao.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-teal text-white font-bold text-xl uppercase">
                      {anfitriao.nome.charAt(0)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Destaques (Ícones Grandes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {imovel.possui_wifi && (
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Globe className="h-6 w-6 text-primary-teal mt-1" />
                  <div><h3 className="font-semibold text-gray-900">Wi-Fi Veloz</h3><p className="text-sm text-gray-500">Conexão estável.</p></div>
                </div>
              )}
              {imovel.permite_pets && (
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Users className="h-6 w-6 text-primary-teal mt-1" />
                  <div><h3 className="font-semibold text-gray-900">Pet Friendly</h3><p className="text-sm text-gray-500">Seu pet é bem-vindo.</p></div>
                </div>
              )}
              {imovel.possui_piscina && (
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Users className="h-6 w-6 text-primary-teal mt-1" />
                  <div><h3 className="font-semibold text-gray-900">Piscina</h3><p className="text-sm text-gray-500">Para dias de sol.</p></div>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre este espaço</h3>
              <div className="prose max-w-none">
                {renderDescriptionWithImages(imovel.descricao)}
              </div>
            </div>

            {/* Comodidades */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">O que este lugar oferece</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {imovel.possui_piscina && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Piscina</div>}
                {imovel.possui_churrasqueira && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Churrasqueira</div>}
                {imovel.possui_wifi && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Wi-Fi</div>}
                {imovel.permite_pets && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Aceita Pets</div>}
                {imovel.tem_vista_mar && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Vista para o Mar</div>}
                {imovel.tem_ar_condicionado && <div className="flex items-center gap-3 text-gray-700"><Check className="h-5 w-5 text-primary-teal" /> Ar Condicionado</div>}
              </div>
            </div>

            {/* Vídeo */}
            {imovel.video_url && (
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tour em Vídeo</h3>
                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                  <video src={imovel.video_url} controls className="w-full h-full">Seu navegador não suporta vídeos.</video>
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Sticky Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-primary-teal p-3 text-center">
                  <p className="text-xs font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Verificado ALT
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <span className="text-2xl font-bold text-gray-900">Disponível</span>
                    <span className="text-gray-500 text-sm font-normal"> / para reserva</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {imovel.link_booking ? (
                      <Button className="w-full bg-[#003580] hover:bg-[#002860] text-white h-12 text-base font-bold rounded-xl shadow-sm flex justify-between px-6 transition-transform hover:scale-[1.02]" onClick={() => window.open(imovel.link_booking, '_blank')}>
                        <span>Reservar no Booking</span> <ArrowRight className="h-5 w-5" />
                      </Button>
                    ) : null}

                    {imovel.link_airbnb ? (
                      <Button className="w-full bg-[#FF385C] hover:bg-[#D90B3E] text-white h-12 text-base font-bold rounded-xl shadow-sm flex justify-between px-6 transition-transform hover:scale-[1.02]" onClick={() => window.open(imovel.link_airbnb, '_blank')}>
                        <span>Reservar no Airbnb</span> <ArrowRight className="h-5 w-5" />
                      </Button>
                    ) : null}

                    {!imovel.link_booking && !imovel.link_airbnb && (
                      <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm border border-dashed border-gray-300">
                        Contacte o anfitrião para verificar disponibilidade.
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs text-gray-400 mb-6">
                    Você será redirecionado para a plataforma de reserva.
                  </div>

                  {/* Admin View */}
                  {me && me.role === 'admin' && anfitriao && (
                    <>
                      <hr className="border-gray-100 mb-4" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Painel Admin</p>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-100" onClick={() => navigate(`/anfitriao/${anfitriao.id}`)}>
                          <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-primary-teal flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                            {anfitriao.foto_url ? <img src={anfitriao.foto_url} className="w-full h-full object-cover" alt="" /> : anfitriao.nome.charAt(0)}
                          </div>
                          <div><p className="text-sm font-bold text-gray-900">{anfitriao.nome}</p><p className="text-xs text-primary-teal font-medium">Ver Dados de Contato</p></div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: DETALHE DO PARCEIRO ---
export const ParceiroDetalhePage = () => {
  const { id } = useParams();
  const [parceiro, setParceiro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParceiro = async () => {
      try {
        const response = await axios.get(`${API}/parceiros/${id}`);
        setParceiro(response.data);
      } catch (error) {
        toast({ title: "Erro", description: "Parceiro não encontrado.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchParceiro();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
  if (!parceiro) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative h-[300px] md:h-[400px] bg-gray-900">
        {parceiro.fotos && parceiro.fotos.length > 0 ? (
          <img src={parceiro.fotos[0]} className="w-full h-full object-cover opacity-60" alt={parceiro.nome_empresa} />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-teal-800 to-blue-900 opacity-80"></div>
        )}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <Badge className="bg-primary-teal text-white mb-4 text-base px-3 py-1 border-none">{parceiro.categoria}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{parceiro.nome_empresa}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {parceiro.desconto_alt && (
              <div className="bg-[#f0fdfa] border border-primary-teal/30 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md text-primary-teal flex-shrink-0">
                  <TicketPercent className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-800 uppercase tracking-widest mb-1">Benefício Exclusivo Hóspede ALT</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{parceiro.desconto_alt}</h2>
                </div>
              </div>
            )}
            <Card className="card-custom">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{parceiro.descricao}</p>
              </CardContent>
            </Card>
            {parceiro.video_url && (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                <video src={parceiro.video_url} controls className="w-full h-full" />
              </div>
            )}
            {parceiro.fotos && parceiro.fotos.length > 1 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Galeria</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {parceiro.fotos.slice(1).map((foto, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity cursor-pointer">
                      <img src={foto} className="w-full h-full object-cover" alt="Galeria" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 sticky top-24">
              {parceiro.telefone && (
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><Phone className="h-5 w-5 text-gray-600" /></div>
                  <div><p className="text-xs text-gray-500">Telefone</p><p className="font-medium text-gray-900">{parceiro.telefone}</p></div>
                </div>
              )}
              {parceiro.whatsapp && (
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-lg"><MessageCircle className="h-5 w-5 text-green-600" /></div>
                  <div><p className="text-xs text-gray-500">WhatsApp</p><p className="font-medium text-gray-900">{parceiro.whatsapp}</p></div>
                </div>
              )}
              {parceiro.endereco && (
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><MapPin className="h-5 w-5 text-gray-600" /></div>
                  <div><p className="text-xs text-gray-500">Endereço</p><p className="font-medium text-gray-900">{parceiro.endereco}</p></div>
                </div>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-around pt-2">
                {parceiro.instagram && (<a href={parceiro.instagram.includes('http') ? parceiro.instagram : `https://instagram.com/${parceiro.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram className="h-6 w-6" /></a>)}
                {parceiro.facebook && (<a href={parceiro.facebook.includes('http') ? parceiro.facebook : `https://facebook.com/${parceiro.facebook}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="h-6 w-6" /></a>)}
                {parceiro.website && (<a href={parceiro.website.startsWith('http') ? parceiro.website : `https://${parceiro.website}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary-teal transition-colors"><Globe className="h-6 w-6" /></a>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};