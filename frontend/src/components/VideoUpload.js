import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const VideoUpload = ({ videoUrl, onVideoChange, label = "Vídeo" }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validação de tipo e tamanho (ex: 50MB)
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Tipo de ficheiro não permitido",
                description: "Por favor, envie um vídeo MP4, MOV, AVI ou MKV.",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB
            toast({
                title: "Ficheiro muito grande",
                description: "O vídeo não pode exceder 50MB.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API}/upload/video`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const newVideoUrl = `${BACKEND_URL}${response.data.url}`;
            onVideoChange(newVideoUrl);

            toast({ title: "Vídeo enviado com sucesso!" });
        } catch (error) {
            toast({
                title: "Erro no upload do vídeo",
                description: error.response?.data?.detail || "Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const removeVideo = () => {
        onVideoChange(''); // Limpa a URL do vídeo
        toast({ title: "Vídeo removido" });
    };

    return (
        <div className="space-y-4">
            <label className="form-label">{label}</label>

            {!videoUrl ? (
                <div>
                    <input
                        type="file"
                        accept=".mp4,.mov,.avi,.mkv"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="video-upload"
                    />
                    <label htmlFor="video-upload">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full cursor-pointer"
                            disabled={uploading}
                            asChild
                        >
                            <span>
                                {uploading ? (
                                    <>
                                        <div className="spinner w-4 h-4 mr-2"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    'Adicionar Vídeo'
                                )}
                            </span>
                        </Button>
                    </label>
                </div>
            ) : (
                <div className="relative">
                    <video src={videoUrl} controls className="w-full rounded-md" />
                    <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeVideo}
                        type="button"
                    >
                        Remover Vídeo
                    </Button>
                </div>
            )}

            <div className="text-xs text-gray-500">
                <p>• Formatos aceites: MP4, MOV, AVI, MKV</p>
                <p>• Tamanho máximo: 50MB</p>
            </div>
        </div>
    );
};

export default VideoUpload;