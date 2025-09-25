import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Application Forms with more fields
export const CandidaturaMembroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    num_imoveis: 1,
    link_imovel: '',
    experiencia_locacao: '',
    renda_mensal_estimada: '',
    possui_alvara: false,
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/membro`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        num_imoveis: 1,
        link_imovel: '',
        experiencia_locacao: '',
        renda_mensal_estimada: '',
        possui_alvara: false,
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-primary-gray">
            Candidatura para Membro
          </h1>
          
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-primary-gray">Informações Detalhadas do Candidato</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como membro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="form-label">Nome Completo *</Label>
                    <Input
                      id="nome"
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="membro-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="form-label">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="membro-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="form-label">Telefone *</Label>
                    <Input
                      id="telefone"
                      className="form-input"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      placeholder="(11) 99999-9999"
                      data-testid="membro-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="num_imoveis" className="form-label">Número de Imóveis *</Label>
                    <Input
                      id="num_imoveis"
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.num_imoveis}
                      onChange={(e) => setFormData({...formData, num_imoveis: parseInt(e.target.value)})}
                      required
                      data-testid="membro-num-imoveis-input"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="endereco" className="form-label">Endereço dos Imóveis *</Label>
                  <Textarea
                    id="endereco"
                    className="form-input"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    required
                    placeholder="Endereço completo dos imóveis em Ilhabela"
                    data-testid="membro-endereco-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="link_imovel" className="form-label">Link do Imóvel (Airbnb/Booking/Site)</Label>
                  <Input
                    id="link_imovel"
                    type="url"
                    className="form-input"
                    value={formData.link_imovel}
                    onChange={(e) => setFormData({...formData, link_imovel: e.target.value})}
                    placeholder="https://www.airbnb.com/rooms/..."
                    data-testid="membro-link-input"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experiencia_locacao" className="form-label">Tempo de Experiência com Locação</Label>
                    <Select 
                      value={formData.experiencia_locacao} 
                      onValueChange={(value) => setFormData({...formData, experiencia_locacao: value})}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante (menos de 1 ano)</SelectItem>
                        <SelectItem value="1-3anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5anos">3 a 5 anos</SelectItem>
                        <SelectItem value="5+anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="renda_mensal_estimada" className="form-label">Renda Mensal Estimada (R$)</Label>
                    <Input
                      id="renda_mensal_estimada"
                      type="number"
                      className="form-input"
                      value={formData.renda_mensal_estimada}
                      onChange={(e) => setFormData({...formData, renda_mensal_estimada: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="possui_alvara"
                    checked={formData.possui_alvara}
                    onChange={(e) => setFormData({...formData, possui_alvara: e.target.checked})}
                    className="rounded focus-teal"
                  />
                  <Label htmlFor="possui_alvara" className="form-label mb-0">
                    Possuo alvará de funcionamento para locação por temporada
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor="mensagem" className="form-label">Mensagem Adicional</Label>
                  <Textarea
                    id="mensagem"
                    className="form-input"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos um pouco sobre você, seus imóveis e por que deseja se juntar à ALT..."
                    rows={4}
                    data-testid="membro-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 btn-primary"
                    data-testid="membro-submit-btn"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="spinner w-4 h-4"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      'Enviar Candidatura'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="membro-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Candidatura Parceiro Page
export const CandidaturaParceiroPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nome_empresa: '',
    categoria: '',
    website: '',
    link_empresa: '',
    cnpj: '',
    tempo_operacao: '',
    servicos_oferecidos: '',
    capacidade_atendimento: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/parceiro`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        nome_empresa: '',
        categoria: '',
        website: '',
        link_empresa: '',
        cnpj: '',
        tempo_operacao: '',
        servicos_oferecidos: '',
        capacidade_atendimento: '',
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-primary-gray">
            Candidatura para Parceiro
          </h1>
          
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-primary-gray">Informações Detalhadas da Empresa</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como parceiro da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="form-label">Nome do Responsável *</Label>
                    <Input
                      id="nome"
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="parceiro-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="form-label">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="parceiro-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="form-label">Telefone *</Label>
                    <Input
                      id="telefone"
                      className="form-input"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      data-testid="parceiro-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cnpj" className="form-label">CNPJ</Label>
                    <Input
                      id="cnpj"
                      className="form-input"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="nome_empresa" className="form-label">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    className="form-input"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                    required
                    data-testid="parceiro-empresa-input"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria" className="form-label">Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData({...formData, categoria: value})}
                    >
                      <SelectTrigger className="form-input" data-testid="parceiro-categoria-select">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurante">Restaurante</SelectItem>
                        <SelectItem value="turismo">Turismo</SelectItem>
                        <SelectItem value="transporte">Transporte</SelectItem>
                        <SelectItem value="esportes">Esportes Náuticos</SelectItem>
                        <SelectItem value="comercio">Comércio Local</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="hospedagem">Hospedagem</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tempo_operacao" className="form-label">Tempo de Operação</Label>
                    <Select 
                      value={formData.tempo_operacao} 
                      onValueChange={(value) => setFormData({...formData, tempo_operacao: value})}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Menos de 1 ano</SelectItem>
                        <SelectItem value="1-3anos">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5anos">3 a 5 anos</SelectItem>
                        <SelectItem value="5+anos">Mais de 5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website" className="form-label">Website da Empresa</Label>
                    <Input
                      id="website"
                      type="url"
                      className="form-input"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://www.exemplo.com"
                      data-testid="parceiro-website-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_empresa" className="form-label">Link Adicional (Instagram/Facebook)</Label>
                    <Input
                      id="link_empresa"
                      type="url"
                      className="form-input"
                      value={formData.link_empresa}
                      onChange={(e) => setFormData({...formData, link_empresa: e.target.value})}
                      placeholder="https://www.instagram.com/..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="servicos_oferecidos" className="form-label">Serviços Oferecidos</Label>
                  <Textarea
                    id="servicos_oferecidos"
                    className="form-input"
                    value={formData.servicos_oferecidos}
                    onChange={(e) => setFormData({...formData, servicos_oferecidos: e.target.value})}
                    placeholder="Descreva os principais serviços que sua empresa oferece..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="capacidade_atendimento" className="form-label">Capacidade de Atendimento</Label>
                  <Input
                    id="capacidade_atendimento"
                    className="form-input"
                    value={formData.capacidade_atendimento}
                    onChange={(e) => setFormData({...formData, capacidade_atendimento: e.target.value})}
                    placeholder="Ex: 50 pessoas por dia, 20 mesas, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="mensagem" className="form-label">Por que deseja ser parceiro?</Label>
                  <Textarea
                    id="mensagem"
                    className="form-input"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Conte-nos sobre sua empresa e como pode contribuir com o turismo em Ilhabela..."
                    rows={4}
                    data-testid="parceiro-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.categoria}
                    className="flex-1 btn-primary"
                    data-testid="parceiro-submit-btn"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="spinner w-4 h-4"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      'Enviar Candidatura'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="parceiro-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Candidatura Associado Page  
