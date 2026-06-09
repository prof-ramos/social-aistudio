import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Code, Quote } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Post } from '../../types';

import { ConfirmDialog } from '../ui/ConfirmDialog';

interface PostEditorProps {
  onCancel: () => void;
  onSubmit: (title: string, bodyHTML: string, category: string) => Promise<void>;
  onUpdate?: (postId: string, title: string, bodyHTML: string, category: string) => Promise<Post>;
  isPosting: boolean;
  editPost?: Post;
  onEditComplete?: (updatedPost: Post) => void;
}

export function PostEditor({ onCancel, onSubmit, onUpdate, isPosting, editPost, onEditComplete }: PostEditorProps) {
  const [title, setTitle] = useState(() => editPost?.title || '');
  const [category, setCategory] = useState(() => editPost?.category || '');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const DRAFT_KEY = 'social-asof-draft-post';
  const debounceTimeout = useRef<any>(null);
  const isEditing = !!editPost;

  const saveDraft = (t: string, c: string, b: string) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ t, c, b }));
  };

  const debouncedSaveDraft = (t: string, c: string, b: string) => {
    if (isEditing) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      saveDraft(t, c, b);
    }, 1000);
  };

  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escreva o conteúdo da sua publicação...',
      }),
    ],
    content: editPost?.body || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[200px] p-5 sm:p-6 text-slate focus:outline-none border-none',
        'aria-label': 'Conteúdo da publicação',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSaveDraft(title, category, editor.getHTML());
      if (error) setError('');
    }
  });

  useEffect(() => {
    if (isEditing) return;
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
  }, [editor, isEditing]);

  // Adjust scroll when virtual keyboard opens on mobile
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const sel = window.getSelection();
      const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
      const rect = range?.getBoundingClientRect();
      if (rect) {
        const bottom = rect.bottom + 16;
        if (bottom > vv.height) {
          const offset = bottom - vv.height;
          window.scrollBy({ top: offset, behavior: 'smooth' });
        }
      }
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (error) setError('');
    debouncedSaveDraft(newTitle, category, editor?.getHTML() || '');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    if (error) setError('');
    debouncedSaveDraft(title, newCat, editor?.getHTML() || '');
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
    const bodyHTML = editor.getHTML();

    if (isEditing && editPost) {
      if (!onUpdate) {
        setError('Função de atualização não disponível.');
        return;
      }
      setIsUpdating(true);
      try {
        const updated = await onUpdate(editPost.id, title, bodyHTML, category);
        if (updated) onEditComplete?.(updated);
        onCancel();
      } catch (err) {
        setError('Erro ao salvar alterações. Tente novamente.');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    await onSubmit(title, bodyHTML, category);

    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    editor?.commands.setContent('');
    setCategory('');
  };

  const handleDiscardDraft = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    editor?.commands.setContent('');
    setCategory('');
    setShowDiscardDialog(false);
    onCancel();
  };

  if (!editor) return null;

  const toolbarButtonClass = (active: boolean) =>
    `flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1.5 transition-colors focus:ring-2 focus:ring-navy focus:outline-none ${
      active ? 'bg-navy text-white' : 'text-slate hover:bg-white border border-transparent'
    }`;

  return (
    <form onSubmit={handleSubmit} className="bg-ice border border-border-gray shadow-sm p-5 sm:p-8 mb-8 font-sans">
      {error && (
        <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
          <Alert variant="error" title="Atenção">{error}</Alert>
        </div>
      )}
      <label htmlFor="post-title" className="sr-only">Título da publicação</label>
      <input
        id="post-title"
        type="text"
        placeholder="Título da publicação"
        className="w-full text-lg sm:text-xl font-bold text-navy focus:ring-2 focus:ring-navy focus:outline-none mb-6 placeholder:text-slate px-4 py-3 border border-border-gray bg-white"
        value={title}
        onChange={handleTitleChange}
      />

      <div className="border border-border-gray mb-6 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-navy transition-shadow">
        <div role="toolbar" aria-label="Formatação do editor" className="flex flex-wrap gap-1.5 border-b border-border-gray p-2 sm:p-3 bg-ice/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive('bold'))}
            aria-label="Negrito"
            aria-pressed={editor.isActive('bold')}
            aria-controls="post-editor-content"
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive('italic'))}
            aria-label="Itálico"
            aria-pressed={editor.isActive('italic')}
            aria-controls="post-editor-content"
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border-gray mx-1 self-center"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive('bulletList'))}
            aria-label="Lista com marcadores"
            aria-pressed={editor.isActive('bulletList')}
            aria-controls="post-editor-content"
            title="Lista com marcadores"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive('orderedList'))}
            aria-label="Lista numerada"
            aria-pressed={editor.isActive('orderedList')}
            aria-controls="post-editor-content"
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border-gray mx-1 self-center"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClass(editor.isActive('blockquote'))}
            aria-label="Citação"
            aria-pressed={editor.isActive('blockquote')}
            aria-controls="post-editor-content"
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
             type="button"
             onClick={() => editor.chain().focus().toggleCodeBlock().run()}
             className={toolbarButtonClass(editor.isActive('codeBlock'))}
             aria-label="Bloco de código"
             aria-pressed={editor.isActive('codeBlock')}
             aria-controls="post-editor-content"
             title="Bloco de código"
          >
             <Code className="w-4 h-4" />
          </button>
        </div>
        <div id="post-editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-border-gray pt-6 gap-5">
        <div className="flex-1 w-full sm:w-auto max-w-sm">
          <label htmlFor="post-category" className="sr-only">Categoria</label>
          <select
            id="post-category"
            className="w-full h-11 px-4 text-base font-medium border border-border-gray bg-white text-slate focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
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
          {!isEditing && (title.trim() || editor?.getText().trim()) && (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDiscardDraft}
              className="flex-1 sm:flex-none"
            >
              DESCARTAR
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            className="flex-1 sm:flex-none"
          >
            CANCELAR
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isEditing ? isUpdating : isPosting}
            className="flex-1 sm:flex-none"
          >
            {isEditing ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR'}
          </Button>
        </div>
      </div>
      {!isEditing && (
        <p className="text-sm text-slate mt-4 font-medium uppercase tracking-wider text-right">
          Rascunho salvo automaticamente
        </p>
      )}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Descartar rascunho"
        message="Deseja realmente descartar o rascunho?"
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDiscardDraft}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </form>
  );
}