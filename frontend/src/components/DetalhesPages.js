import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, X, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente de Galeria Simples
const ImageGallery = ({ photos, title }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {/* Foto Principal (Capa) */}
      <div
        className="rounded-lg overflow-hidden shadow-lg cursor-pointer hover:opacity-95 transition-opacity aspect-video bg-gray-100"
        onClick={() => setSelectedImage(photos[0])}
      >
        <img src={photos[0]} alt={`${title} - Capa`} className="w-full h-full object-cover" />
      </div>

      {/* Grid das outras fotos */}
      {photos.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.slice(1).map((photo, index) => (
            <div
              key={index}
              className="rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity aspect-video bg-gray-100"
              onClick={() => setSelectedImage(photo)}
            >
              <img src={photo} alt={`${title} - ${index + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização (Lightbox) */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Visualização em tela cheia"
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Evita fechar se clicar na imagem
          />
        </div>
      )}
    </div>
  );
};

// Property Details Page (PUBLIC)
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
        toast({
          title: "Erro ao carregar imóvel",
          description: "Imóvel não encontrado ou indisponível.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchImovel();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!imovel) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl">Imóvel não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="text-3xl text-primary-gray">{imovel.titulo}</CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <Badge className="badge-teal">{imovel.tipo}</Badge>
              <span>•</span>
              <span>{imovel.regiao}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {/* GALERIA DE FOTOS SUBSTITUI A IMAGEM ÚNICA */}
                <ImageGallery photos={imovel.fotos} title={imovel.titulo} />

                {imovel.video_url && (
                  <div className="my-8">
                    <h2 className="text-2xl font-bold text-primary-gray mb-4">Vídeo do Imóvel</h2>
                    <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black">
                      <video
                        src={imovel.video_url}
                        controls
                        className="w-full h-full object-contain"
                        poster={imovel.fotos[0] || ''}
                      >
                        Seu navegador não suporta o player de vídeo.
                      </video>
                    </div>
                  </div>
                )}
                <h3 className="font-semibold text-xl mb-4 text-primary-gray">Sobre este lugar</h3>
                <div className="prose markdown-content text-gray-700">
                  <ReactMarkdown>{imovel.descricao}</ReactMarkdown>
                </div>
              </div>
              <div className="space-y-6">
                <Card className="bg-gray-50 p-6 border-none shadow-inner">
                  <h3 className="font-semibold text-lg mb-4 text-primary-gray">Detalhes do Imóvel</h3>
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    <p><strong>Quartos:</strong> {imovel.num_quartos}</p>
                    <p><strong>Banheiros:</strong> {imovel.num_banheiros}</p>
                    <p><strong>Capacidade:</strong> {imovel.capacidade} pessoas</p>
                    {imovel.area_m2 && <p><strong>Área:</strong> {imovel.area_m2} m²</p>}
                  </div>
                </Card>
                <Card className="bg-gray-50 p-6 border-none shadow-inner">
                  <h3 className="font-semibold text-lg mb-4 text-primary-gray">Comodidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {imovel.possui_piscina && <Badge className="badge-beige">Piscina</Badge>}
                    {imovel.possui_churrasqueira && <Badge className="badge-beige">Churrasqueira</Badge>}
                    {imovel.possui_wifi && <Badge className="badge-beige">Wi-Fi</Badge>}
                    {imovel.permite_pets && <Badge className="badge-beige">Aceita Pets</Badge>}
                    {imovel.tem_vista_mar && <Badge className="badge-beige">Vista para o Mar</Badge>}
                    {imovel.tem_ar_condicionado && <Badge className="badge-beige">Ar Condicionado</Badge>}
                  </div>
                </Card>
                <div className="text-center p-6 bg-primary-teal/5 rounded-lg border border-primary-teal/20">
                  <div className="text-3xl font-bold text-primary-teal">
                    R$ {imovel.preco_diaria} <span className="text-lg font-normal text-gray-600">/ noite</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-6">
                    {imovel.link_booking && <Button asChild className="w-full btn-primary"><a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">Reservar no Booking</a></Button>}
                    {imovel.link_airbnb && <Button asChild variant="outline" className="w-full border-primary-teal text-primary-teal hover:bg-primary-teal hover:text-white"><a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">Reservar no Airbnb</a></Button>}
                  </div>
                </div>
              </div>
            </div>
            {anfitriao && (
              <Card className="bg-white border shadow-sm p-6 mt-8">
                <h3 className="font-semibold text-lg mb-4 text-primary-gray">Anfitrião</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-bold text-primary-gray">{anfitriao.nome}</p>
                    {anfitriao.telefone && <p className="text-gray-600 mt-1">📞 {anfitriao.telefone}</p>}
                  </div>
                  <Button
                    onClick={() => navigate(`/anfitriao/${anfitriao.id}`)}
                    variant="ghost"
                    className="mt-4 sm:mt-0 hover:bg-gray-100"
                  >
                    Ver perfil público <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


// Partner Details Page (PUBLIC)
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
        toast({
          title: "Erro ao carregar parceiro",
          description: "Parceiro não encontrado ou indisponível.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchParceiro();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!parceiro) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl">Parceiro não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card className="card-custom">
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl text-primary-gray">{parceiro.nome_empresa}</CardTitle>
                <CardDescription className="mt-2">
                  <Badge className="badge-teal text-sm px-3 py-1">{parceiro.categoria}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {/* GALERIA DE FOTOS TAMBÉM PARA PARCEIROS */}
                <ImageGallery photos={parceiro.fotos} title={parceiro.nome_empresa} />

                {parceiro.video_url && (
                  <div className="my-8">
                    <h2 className="text-2xl font-bold text-primary-gray mb-4">Vídeo de Apresentação</h2>
                    <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black">
                      <video
                        src={parceiro.video_url}
                        controls
                        className="w-full h-full object-contain"
                      >
                        Seu navegador não suporta o player de vídeo.
                      </video>
                    </div>
                  </div>
                )}
                <h3 className="font-semibold text-xl mb-4 text-primary-gray">Sobre</h3>
                <div className="prose markdown-content text-gray-700">
                  <ReactMarkdown>{parceiro.descricao}</ReactMarkdown>
                </div>
              </div>
              <div className="space-y-6">
                <Card className="bg-gray-50 p-6 border-none shadow-inner">
                  <h3 className="font-semibold text-lg mb-4 text-primary-gray">Informações de Contato</h3>
                  <div className="space-y-4 text-gray-700">
                    <p className="flex items-center gap-2"><span className="font-bold min-w-[80px]">Telefone:</span> {parceiro.telefone}</p>
                    {parceiro.whatsapp && <p className="flex items-center gap-2"><span className="font-bold min-w-[80px]">WhatsApp:</span> {parceiro.whatsapp}</p>}
                    {parceiro.endereco && <p className="flex items-start gap-2"><span className="font-bold min-w-[80px]">Endereço:</span> <span>{parceiro.endereco}</span></p>}
                    {parceiro.horario_funcionamento && <p className="flex items-start gap-2"><span className="font-bold min-w-[80px]">Horário:</span> <span>{parceiro.horario_funcionamento}</span></p>}
                  </div>
                </Card>

                {parceiro.servicos_oferecidos && (
                  <Card className="bg-gray-50 p-6 border-none shadow-inner">
                    <h3 className="font-semibold text-lg mb-4 text-primary-gray">Serviços Oferecidos</h3>
                    <p className="text-gray-700 whitespace-pre-line">{parceiro.servicos_oferecidos}</p>
                  </Card>
                )}

                <div className="flex flex-col gap-3">
                  {parceiro.website && <Button asChild className="w-full btn-primary"><a href={parceiro.website} target="_blank" rel="noopener noreferrer">Visitar Website</a></Button>}
                  <div className="flex gap-3">
                    {parceiro.instagram && <Button asChild variant="outline" className="flex-1"><a href={parceiro.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></Button>}
                    {parceiro.facebook && <Button asChild variant="outline" className="flex-1"><a href={parceiro.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};