import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 10, label = "Fotos" }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Limite excedido",
        description: `Você só pode enviar até ${maxPhotos} fotos.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newPhotos = [...photos];

    try {
      // Upload de cada arquivo sequencialmente
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/upload/foto`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // --- AQUI ESTAVA O PROBLEMA ---
        // Antes pegávamos response.data.filename
        // Agora pegamos response.data.url (O link do Cloudinary)
        if (response.data && response.data.url) {
          newPhotos.push(response.data.url);
        }
      }

      onPhotosChange(newPhotos);
      toast({ title: "Fotos enviadas com sucesso!" });

    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar algumas imagens.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async (indexToRemove) => {
    const photoUrl = photos[indexToRemove];

    // Tenta remover do backend (opcional, mas limpa o Cloudinary)
    try {
      // Extrai o nome do arquivo da URL para enviar ao backend
      // Ex: .../alt_ilhabela/fotos/abc.jpg -> abc.jpg
      const filename = photoUrl.split('/').pop();
      await axios.delete(`${API}/upload/foto/${filename}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.warn("Não foi possível apagar do servidor, removendo apenas da lista.");
    }

    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <Label className="form-label">{label} ({photos.length}/{maxPhotos})</Label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border">
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Remover foto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-32 md:h-auto aspect-video">
            <div className="flex flex-col items-center text-gray-500">
              {uploading ? (
                <div className="spinner w-6 h-6 mb-2"></div>
              ) : (
                <Upload className="h-8 w-8 mb-2" />
              )}
              <span className="text-xs text-center px-2">
                {uploading ? "Enviando..." : "Adicionar Fotos"}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;