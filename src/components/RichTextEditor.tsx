"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

interface BubbleMenuPosition {
  top: number;
  left: number;
  visible: boolean;
}

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
  const editorRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<BubbleMenuPosition>({ top: 0, left: 0, visible: false });
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

  // Rerender toolbar state when editor selection changes
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

  // Position bubble menu based on selection
  const updateBubble = useCallback(() => {
    if (!editor || !editorRef.current) return;

    const { from, to, empty } = editor.state.selection;
    if (empty) {
      setBubble((b) => ({ ...b, visible: false }));
      return;
    }

    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const container = editorRef.current.getBoundingClientRect();
    const bubble = bubbleRef.current;
    const bubbleWidth = bubble?.offsetWidth ?? 300;

    const midX = (start.left + end.left) / 2 - container.left;
    const topY = start.top - container.top - 44; // 44px above

    const clampedLeft = Math.max(4, Math.min(midX - bubbleWidth / 2, container.width - bubbleWidth - 4));

    setBubble({ top: topY, left: clampedLeft, visible: true });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updateBubble);
    editor.on("blur", () => setBubble((b) => ({ ...b, visible: false })));
    return () => {
      editor.off("selectionUpdate", updateBubble);
    };
  }, [editor, updateBubble]);

  if (!editor) return null;

  return (
    <div
      ref={editorRef}
      className={cn(
        "relative rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
        className
      )}
    >
      {/* Bubble toolbar */}
      {bubble.visible && (
        <div
          ref={bubbleRef}
          className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-navy-200 bg-white dark:bg-card dark:border-navy-700 p-1 shadow-lg"
          style={{ top: bubble.top, left: bubble.left }}
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
      )}

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
