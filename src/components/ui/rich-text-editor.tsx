'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type RichTextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className='border-border bg-muted/30 flex flex-wrap gap-1 border-b px-2 py-1'>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0'
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        data-active={editor.isActive('bold') ? 'true' : undefined}
      >
        <span className='font-bold'>B</span>
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0 italic'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        data-active={editor.isActive('italic') ? 'true' : undefined}
      >
        I
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive('bulletList') ? 'true' : undefined}
      >
        •
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0'
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive('orderedList') ? 'true' : undefined}
      >
        1.
      </Button>
    </div>
  );
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px'
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[120px] px-4 py-3 focus:outline-none text-foreground placeholder:text-muted-foreground',
        'data-placeholder': placeholder
      }
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    }
  });

  React.useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        'rich-text-editor border-input bg-background focus-within:ring-ring focus-within:ring-offset-background overflow-hidden rounded-2xl border focus-within:ring-2 focus-within:ring-offset-2',
        className
      )}
      style={{ minHeight }}
      data-placeholder={placeholder}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
