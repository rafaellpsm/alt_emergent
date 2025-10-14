// src/components/AdminPages.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal, Trash2, UserX, UserCheck, Star, Mail, Edit, PlusCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { toast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import RichTextEditor from './RichTextEditor';
import { PhotoUpload } from './PhotoUpload';
import { VideoUpload } from './VideoUpload'; // <-- Adicionar importação

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

// Formulário para Criar/Editar Notícia
const NoticiaForm = ({ noticia, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        subtitulo: '',
        conteudo: '',
        resumo: '',
        categoria: 'geral',
        destaque: false,
        fotos: [],
        video_url: '',
    });

    useEffect(() => {
        if (noticia) {
            setFormData({
                titulo: noticia.titulo || '',
                subtitulo: noticia.subtitulo || '',
                conteudo: noticia.conteudo || '',
                resumo: noticia.resumo || '',
                categoria: noticia.categoria || 'geral',
                destaque: noticia.destaque || false,
                fotos: noticia.fotos || [],
                video_url: noticia.video_url || '',
            });
        }
    }, [noticia]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, conteudo: content }));
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{noticia ? 'Editar Notícia' : 'Criar Nova Notícia'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                    <form id="noticia-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="titulo">Título</Label>
                            <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="subtitulo">Subtítulo</Label>
                            <Input id="subtitulo" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="resumo">Resumo (para a página principal)</Label>
                            <Textarea id="resumo" name="resumo" value={formData.resumo} onChange={handleChange} rows={3} placeholder="Escreva uma chamada curta e atrativa..." />
                        </div>

                        {/* CAMPO PARA FOTO DE DESTAQUE (CAPA) */}
                        <div>
                            <PhotoUpload
                                photos={formData.fotos}
                                onPhotosChange={(newPhotos) => setFormData(prev => ({ ...prev, fotos: newPhotos }))}
                                maxPhotos={1}
                                label="Foto de Destaque (para o card e topo da página)"
                            />
                        </div>

                        {/* MELHORIA: Usar o componente VideoUpload */}
                        <div>
                            <VideoUpload
                                videoUrl={formData.video_url}
                                onVideoChange={(newUrl) => setFormData(prev => ({ ...prev, video_url: newUrl }))}
                                label="Vídeo de Destaque (Opcional)"
                            />
                        </div>

                        {/* EDITOR DE TEXTO COM UPLOAD DE IMAGEM EMBUTIDO */}
                        <div>
                            <Label>Conteúdo Completo (insira fotos e vídeos da matéria aqui)</Label>
                            <RichTextEditor
                                value={formData.conteudo}
                                onChange={handleContentChange}
                            />
                        </div>

                        <div>
                            <Label htmlFor="categoria">Categoria</Label>
                            <Input id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="destaque" name="destaque" checked={formData.destaque} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, destaque: checked }))} />
                            <Label htmlFor="destaque">Marcar como destaque</Label>
                        </div>
                    </form>
                </div>
                <DialogFooter className="pt-4 border-t flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" form="noticia-form" className="btn-primary">Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- O RESTANTE DO FICHEIRO CONTINUA IGUAL ---
// (Copy and paste the rest of your AdminPages.js file here)