export const CandidaturaAssociadoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    ocupacao: '',
    empresa_trabalho: '',
    linkedin: '',
    motivo_interesse: '',
    contribuicao_pretendida: '',
    disponibilidade: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/candidaturas/associado`, formData);
      toast({
        title: "Candidatura enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      // Reset form
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        ocupacao: '',
        empresa_trabalho: '',
        linkedin: '',
        motivo_interesse: '',
        contribuicao_pretendida: '',
        disponibilidade: '',
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.response?.data?.detail || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-primary-gray">
            Candidatura para Associado
          </h1>
          
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-primary-gray">Informações Detalhadas do Candidato</CardTitle>
              <CardDescription>
                Preencha todas as informações para se candidatar como associado da ALT Ilhabela
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="form-label">Nome Completo *</Label>
                    <Input
                      id="nome"
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      data-testid="associado-nome-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="form-label">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="associado-email-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="form-label">Telefone *</Label>
                    <Input
                      id="telefone"
                      className="form-input"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      required
                      data-testid="associado-telefone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ocupacao" className="form-label">Ocupação *</Label>
                    <Input
                      id="ocupacao"
                      className="form-input"
                      value={formData.ocupacao}
                      onChange={(e) => setFormData({...formData, ocupacao: e.target.value})}
                      required
                      placeholder="Ex: Advogado, Empresário, Aposentado..."
                      data-testid="associado-ocupacao-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empresa_trabalho" className="form-label">Empresa onde Trabalha</Label>
                    <Input
                      id="empresa_trabalho"
                      className="form-input"
                      value={formData.empresa_trabalho}
                      onChange={(e) => setFormData({...formData, empresa_trabalho: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="linkedin" className="form-label">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      className="form-input"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="motivo_interesse" className="form-label">Por que deseja ser associado? *</Label>
                  <Textarea
                    id="motivo_interesse"
                    className="form-input"
                    value={formData.motivo_interesse}
                    onChange={(e) => setFormData({...formData, motivo_interesse: e.target.value})}
                    required
                    placeholder="Explique sua motivação para apoiar a ALT Ilhabela..."
                    rows={4}
                    data-testid="associado-motivo-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contribuicao_pretendida" className="form-label">Como pretende contribuir?</Label>
                  <Textarea
                    id="contribuicao_pretendida"
                    className="form-input"
                    value={formData.contribuicao_pretendida}
                    onChange={(e) => setFormData({...formData, contribuicao_pretendida: e.target.value})}
                    placeholder="Descreva como pode contribuir com a associação..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="disponibilidade" className="form-label">Disponibilidade para Atividades</Label>
                  <Select 
                    value={formData.disponibilidade} 
                    onValueChange={(value) => setFormData({...formData, disponibilidade: value})}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="Selecione sua disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta - Disponível frequentemente</SelectItem>
                      <SelectItem value="media">Média - Disponível esporadicamente</SelectItem>
                      <SelectItem value="baixa">Baixa - Disponível raramente</SelectItem>
                      <SelectItem value="eventos">Apenas para eventos especiais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="mensagem" className="form-label">Mensagem Adicional</Label>
                  <Textarea
                    id="mensagem"
                    className="form-input"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                    placeholder="Informações adicionais que gostaria de compartilhar..."
                    rows={3}
                    data-testid="associado-mensagem-input"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 btn-primary"
                    data-testid="associado-submit-btn"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="spinner w-4 h-4"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      'Enviar Candidatura'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    data-testid="associado-voltar-btn"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};