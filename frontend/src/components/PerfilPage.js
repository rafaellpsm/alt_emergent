import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PerfilPage = () => {
    const [user, setUser] = useState(null);
    const [descricao, setDescricao] = useState("");
    const [foto, setFoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const res = await axios.get(`${API}/auth/me`);
                setUser(res.data);
                setDescricao(res.data.descricao || "");
                setPreview(res.data.foto_url || null);
            } catch (err) {
                toast({ title: "Erro ao carregar perfil", variant: "destructive" });
            }
        };
        fetchPerfil();
    }, []);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSalvar = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("descricao", descricao);
            if (foto) formData.append("foto", foto);

            await axios.put(`${API}/usuarios/${user.id}/perfil`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({ title: "Perfil atualizado com sucesso!" });
            navigate(0);
        } catch (err) {
            toast({
                title: "Erro ao atualizar perfil",
                description: err.response?.data?.detail || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <Card className="card-custom">
                    <CardHeader>
                        <CardTitle className="text-3xl text-primary-gray">Meu Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <img
                                    src={preview || "https://via.placeholder.com/150"}
                                    alt="Foto de perfil"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-teal shadow"
                                />
                                <label className="absolute bottom-0 right-0 bg-primary-teal text-white text-xs rounded-full px-2 py-1 cursor-pointer">
                                    Alterar
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                                </label>
                            </div>
                            <h2 className="text-xl font-semibold mt-4 text-primary-gray">{user.nome}</h2>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Descrição</label>
                            <Textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={4}
                                placeholder="Fale um pouco sobre você ou sobre sua hospedagem..."
                            />
                        </div>

                        <Button className="btn-primary w-full" onClick={handleSalvar} disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
