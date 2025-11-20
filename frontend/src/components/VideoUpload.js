import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { X, Upload, Video } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const VideoUpload = ({ videoUrl, onVideoChange, label = "Vídeo" }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limite de tamanho (ex: 100MB)
        if (file.size > 100 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "O vídeo deve ter no máximo 100MB.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API}/upload/video`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // CORREÇÃO: Usar a URL completa retornada pelo Cloudinary
            if (response.data && response.data.url) {
                onVideoChange(response.data.url);
                toast({ title: "Vídeo enviado com sucesso!" });
            }

        } catch (error) {
            console.error("Erro no upload:", error);
            toast({
                title: "Erro no upload",
                description: "Falha ao enviar o vídeo. Tente um arquivo menor.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveVideo = () => {
        onVideoChange('');
    };

    return (
        <div className="space-y-4">
            <Label className="form-label">{label}</Label>

            {videoUrl ? (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border aspect-video max-w-md">
                    <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        title="Remover vídeo"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-40 max-w-md bg-white">
                    <div className="flex flex-col items-center text-gray-500">
                        {uploading ? (
                            <div className="spinner w-8 h-8 mb-3"></div>
                        ) : (
                            <Video className="h-10 w-10 mb-3 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">
                            {uploading ? "Enviando vídeo..." : "Clique para fazer upload do vídeo"}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">MP4, WebM (Máx 100MB)</span>
                    </div>
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    );
};