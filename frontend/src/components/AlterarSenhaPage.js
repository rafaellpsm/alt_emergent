import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component
const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.log('Error fetching user info');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
  };

  return (
    <header className="header-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">ALT Ilhabela</h1>
          <span className="text-sm opacity-90 hidden md:block">Associação de Locação por Temporada</span>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm hidden sm:block">
              Olá, {user.nome} 
              <Badge className="ml-2 bg-white/20">{user.role}</Badge>
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="text-white border-white/50 hover:bg-white hover:text-gray-800 transition-all"
            >
              Sair
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

// Navigation for logged-in users
const Navigation = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        console.log('Navigation: User not logged in');
      }
    };
    fetchUser();
  }, []);
  
  if (!user) return null;
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex space-x-2 md:space-x-8 overflow-x-auto">
          <a 
            href="/main" 
            className="nav-link py-3 px-3 whitespace-nowrap"
          >
            Início
          </a>
          
          {user.role === 'admin' && (
            <>
              <a href="/admin/dashboard" className="nav-link py-3 px-3 whitespace-nowrap">Dashboard</a>
              <a href="/admin/candidaturas" className="nav-link py-3 px-3 whitespace-nowrap">Candidaturas</a>
              <a href="/admin/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Imóveis</a>
              <a href="/admin/usuarios" className="nav-link py-3 px-3 whitespace-nowrap">Usuários</a>
              <a href="/admin/conteudo" className="nav-link py-3 px-3 whitespace-nowrap">Conteúdo</a>
              <a href="/admin/comunicacao" className="nav-link py-3 px-3 whitespace-nowrap">Comunicação</a>
            </>
          )}
          
          {user.role === 'membro' && (
            <>
              <a href="/meus-imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Meus Imóveis</a>
              <a href="/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Todos os Imóveis</a>
            </>
          )}
          
          {user.role === 'parceiro' && (
            <>
              <a href="/meu-perfil" className="nav-link py-3 px-3 whitespace-nowrap">Meu Perfil</a>
              <a href="/imoveis" className="nav-link py-3 px-3 whitespace-nowrap">Imóveis</a>
            </>
          )}
          
          <a href="/parceiros" className="nav-link py-3 px-3 whitespace-nowrap">Parceiros</a>
          <a href="/alterar-senha" className="nav-link py-3 px-3 whitespace-nowrap">Alterar Senha</a>
        </div>
      </div>
    </nav>
  );
};

// Página de Alteração de Senha
export const AlterarSenhaPage = () => {
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.log('Error fetching user info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (formData.novaSenha !== formData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (formData.novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.put(`${API}/auth/alterar-senha`, {
        senhaAtual: formData.senhaAtual,
        novaSenha: formData.novaSenha
      });

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada. Faça login novamente.",
      });

      // Limpar formulário
      setFormData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });

      // Logout após 2 segundos
      setTimeout(() => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.response?.data?.detail || "Verifique se a senha atual está correta.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary-gray">Alterar Senha</CardTitle>
              <CardDescription className="text-center">
                {user && (
                  <span>Alterando senha para: <strong>{user.email}</strong></span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="senhaAtual" className="form-label">Senha Atual *</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    className="form-input"
                    value={formData.senhaAtual}
                    onChange={(e) => setFormData({...formData, senhaAtual: e.target.value})}
                    required
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div>
                  <Label htmlFor="novaSenha" className="form-label">Nova Senha *</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    className="form-input"
                    value={formData.novaSenha}
                    onChange={(e) => setFormData({...formData, novaSenha: e.target.value})}
                    required
                    placeholder="Digite sua nova senha"
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmarSenha" className="form-label">Confirmar Nova Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    className="form-input"
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                    required
                    placeholder="Digite novamente a nova senha"
                    minLength={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/main'}
                >
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dicas de Segurança */}
          <Card className="card-custom mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-primary-gray">Dicas de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Use pelo menos 6 caracteres</p>
                <p>• Combine letras maiúsculas e minúsculas</p>
                <p>• Inclua números e símbolos</p>
                <p>• Não use informações pessoais</p>
                <p>• Não compartilhe sua senha</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlterarSenhaPage;
