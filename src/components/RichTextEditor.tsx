import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  readonly?: boolean;
}

export default function RichTextEditor({ content, onChange, readonly }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: { class: 'list-disc ml-4' },
      }),
      ListItem,
      Highlight.configure({
        HTMLAttributes: { class: 'bg-yellow-200' },
      }),
      Placeholder.configure({
        placeholder: readonly ? '' : '在这里编辑你的笔记...',
      }),
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Toggle editable mode
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readonly);
    }
  }, [editor, readonly]);

  if (!editor) return null;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${readonly ? 'bg-gray-50/30' : ''}`}>
      {!readonly && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              editor.isActive('highlight')
                ? 'bg-yellow-200 text-yellow-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            高亮
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            • 列表
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-md"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-md"
          >
            ↪
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
