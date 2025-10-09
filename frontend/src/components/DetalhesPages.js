import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // Import this
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Property Details Page (PUBLIC)
export const ImovelDetalhePage = () => {
  const { id } = useParams();
  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImovel = async () => {
      try {
        const response = await axios.get(`${API}/imoveis/${id}`);
        setImovel(response.data);
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
                {imovel.fotos && imovel.fotos.length > 0 && (
                  <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                    <img src={imovel.fotos[0]} alt={imovel.titulo} className="w-full h-auto object-cover" />
                  </div>
                )}
                {imovel.video_url && (
                  <div className="my-8">
                    <h2 className="text-2xl font-bold text-primary-gray mb-4">Vídeo do Imóvel</h2>
                    <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
                      <video
                        src={imovel.video_url}
                        controls
                        className="w-full h-full object-cover"
                        poster={imovel.fotos[0] || ''} // Usa a primeira foto como capa do vídeo
                      >
                        Seu navegador não suporta o player de vídeo.
                      </video>
                    </div>
                  </div>
                )}
                <h3 className="font-semibold text-xl mb-4 text-primary-gray">Sobre este lugar</h3>
                <div className="prose markdown-content">
                  <ReactMarkdown>{imovel.descricao}</ReactMarkdown>
                </div>
              </div>
              <div className="space-y-6">
                <Card className="bg-gray-50 p-6">
                  <h3 className="font-semibold text-lg mb-4 text-primary-gray">Detalhes do Imóvel</h3>
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    <p><strong>Quartos:</strong> {imovel.num_quartos}</p>
                    <p><strong>Banheiros:</strong> {imovel.num_banheiros}</p>
                    <p><strong>Capacidade:</strong> {imovel.capacidade} pessoas</p>
                    {imovel.area_m2 && <p><strong>Área:</strong> {imovel.area_m2} m²</p>}
                  </div>
                </Card>
                <Card className="bg-gray-50 p-6">
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
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-teal">
                    R$ {imovel.preco_diaria} <span className="text-lg font-normal text-gray-600">/ noite</span>
                  </div>
                  <div className="flex space-x-2 mt-4 justify-center">
                    {imovel.link_booking && <Button asChild className="btn-primary"><a href={imovel.link_booking} target="_blank" rel="noopener noreferrer">Reservar no Booking</a></Button>}
                    {imovel.link_airbnb && <Button asChild className="btn-primary"><a href={imovel.link_airbnb} target="_blank" rel="noopener noreferrer">Reservar no Airbnb</a></Button>}
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


// Partner Details Page (PUBLIC)
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
        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="text-3xl text-primary-gray">{parceiro.nome_empresa}</CardTitle>
            <CardDescription>
              <Badge className="badge-teal">{parceiro.categoria}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {parceiro.fotos && parceiro.fotos.length > 0 && (
                  <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                    <img src={parceiro.fotos[0]} alt={parceiro.nome_empresa} className="w-full h-auto object-cover" />
                  </div>
                )}
                {parceiro.video_url && (
                  <div className="my-8">
                    <h2 className="text-2xl font-bold text-primary-gray mb-4">Vídeo do Imóvel</h2>
                    <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
                      <video
                        src={parceiro.video_url}
                        controls
                        className="w-full h-full object-cover"
                      >
                        Seu navegador não suporta o player de vídeo.
                      </video>
                    </div>
                  </div>
                )}
                <h3 className="font-semibold text-xl mb-4 text-primary-gray">Sobre</h3>
                <div className="prose markdown-content">
                  <ReactMarkdown>{parceiro.descricao}</ReactMarkdown>
                </div>
              </div>
              <div className="space-y-6">
                <Card className="bg-gray-50 p-6">
                  <h3 className="font-semibold text-lg mb-4 text-primary-gray">Informações</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Telefone:</strong> {parceiro.telefone}</p>
                    {parceiro.endereco && <p><strong>Endereço:</strong> {parceiro.endereco}</p>}
                    {parceiro.horario_funcionamento && <p><strong>Funcionamento:</strong> {parceiro.horario_funcionamento}</p>}
                    {parceiro.servicos_oferecidos && <p><strong>Serviços:</strong> {parceiro.servicos_oferecidos}</p>}
                  </div>
                </Card>
                <div className="flex space-x-2 justify-center">
                  {parceiro.website && <Button asChild className="btn-primary"><a href={parceiro.website} target="_blank" rel="noopener noreferrer">Website</a></Button>}
                  {parceiro.instagram && <Button asChild className="btn-primary"><a href={parceiro.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></Button>}
                  {parceiro.facebook && <Button asChild className="btn-primary"><a href={parceiro.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};