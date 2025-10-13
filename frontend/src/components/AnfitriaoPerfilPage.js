import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AnfitriaoPerfilPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const res = await axios.get(`${API}/usuarios/${id}/perfil-publico`);
                setPerfil(res.data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchPerfil();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center py-20"><div className="spinner"></div></div>;

    if (!perfil) return <div className="text-center py-20">Perfil não encontrado</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <Card className="card-custom mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl text-primary-gray">{perfil.nome}</CardTitle>
                        <CardDescription>
                            <Badge className="badge-teal">{perfil.role}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {perfil.telefone && <p className="text-gray-700 mb-4">📞 {perfil.telefone}</p>}
                        <h3 className="text-xl font-semibold text-primary-gray mb-4">Imóveis de {perfil.nome}</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {perfil.imoveis.map((imovel) => (
                                <Card
                                    key={imovel.id}
                                    className="card-custom hover-lift cursor-pointer"
                                    onClick={() => navigate(`/imovel/${imovel.id}`)}
                                >
                                    {imovel.fotos?.[0] && (
                                        <div className="aspect-video rounded-t-lg overflow-hidden">
                                            <img src={imovel.fotos[0]} alt={imovel.titulo} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-lg text-primary-gray">{imovel.titulo}</CardTitle>
                                        <CardDescription>{imovel.tipo} • {imovel.regiao}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 line-clamp-2">{imovel.descricao}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};