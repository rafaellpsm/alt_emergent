import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 10, label = "Fotos" }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length + photos.length > maxPhotos) {
      toast({
        title: "Limite excedido",
        description: `Máximo ${maxPhotos} fotos permitidas`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Tipo de arquivo não permitido: ${file.name}`);
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/upload/foto`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return `${BACKEND_URL}${response.data.url}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedUrls];
      onPhotosChange(newPhotos);

      toast({
        title: "Fotos enviadas com sucesso!",
        description: `${uploadedUrls.length} foto(s) adicionada(s)`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar fotos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const removePhoto = async (index) => {
    try {
      const photoUrl = photos[index];
      
      // Extract filename from URL
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Delete from server
      if (filename && filename !== 'undefined') {
        await axios.delete(`${API}/upload/foto/${filename}`);
      }
      
      // Update local state
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
      
      toast({
        title: "Foto removida",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao remover foto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="form-label">{label}</label>
        <span className="text-sm text-gray-500">({photos.length}/{maxPhotos})</span>
      </div>
      
      {/* Upload Button */}
      <div>
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
          onChange={handleFileUpload}
          disabled={uploading || photos.length >= maxPhotos}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            disabled={uploading || photos.length >= maxPhotos}
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <div className="spinner w-4 h-4 mr-2"></div>
                  Enviando...
                </>
              ) : (
                `Adicionar Fotos (${maxPhotos - photos.length} restantes)`
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="aspect-square">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOWNhM2FmIj5JbWFnZW0gTsOjbyBFbmNvbnRyYWRhPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0"
                onClick={() => removePhoto(index)}
                type="button"
              >
                ×
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Tips */}
      <div className="text-xs text-gray-500">
        <p>• Formatos aceitos: JPG, PNG, WebP, HEIC</p>
        <p>• Tamanho máximo por arquivo: 10MB</p>
        <p>• Máximo {maxPhotos} fotos</p>
      </div>
    </div>
  );
};

export default PhotoUpload;
