"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Descreva o problema, o objetivo e o impacto esperado...",
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-prose min-h-[140px] px-3 py-2 focus:outline-none",
      },
    },
  });

  // Keep editor content in sync when value prop changes externally (e.g., reset)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && value === "") {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  // Rerender toolbar active states when editor selection changes
  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate((n) => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
        className
      )}
    >
      {/* Fixed toolbar */}
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-navy-100 dark:border-navy-700 bg-navy-50/60 dark:bg-navy-900/40 p-1"
        onMouseDown={(e) => e.preventDefault()}
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-navy-200 dark:bg-navy-700" />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Subtítulo"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-navy-200 dark:bg-navy-700" />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-navy-200 dark:bg-navy-700" />

        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Alinhar à esquerda"
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Centralizar"
        >
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Alinhar à direita"
        >
          <AlignRight size={14} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition",
        active
          ? "bg-navy-800 text-white dark:bg-accent-400 dark:text-navy-900"
          : "text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800"
      )}
    >
      {children}
    </button>
  );
}
