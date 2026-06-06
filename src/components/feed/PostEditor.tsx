import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Code, Quote, AlertCircle } from 'lucide-react';

interface PostEditorProps {
  onCancel: () => void;
  onSubmit: (title: string, bodyHTML: string, category: string) => Promise<void>;
  isPosting: boolean;
}

export function PostEditor({ onCancel, onSubmit, isPosting }: PostEditorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const DRAFT_KEY = 'social-asof-draft-post';

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[200px] p-5 sm:p-6 text-slate focus:outline-none border-none resize-y',
      },
    },
    onUpdate: ({ editor }) => {
      saveDraft(title, category, editor.getHTML());
      if (error) setError('');
    }
  });

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const { t, c, b } = JSON.parse(draft);
        if (t) setTitle(t);
        if (c) setCategory(c);
        if (b && editor && !editor.isDestroyed) {
          editor.commands.setContent(b);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [editor]);

  const saveDraft = (t: string, c: string, b: string) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ t, c, b }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (error) setError('');
    saveDraft(newTitle, category, editor?.getHTML() || '');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    if (error) setError('');
    saveDraft(title, newCat, editor?.getHTML() || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, insira um título para a publicação.');
      return;
    }
    if (!category.trim()) {
      setError('Por favor, selecione uma categoria.');
      return;
    }
    if (!editor?.getText().trim()) {
      setError('Por favor, escreva algum conteúdo para a publicação.');
      return;
    }
    
    setError('');
    // Markdown-compatible HTML
    const bodyHTML = editor.getHTML();
    
    await onSubmit(title, bodyHTML, category);
    
    // Clear draft only on successful submission
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    editor?.commands.setContent('');
    setCategory('');
  };

  const handleDiscardDraft = () => {
    if (window.confirm("Deseja realmente descartar o rascunho?")) {
      localStorage.removeItem(DRAFT_KEY);
      setTitle('');
      editor?.commands.setContent('');
      setCategory('');
    }
  };

  if (!editor) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-ice border border-border-gray shadow-sm p-5 sm:p-8 mb-8 font-sans">
      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-800">Atenção</h3>
            <p className="text-sm mt-1 text-red-700">{error}</p>
          </div>
        </div>
      )}
      <label htmlFor="post-title" className="sr-only">Título da publicação</label>
      <input 
        id="post-title"
        type="text" 
        placeholder="Título da publicação" 
        className="w-full text-lg sm:text-xl font-bold text-navy focus:ring-2 focus:ring-navy focus:outline-none mb-6 placeholder:text-slate/40 px-4 py-3 border border-border-gray bg-white"
        value={title}
        onChange={handleTitleChange}
        required
      />

      <div className="border border-border-gray mb-6 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-navy transition-shadow">
        <div className="flex flex-wrap gap-1.5 border-b border-border-gray p-2 sm:p-3 bg-slate-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('bold') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('italic') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border-gray mx-1 self-center"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('bulletList') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
            title="Lista com marcadores"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('orderedList') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border-gray mx-1 self-center"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('blockquote') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
             type="button"
             onClick={() => editor.chain().focus().toggleCodeBlock().run()}
             className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${editor.isActive('codeBlock') ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'}`}
             title="Bloco de código"
          >
             <Code className="w-4 h-4" />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-border-gray pt-6 gap-5">
        <div className="flex-1 w-full sm:w-auto max-w-sm">
          <label htmlFor="post-category" className="sr-only">Categoria</label>
          <select 
            id="post-category"
            className="w-full h-11 px-4 text-sm font-medium border border-border-gray bg-white text-slate focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="" disabled>Selecione a categoria...</option>
            <option value="GERAL">Geral</option>
            <option value="CARREIRA">Carreira</option>
            <option value="VIDA_EXTERIOR">Vida no Exterior</option>
            <option value="POSTOS">Postos</option>
            <option value="APOSENTADORIA">Aposentadoria</option>
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {title.trim() || editor?.getText().trim() ? (
            <button 
              type="button" 
              onClick={handleDiscardDraft} 
              className="px-5 py-2.5 min-h-[44px] flex-1 sm:flex-none text-xs font-bold text-red-600 border border-transparent hover:bg-red-50 transition-colors focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              DESCARTAR
            </button>
          ) : null}
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-2.5 min-h-[44px] flex-1 sm:flex-none border border-navy text-navy font-bold text-xs bg-white hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
          >
            CANCELAR
          </button>
          <button 
            type="submit" 
            disabled={isPosting} 
            className="px-8 py-2.5 min-h-[44px] flex-1 sm:flex-none bg-navy text-white font-bold text-xs hover:bg-navy/90 transition-colors disabled:opacity-50 focus:ring-2 focus:ring-navy focus:outline-none"
          >
            {isPosting ? 'PUBLICANDO...' : 'PUBLICAR'}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate/50 mt-4 font-medium uppercase tracking-wider text-right">
        Rascunho salvo automaticamente
      </p>
    </form>
  );
}
