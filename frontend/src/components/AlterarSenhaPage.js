import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    <div className="min-h-screen bg-gray-50 pt-20">
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
                    onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
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