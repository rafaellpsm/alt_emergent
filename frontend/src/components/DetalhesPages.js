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

// --- COMPONENTE: DETALHE DO IMÓVEL (CLÁSSICO) ---
export const ImovelDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imovel, setImovel] = useState(null);
  const [anfitriao, setAnfitriao] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para guardar o utilizador atual (correção do erro anterior)
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

        // 3. Verifica quem está logado
        try {
          const meRes = await axios.get(`${API}/auth/me`);
          setMe(meRes.data);
        } catch (err) {
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
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="container mx-auto px-4">

        {/* Cabeçalho do Imóvel */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{imovel.titulo}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary-teal" /> {imovel.endereco_completo}</span>
            <span className="text-gray-300">|</span>
            <Badge className="bg-primary-teal/10 text-primary-teal hover:bg-primary-teal/20 border-none">{imovel.tipo}</Badge>
            <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto text-primary-teal hover:bg-teal-50">
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* Galeria de Fotos (Clássica) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 h-[400px] md:h-[500px] mb-10 rounded-2xl overflow-hidden shadow-sm">
          {/* Foto Principal (Grande) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-full">
            {imovel.fotos && imovel.fotos.length > 0 ? (
              <img src={imovel.fotos[0]} className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer" alt="Principal" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Sem foto</div>
            )}
          </div>
          {/* Fotos Secundárias */}
          {imovel.fotos && imovel.fotos.slice(1, 5).map((foto, idx) => (
            <div key={idx} className="hidden md:block h-full">
              <img src={foto} className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer" alt={`Foto ${idx + 1}`} />
            </div>
          ))}
        </div>

        {/* Conteúdo Principal + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Lado Esquerdo: Detalhes */}
          <div className="lg:col-span-2 space-y-8">

            {/* Resumo */}
            <div className="flex justify-between py-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Hospedagem inteira: {imovel.tipo}</h2>
                <p className="text-gray-600">
                  {imovel.capacidade} hóspedes · {imovel.num_quartos} quartos · {imovel.num_banheiros} banheiros
                </p>
              </div>
              {anfitriao && (
                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center bg-primary-teal text-white font-bold text-xl">
                    {anfitriao.nome.charAt(0)}
                  </div>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre este espaço</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{imovel.descricao}</p>
            </div>

            {/* Comodidades */}
            <div className="py-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">O que este lugar oferece</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="py-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Vídeo do Imóvel</h3>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                  <video src={imovel.video_url} controls className="w-full h-full">
                    Seu navegador não suporta vídeos.
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Sidebar de Reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reservar</h3>

              <div className="space-y-4">
                {imovel.link_booking ? (
                  <Button className="w-full bg-[#003580] hover:bg-[#002860] text-white h-12 text-lg font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5" onClick={() => window.open(imovel.link_booking, '_blank')}>
                    Ir para Booking.com
                  </Button>
                ) : null}

                {imovel.link_airbnb ? (
                  <Button className="w-full bg-[#FF385C] hover:bg-[#D90B3E] text-white h-12 text-lg font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5" onClick={() => window.open(imovel.link_airbnb, '_blank')}>
                    Ir para Airbnb
                  </Button>
                ) : null}

                {!imovel.link_booking && !imovel.link_airbnb && (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm border border-dashed border-gray-300">
                    Este imóvel ainda não disponibilizou links diretos de reserva.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Você será redirecionado para a plataforma segura do parceiro.</p>
              </div>

              {/* Card do Anfitrião (Visível Apenas para Admin) */}
              {me && me.role === 'admin' && anfitriao && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-red-500 mb-2 uppercase">Área Admin</p>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors border border-red-100" onClick={() => navigate(`/anfitriao/${anfitriao.id}`)}>
                    <div className="h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-sm">
                      {anfitriao.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{anfitriao.nome}</p>
                      <p className="text-xs text-gray-600">Ver Perfil Completo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: DETALHE DO PARCEIRO (CLÁSSICO) ---
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
            <Badge className="badge-teal mb-4 text-base px-3 py-1 bg-primary-teal text-white hover:bg-teal-700 border-none">{parceiro.categoria}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 shadow-sm">{parceiro.nome_empresa}</h1>
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
            <Card className="card-custom border-none shadow-md">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{parceiro.descricao}</p>
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
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                      <img src={foto} className="w-full h-full object-cover" alt="Galeria" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-6 sticky top-24">
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