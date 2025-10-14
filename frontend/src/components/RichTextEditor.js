// src/components/RichTextEditor.js

import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style'; // Corrigido na resposta anterior
import axios from 'axios';
import { toast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Bold, Italic, Strikethrough, Image as ImageIcon, Video, List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';
import { VideoExtension } from './TiptapVideoExtension'; // <-- Importar a nova extensão de vídeo

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente da Barra de Ferramentas
const Toolbar = ({ editor }) => {
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null); // <-- Ref para o input de vídeo

    if (!editor) {
        return null;
    }

    // Função para upload de imagem (existente)
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            toast({ title: 'Enviando imagem...' });
            const response = await axios.post(`${API}/upload/foto`, formData);
            const url = `${BACKEND_URL}${response.data.url}`;
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
                toast({ title: 'Imagem inserida com sucesso!' });
            }
        } catch (error) {
            toast({ title: 'Erro no upload da imagem', variant: 'destructive' });
        } finally {
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    // NOVA FUNÇÃO: Upload de vídeo para o editor
    const handleVideoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            toast({ title: 'Enviando vídeo...' });
            const response = await axios.post(`${API}/upload/video`, formData);
            const url = `${BACKEND_URL}${response.data.url}`;
            if (url) {
                editor.chain().focus().setVideo({ src: url }).run(); // Usa o comando da extensão
                toast({ title: 'Vídeo inserido com sucesso!' });
            }
        } catch (error) {
            toast({ title: 'Erro no upload do vídeo', variant: 'destructive' });
        } finally {
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };


    return (
        <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap gap-1">
            {/* Input para Imagem */}
            <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            {/* NOVO: Input para Vídeo */}
            <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />

            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-accent' : ''}><Bold className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-accent' : ''}><Italic className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-accent' : ''}><Strikethrough className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}><Heading1 className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}><Heading2 className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}><Heading3 className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}><AlignLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}><AlignCenter className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}><AlignRight className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-accent' : ''}><List className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-accent' : ''}><ListOrdered className="h-4 w-4" /></Button>
            {/* Botão de Imagem */}
            <Button type="button" variant="ghost" size="sm" onClick={() => imageInputRef.current.click()}><ImageIcon className="h-4 w-4" /></Button>
            {/* NOVO: Botão de Vídeo */}
            <Button type="button" variant="ghost" size="sm" onClick={() => videoInputRef.current.click()}><Video className="h-4 w-4" /></Button>

            <div className="relative inline-flex items-center">
                <input type="color" onChange={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#000000'} className="absolute opacity-0 w-8 h-8 cursor-pointer" />
                <Button type="button" variant="ghost" size="sm" className="pointer-events-none"><Palette className="h-4 w-4" /></Button>
            </div>
        </div>
    );
};

// Componente Principal do Editor
const RichTextEditor = ({ value, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            VideoExtension, // <-- Adicionar a extensão de vídeo
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose max-w-none p-4 min-h-[300px] border border-input rounded-b-md focus:outline-none focus:ring-1 focus:ring-ring',
            },
        },
    });

    return (
        <div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;