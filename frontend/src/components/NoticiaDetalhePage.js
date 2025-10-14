// src/components/NoticiaDetalhePage.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const NoticiaDetalhePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [noticia, setNoticia] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNoticia = async () => {
            try {
                const response = await axios.get(`${API}/noticias/${id}`);
                setNoticia(response.data);
            } catch (error) {
                toast({
                    title: "Erro ao carregar notícia",
                    description: "A notícia não foi encontrada ou está indisponível.",
                    variant: "destructive",
                });
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchNoticia();
    }, [id, navigate]);

    if (loading) {
        return <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>;
    }

    if (!noticia) {
        return <div className="text-center py-20"><h1 className="text-2xl">Notícia não encontrada</h1></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <Card className="card-custom">
                    <CardHeader className="text-center">
                        <Badge className="badge-teal mb-4 mx-auto">{noticia.categoria || 'Geral'}</Badge>
                        <CardTitle className="text-4xl font-bold text-primary-gray">{noticia.titulo}</CardTitle>
                        {noticia.subtitulo && <p className="text-xl text-gray-500 mt-2">{noticia.subtitulo}</p>}
                        <CardDescription className="flex justify-center items-center space-x-4 mt-4 text-sm text-gray-600">
                            <span className="flex items-center"><User className="mr-2 h-4 w-4" /> Por {noticia.autor_nome}</span>
                            <span className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> {new Date(noticia.created_at).toLocaleDateString('pt-BR')}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-8">
                        {/* Exibe a imagem de destaque no topo da notícia */}
                        {noticia.fotos && noticia.fotos.length > 0 && (
                            <div className="mb-8">
                                <img
                                    src={noticia.fotos[0]}
                                    alt={noticia.titulo}
                                    className="rounded-lg w-full h-auto object-cover shadow-lg mx-auto"
                                    style={{ maxHeight: '500px' }}
                                />
                            </div>
                        )}

                        {/* Renderiza o conteúdo HTML do editor de Rich Text */}
                        <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: noticia.conteudo }} />

                        {/* Exibe o vídeo, se houver */}
                        {noticia.video_url && (
                            <div className="my-8">
                                <h2 className="text-2xl font-bold text-primary-gray mb-4 text-center">Vídeo</h2>
                                <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
                                    <video
                                        src={noticia.video_url}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={noticia.fotos?.[0] || ''}
                                    >
                                        Seu navegador não suporta o player de vídeo.
                                    </video>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
};