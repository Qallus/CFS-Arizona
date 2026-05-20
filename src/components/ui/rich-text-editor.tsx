'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Palette,
  Minus,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

const MenuButton = ({ 
  onClick, 
  active, 
  disabled,
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded-lg transition-colors',
      active ? 'bg-brand text-brand-foreground' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

const MenuDivider = () => <div className="w-px h-6 bg-border mx-1" />;

function MenuBar({ editor }: { editor: Editor | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      // Fallback to base64 for local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addImageFromUrl = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (showLinkInput) {
      if (linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      const previousUrl = editor.getAttributes('link').href;
      setLinkUrl(previousUrl || '');
      setShowLinkInput(true);
    }
  }, [editor, showLinkInput, linkUrl]);

  const unsetLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const colors = [
    '#ef4444', '#00fc83', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000',
  ];

  return (
    <div className="border-b border-border p-2 flex flex-wrap items-center gap-1 bg-secondary/30">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Undo/Redo */}
      <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="w-4 h-4" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="w-4 h-4" />
      </MenuButton>

      <MenuDivider />

      {/* Headings */}
      <MenuButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </MenuButton>

      <MenuDivider />

      {/* Text formatting */}
      <MenuButton 
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </MenuButton>

      {/* Color picker */}
      <div className="relative">
        <MenuButton 
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
        </MenuButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-xl z-50 flex gap-1 flex-wrap w-32">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setShowColorPicker(false);
              }}
              className="w-5 h-5 rounded border border-border hover:bg-secondary text-xs"
              title="Remove color"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <MenuDivider />

      {/* Alignment */}
      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </MenuButton>

      <MenuDivider />

      {/* Lists */}
      <MenuButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </MenuButton>
      <MenuButton 
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </MenuButton>

      <MenuDivider />

      {/* Links */}
      <div className="relative">
        <MenuButton 
          onClick={setLink}
          active={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-xl z-50 flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="px-2 py-1 bg-background border border-border rounded text-sm w-48"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') setLink();
                if (e.key === 'Escape') setShowLinkInput(false);
              }}
            />
            <button
              onClick={setLink}
              className="px-2 py-1 bg-brand text-brand-foreground rounded text-sm"
            >
              Add
            </button>
            {editor.isActive('link') && (
              <button
                onClick={unsetLink}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Images */}
      <MenuButton onClick={addImage} title="Upload Image">
        <Upload className="w-4 h-4" />
      </MenuButton>
      <MenuButton onClick={addImageFromUrl} title="Image from URL">
        <ImageIcon className="w-4 h-4" />
      </MenuButton>

      <MenuDivider />

      {/* Code */}
      <MenuButton 
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </MenuButton>
    </div>
  );
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing...', 
  className,
  editable = true 
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className={cn('border border-border rounded-lg overflow-hidden bg-background', className)}>
        <div className="p-4 min-h-[400px] flex items-center justify-center text-muted-foreground">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-background', className)}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}

// Read-only viewer component
export function RichTextViewer({ content, className }: { content: string; className?: string }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight,
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!mounted) {
    return (
      <div className={cn('p-4', className)}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className={cn('p-4', className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