export const AdminConteudoPage = ({ /* ... as props ... */ }) => {
    const [noticias, setNoticias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNoticia, setEditingNoticia] = useState(null);

    const fetchNoticias = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/admin/noticias`);
            setNoticias(response.data);
        } catch (error) {
            toast({ title: "Erro ao carregar notícias", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNoticias(); }, []);

    const handleSave = async (formData) => {
        const isEditing = !!editingNoticia;
        const url = isEditing ? `${API}/admin/noticias/${editingNoticia.id}` : `${API}/admin/noticias`;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios[method](url, formData);
            toast({ title: `Notícia ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
            setIsFormOpen(false);
            setEditingNoticia(null);
            fetchNoticias();
        } catch (error) {
            toast({ title: "Erro ao salvar notícia", variant: "destructive" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja apagar esta notícia?")) return;
        try {
            await axios.delete(`${API}/admin/noticias/${id}`);
            toast({ title: "Notícia apagada com sucesso!" });
            fetchNoticias();
        } catch (error) {
            toast({ title: "Erro ao apagar notícia", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary-gray">Gerir Conteúdo</h1>
                <Button className="btn-primary" onClick={() => { setEditingNoticia(null); setIsFormOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Notícia
                </Button>
            </div>

            {isFormOpen && <NoticiaForm noticia={editingNoticia} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}

            {loading ? <div className="flex justify-center items-center py-20"><div className="spinner"></div></div> : (
                <Card>
                    <Table>
                        <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Autor</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {noticias.map(noticia => (
                                <TableRow key={noticia.id}>
                                    <TableCell>{noticia.titulo}</TableCell>
                                    <TableCell>{noticia.autor_nome}</TableCell>
                                    <TableCell>{formatDate(noticia.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingNoticia(noticia); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(noticia.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

const CandidaturaCard = ({ candidatura, tipo, onAction }) => (
    <Card className="card-custom mb-4">
        <CardHeader>
            <CardTitle>{candidatura.nome}</CardTitle>
            <CardDescription>{candidatura.email} • Enviado em: {formatDate(candidatura.created_at)}</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Detalhes da candidatura aqui */}
            <div className="flex space-x-2 mt-4">
                <Button size="sm" className="btn-primary" onClick={() => onAction(tipo, candidatura.id, 'aprovar')}>Aprovar</Button>
                <Button size="sm" variant="destructive" onClick={() => onAction(tipo, candidatura.id, 'recusar')}>Recusar</Button>
            </div>
        </CardContent>
    </Card>
);

export const AdminCandidaturasPage = () => {
    const [candidaturas, setCandidaturas] = useState({ membros: [], parceiros: [], associados: [] });
    const [loading, setLoading] = useState(true);

    const fetchCandidaturas = async () => {
        setLoading(true);
        try {
            const [membrosRes, parceirosRes, associadosRes] = await Promise.all([
                axios.get(`${API}/admin/candidaturas/membros`),
                axios.get(`${API}/admin/candidaturas/parceiros`),
                axios.get(`${API}/admin/candidaturas/associados`)
            ]);
            setCandidaturas({ membros: membrosRes.data, parceiros: parceirosRes.data, associados: associadosRes.data });
        } catch (error) {
            toast({ title: "Erro ao carregar candidaturas", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCandidaturas(); }, []);

    const handleAction = async (tipo, id, action) => {
        let motivo = '';
        if (action === 'recusar') {
            motivo = prompt('Motivo da recusa (opcional):');
            if (motivo === null) return;
        }
        try {
            await axios.post(`${API}/admin/candidaturas/${tipo}/${id}/${action}`, { motivo });
            toast({ title: `Candidatura ${action === 'aprovar' ? 'aprovada' : 'recusada'}!` });
            fetchCandidaturas();
        } catch (error) {
            toast({ title: `Erro ao ${action} candidatura`, variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Gerir Candidaturas</h1>
            {loading ? <div className="flex justify-center items-center py-20"><div className="spinner"></div></div> : (
                <Tabs defaultValue="membros">
                    <TabsList>
                        <TabsTrigger value="membros">Membros ({candidaturas.membros.length})</TabsTrigger>
                        <TabsTrigger value="parceiros">Parceiros ({candidaturas.parceiros.length})</TabsTrigger>
                        <TabsTrigger value="associados">Associados ({candidaturas.associados.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="membros">
                        {candidaturas.membros.length > 0 ? candidaturas.membros.map(c => <CandidaturaCard key={c.id} candidatura={c} tipo="membro" onAction={handleAction} />) : <p className="text-gray-500 mt-4">Nenhuma candidatura pendente.</p>}
                    </TabsContent>
                    <TabsContent value="parceiros">
                        {candidaturas.parceiros.length > 0 ? candidaturas.parceiros.map(c => <CandidaturaCard key={c.id} candidatura={c} tipo="parceiro" onAction={handleAction} />) : <p className="text-gray-500 mt-4">Nenhuma candidatura pendente.</p>}
                    </TabsContent>
                    <TabsContent value="associados">
                        {candidaturas.associados.length > 0 ? candidaturas.associados.map(c => <CandidaturaCard key={c.id} candidatura={c} tipo="associado" onAction={handleAction} />) : <p className="text-gray-500 mt-4">Nenhuma candidatura pendente.</p>}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'aprovado': return <Badge className="badge-teal">Aprovado</Badge>;
        case 'pendente': return <Badge className="badge-beige">Pendente</Badge>;
        case 'recusado': return <Badge variant="destructive">Recusado</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

export const AdminImoveisPage = () => {
    const [imoveis, setImoveis] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchImoveis = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/admin/imoveis`);
            setImoveis(response.data);
        } catch (error) { toast({ title: "Erro ao carregar imóveis", variant: "destructive" }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchImoveis(); }, []);

    const handleAction = async (id, action) => {
        let motivo = '';
        if (action === 'recusar') {
            motivo = prompt('Motivo da recusa (opcional):');
            if (motivo === null) return;
        }
        try {
            await axios.post(`${API}/admin/imoveis/${id}/${action}`, { motivo });
            toast({ title: `Imóvel ${action === 'aprovar' ? 'aprovado' : 'recusado'}!` });
            fetchImoveis();
        } catch (error) { toast({ title: `Erro ao ${action} imóvel`, variant: "destructive" }); }
    };

    const imoveisPendentes = imoveis.filter(i => i.status_aprovacao === 'pendente');

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Gerir Imóveis</h1>
            {loading ? <div className="flex justify-center items-center py-20"><div className="spinner"></div></div> : (
                <Tabs defaultValue="pendentes">
                    <TabsList>
                        <TabsTrigger value="pendentes">Pendentes ({imoveisPendentes.length})</TabsTrigger>
                        <TabsTrigger value="todos">Todos ({imoveis.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pendentes">
                        {imoveisPendentes.length > 0 ? imoveisPendentes.map(imovel => (
                            <Card key={imovel.id} className="card-custom mb-4">
                                <CardHeader>
                                    <CardTitle>{imovel.titulo}</CardTitle>
                                    <CardDescription>{imovel.tipo} em {imovel.regiao}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-2">
                                        <Button size="sm" className="btn-primary" onClick={() => handleAction(imovel.id, 'aprovar')}>Aprovar</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAction(imovel.id, 'recusar')}>Recusar</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : <p className="text-gray-500 mt-4">Nenhum imóvel pendente.</p>}
                    </TabsContent>
                    <TabsContent value="todos">
                        <Card><Table>
                            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{imoveis.map(imovel => (
                                <TableRow key={imovel.id}>
                                    <TableCell>{imovel.titulo}</TableCell>
                                    <TableCell>{getStatusBadge(imovel.status_aprovacao)}</TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table></Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export const AdminUsuariosPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/admin/users`);
            setUsers(response.data);
        } catch (error) {
            toast({ title: "Erro ao carregar utilizadores", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleToggleActive = async (user) => {
        const action = user.ativo ? 'desativar' : 'reativar';
        if (!window.confirm(`Tem a certeza que deseja ${action} ${user.nome}?`)) return;

        try {
            await axios.put(`${API}/admin/users/${user.id}`, { ativo: !user.ativo });
            toast({ title: `Utilizador ${action} com sucesso!` });
            fetchUsers();
        } catch (error) {
            toast({ title: `Erro ao ${action} utilizador`, variant: "destructive" });
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`ATENÇÃO: Deseja apagar permanentemente ${user.nome}? Esta ação não pode ser desfeita.`)) return;

        try {
            await axios.delete(`${API}/admin/users/${user.id}`);
            toast({ title: "Utilizador apagado com sucesso!" });
            fetchUsers();
        } catch (error) {
            toast({ title: "Erro ao apagar utilizador", description: error.response?.data?.detail, variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Gerir Utilizadores</h1>
            {loading ? <div className="flex justify-center items-center py-20"><div className="spinner"></div></div> : (
                <Card>
                    <Table>
                        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.nome}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell><Badge className="badge-beige">{user.role}</Badge></TableCell>
                                    <TableCell>{user.ativo ? <Badge className="badge-teal">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                                    {user.ativo ? <><UserX className="mr-2 h-4 w-4" />Desativar</> : <><UserCheck className="mr-2 h-4 w-4" />Reativar</>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}><Trash2 className="mr-2 h-4 w-4" />Apagar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

export const AdminDestaquesPage = () => {
    const [imoveis, setImoveis] = useState([]);
    const [parceiros, setParceiros] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [imoveisRes, parceirosRes] = await Promise.all([
                axios.get(`${API}/admin/imoveis`),
                axios.get(`${API}/admin/parceiros`)
            ]);
            setImoveis(imoveisRes.data);
            setParceiros(parceirosRes.data);
        } catch (error) {
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const toggleDestaque = async (type, id, isDestaque) => {
        try {
            await axios.put(`${API}/admin/${type}/${id}/destaque`, null, { params: { destaque: !isDestaque } });
            toast({ title: `Destaque atualizado!` });
            fetchData();
        } catch (error) {
            toast({ title: "Erro ao atualizar destaque", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Gerir Destaques</h1>
            {loading ? <div className="flex justify-center items-center py-20"><div className="spinner"></div></div> : (
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader><CardTitle>Imóveis</CardTitle></CardHeader>
                        <CardContent>
                            {imoveis.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                    <span>{item.titulo}</span>
                                    <Button variant={item.destaque ? "default" : "outline"} size="sm" onClick={() => toggleDestaque('imoveis', item.id, item.destaque)}>
                                        <Star className={`h-4 w-4 ${item.destaque ? 'text-yellow-400' : ''}`} />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Parceiros</CardTitle></CardHeader>
                        <CardContent>
                            {parceiros.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                    <span>{item.nome_empresa}</span>
                                    <Button variant={item.destaque ? "default" : "outline"} size="sm" onClick={() => toggleDestaque('parceiros', item.id, item.destaque)}>
                                        <Star className={`h-4 w-4 ${item.destaque ? 'text-yellow-400' : ''}`} />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export const AdminComunicacaoPage = () => {
    const [formData, setFormData] = useState({ assunto: '', mensagem: '', destinatarios: [] });
    const [loading, setLoading] = useState(false);

    const handleCheckboxChange = (role, checked) => {
        setFormData(prev => {
            const destinatarios = checked
                ? [...prev.destinatarios, role]
                : prev.destinatarios.filter(r => r !== role);
            return { ...prev, destinatarios };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.destinatarios.length === 0) {
            toast({ title: "Selecione pelo menos um destinatário", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API}/admin/email-massa`, formData);
            toast({ title: "Email enviado!", description: `${response.data.destinatarios} emails estão a ser processados.` });
            setFormData({ assunto: '', mensagem: '', destinatarios: [] });
        } catch (error) {
            toast({ title: "Erro ao enviar email", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const roles = ['membro', 'parceiro', 'associado', 'admin', 'todos'];

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-primary-gray mb-8">Comunicação</h1>
            <Card className="max-w-3xl mx-auto">
                <CardHeader><CardTitle>Enviar Email em Massa</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Destinatários</Label>
                            <div className="flex flex-wrap gap-4 mt-2">
                                {roles.map(role => (
                                    <div key={role} className="flex items-center space-x-2">
                                        <Checkbox id={role} checked={formData.destinatarios.includes(role)} onCheckedChange={checked => handleCheckboxChange(role, checked)} />
                                        <label htmlFor={role} className="capitalize">{role}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="assunto">Assunto</Label>
                            <Input id="assunto" value={formData.assunto} onChange={e => setFormData({ ...formData, assunto: e.target.value })} required />
                        </div>
                        <div>
                            <Label htmlFor="mensagem">Mensagem</Label>
                            <Textarea id="mensagem" rows={10} value={formData.mensagem} onChange={e => setFormData({ ...formData, mensagem: e.target.value })} required />
                        </div>
                        <Button type="submit" className="btn-primary w-full" disabled={loading}>
                            <Mail className="mr-2 h-4 w-4" /> {loading ? 'A enviar...' : 'Enviar Email'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};