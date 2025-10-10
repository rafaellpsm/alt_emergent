import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Componente de Cabeçalho de Página reutilizável.
 * @param {object} props
 * @param {string} props.title - O título a ser exibido no cabeçalho.
 * @param {boolean} [props.showBackButton=true] - Se o botão de voltar deve ser exibido.
 * @param {React.ReactNode} [props.children] - Elementos extras a serem exibidos à direita (ex: botões de ação).
 */
const PageHeader = ({ title, showBackButton = true, children }) => {
    const navigate = useNavigate();

    return (
        // A CORREÇÃO ESTÁ NESTA LINHA: adicionámos "gap-4" para garantir um espaçamento
        <div className="flex justify-between items-center gap-4 mb-8">
            <div className="flex items-center space-x-4">
                {showBackButton && (
                    <Button variant="outline" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                )}
                <h1 className="text-3xl font-bold text-primary-gray truncate">{title}</h1>
            </div>
            {/* Espaço para botões de ação, se houver */}
            <div className="flex items-center space-x-2">
                {children}
            </div>
        </div>
    );
};

export default PageHeader;