import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { MapPin, Bed, Bath, Users, Check, ArrowRight, Share2, Phone, Instagram, Facebook, Globe, TicketPercent, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// --- COMPONENTE: DETALHE DO IMÓVEL ---
export const ImovelDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imovel, setImovel] = useState(null);
  const [anfitriao, setAnfitriao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Estado para guardar o utilizador atual (para verificar se é admin)
  const [me, setMe] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Carrega Imóvel
        const imovelRes = await axios.get(`${API}/imoveis/${id}`);
        setImovel(imovelRes.data);

        // 2. Carrega Anfitrião
        try {
          const anfitriaoRes = await axios.get(`${API}/imoveis/${id}/proprietario`);
          setAnfitriao(anfitriaoRes.data);
        } catch (err) {
          console.error("Erro ao carregar anfitrião", err);
        }

        // 3. Verifica quem está logado (Para saber se é Admin)
        try {
          const meRes = await axios.get(`${API}/auth/me`);
          setMe(meRes.data);
        } catch (err) {
          // Se der erro (não logado), apenas ignora
          setMe(null);
        }

      } catch (error) {
        toast({ title: "Erro", description: "Imóvel não encontrado.", variant: "destructive" });
        navigate('/imoveis');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
  if (!imovel) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copiado!", description: "Pronto para compartilhar." });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Galeria de Imagens */}
      <div className="bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
            {/* Imagem Principal */}
            <div className="lg:col-span-2 relative h-full bg-black rounded-xl overflow-hidden group">
              {imovel.fotos && imovel.fotos.length > 0 ? (
                <img src={imovel.fotos[selectedImage]} className="w-full h-full object-contain" alt="Principal" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Sem foto</div>
              )}
            </div>

            {/* Lista Lateral */}
            <div className="hidden lg:grid grid-rows-3 gap-4 h-full">
              {imovel.fotos && imovel.fotos.slice(0, 3).map((foto, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden cursor-pointer border-2 ${selectedImage === idx ? 'border-primary-teal' : 'border-transparent'}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={foto} className="w-full h-full object-cover hover:opacity-80 transition-opacity" alt={`Thumb ${idx}`} />
                </div>
              ))}
              {imovel.fotos && imovel.fotos.length > 3 && (
                <div className="relative rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center text-white cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => setSelectedImage(3)}>
                  <span className="font-bold">+{imovel.fotos.length - 3} fotos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-custom border-t-4 border-t-primary-teal">
              <CardContent className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge className="badge-teal mb-2">{imovel.tipo}</Badge>
                    <h1 className="text-3xl font-bold text-primary-gray mb-1">{imovel.titulo}</h1>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-primary-teal" /> {imovel.endereco_completo}
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleShare} title="Compartilhar">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100 my-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 rounded-full text-primary-teal"><Users className="h-5 w-5" /></div>
                    <div><p className="text-xs text-gray-500">Capacidade</p><p className="font-bold">{imovel.capacidade} Pessoas</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 rounded-full text-primary-teal"><Bed className="h-5 w-5" /></div>
                    <div><p className="text-xs text-gray-500">Quartos</p><p className="font-bold">{imovel.num_quartos}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 rounded-full text-primary-teal"><Bath className="h-5 w-5" /></div>
                    <div><p className="text-xs text-gray-500">Banheiros</p><p className="font-bold">{imovel.num_banheiros}</p></div>
                  </div>
                </div>

                <div className="prose max-w-none text-gray-600">
                  <h3 className="text-lg font-bold text-primary-gray mb-2">Sobre este lugar</h3>
                  <p className="whitespace-pre-line leading-relaxed">{imovel.descricao}</p>
                </div>

                {/* Comodidades */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-primary-gray mb-4">O que este lugar oferece</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imovel.possui_piscina && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Piscina</div>}
                    {imovel.possui_churrasqueira && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Churrasqueira</div>}
                    {imovel.possui_wifi && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Wi-Fi</div>}
                    {imovel.permite_pets && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Aceita Pets</div>}
                    {imovel.tem_vista_mar && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Vista para o Mar</div>}
                    {imovel.tem_ar_condicionado && <div className="flex items-center gap-2 text-gray-700"><Check className="h-4 w-4 text-primary-teal" /> Ar Condicionado</div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vídeo (Se houver) */}
            {imovel.video_url && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-primary-gray mb-4">Vídeo do Imóvel</h3>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                  <video
                    src={imovel.video_url}
                    controls
                    className="w-full h-full"
                  >
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Card de Reserva */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-primary-gray mb-4">Reservar Agora</h3>
                <div className="space-y-3">
                  {imovel.link_booking && (
                    <Button className="w-full bg-[#003580] hover:bg-[#002860] text-white h-12 text-lg" onClick={() => window.open(imovel.link_booking, '_blank')}>
                      Reservar no Booking
                    </Button>
                  )}
                  {imovel.link_airbnb && (
                    <Button className="w-full bg-[#FF385C] hover:bg-[#D90B3E] text-white h-12 text-lg" onClick={() => window.open(imovel.link_airbnb, '_blank')}>
                      Reservar no Airbnb
                    </Button>
                  )}
                  {!imovel.link_booking && !imovel.link_airbnb && (
                    <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                      Links de reserva indisponíveis no momento.
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">Você será redirecionado para a plataforma parceira.</p>
                </div>
              </div>

              {/* Card do Anfitrião (AGORA SEGURO: Só aparece se "me" existir e for admin) */}
              {me && me.role === 'admin' && anfitriao && (
                <div className="bg-white rounded-xl md:rounded-2xl border shadow-sm p-4 md:p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/anfitriao/${anfitriao.id}`)}>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal font-bold text-lg md:text-xl flex-shrink-0">
                    {anfitriao.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Anfitrião (Admin View)</p>
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
      {/* Capa */}
      <div className="relative h-[300px] md:h-[400px] bg-gray-900">
        {parceiro.fotos && parceiro.fotos.length > 0 ? (
          <img src={parceiro.fotos[0]} className="w-full h-full object-cover opacity-60" alt={parceiro.nome_empresa} />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-teal-800 to-blue-900 opacity-80"></div>
        )}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <Badge className="badge-teal mb-4 text-base px-3 py-1">{parceiro.categoria}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{parceiro.nome_empresa}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Desconto */}
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

            {/* Sobre */}
            <Card className="card-custom">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{parceiro.descricao}</p>
              </CardContent>
            </Card>

            {/* Vídeo */}
            {parceiro.video_url && (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                <video src={parceiro.video_url} controls className="w-full h-full" />
              </div>
            )}

            {/* Galeria */}
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

          {/* Sidebar */}
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
                {parceiro.instagram && (
                  <a href={parceiro.instagram.includes('http') ? parceiro.instagram : `https://instagram.com/${parceiro.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram className="h-6 w-6" /></a>
                )}
                {parceiro.facebook && (
                  <a href={parceiro.facebook.includes('http') ? parceiro.facebook : `https://facebook.com/${parceiro.facebook}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="h-6 w-6" /></a>
                )}
                {parceiro.website && (
                  <a href={parceiro.website.startsWith('http') ? parceiro.website : `https://${parceiro.website}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary-teal transition-colors"><Globe className="h-6 w-6" /></a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};