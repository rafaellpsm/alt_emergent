import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const RecuperarSenhaModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/recuperar-senha`, { email });
      
      setEnviado(true);
      toast({
        title: "Email enviado!",
        description: "Se o email estiver cadastrado, você receberá instruções de recuperação.",
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setLoading(false);
    setEnviado(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="text-xl text-center text-primary-gray">
              {enviado ? '📧 Email Enviado' : '🔑 Recuperar Senha'}
            </CardTitle>
            <CardDescription className="text-center">
              {enviado 
                ? 'Verifique sua caixa de entrada'
                : 'Digite seu email para receber uma nova senha'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!enviado ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email-recuperacao" className="form-label">Email *</Label>
                  <Input
                    id="email-recuperacao"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Digite seu email cadastrado"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner w-4 h-4 mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Nova Senha'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="w-full"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✅ Solicitação processada com sucesso!
                  </p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Próximos passos:</strong></p>
                  <p>1. Verifique sua caixa de entrada (e spam)</p>
                  <p>2. Use a nova senha para fazer login</p>
                  <p>3. Altere para uma senha de sua preferência</p>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full btn-primary"
                >
                  Entendido
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecuperarSenhaModal;
