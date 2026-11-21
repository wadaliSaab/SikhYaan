"use client";
import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount } from "@tiptap/extensions";
import { Bold, Italic, Underline, Link2, List, ListOrdered } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { lineCount } from "@/src/utils/summary";

const COLORS = [["Gold", "#C9A227"], ["Maroon", "#7A1F2B"], ["Green", "#2E7D32"], ["Blue", "#1E4E8C"]];
const SIZES = [["Small", "0.875em"], ["Large", "1.125em"]];
const selectClass = "rounded border border-border/40 bg-transparent px-1.5 py-1 text-xs outline-none";

type Props = {
  value: string;
  onChange: (html: string) => void;
  limit?: number; 
  maxLines?: number;
};

export default function RichTextEditor({ value, onChange, limit, maxLines }: Props) {
  const lines = useRef(lineCount(value));

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      ...(limit ? [CharacterCount.configure({ limit })] : []),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const n = lineCount(html);

      if (maxLines && n > maxLines && n > lines.current) {
        editor.commands.undo();
        return;
      }
      lines.current = n;
      onChange(html);
    },
    editorProps: { attributes: { class: "rich min-h-40 p-3 text-sm outline-none wrap-anywhere" } },
  });
  if (!editor) return null;

  const run = () => editor.chain().focus();
  const tools = [
    [Bold, () => run().toggleBold().run()],
    [Italic, () => run().toggleItalic().run()],
    [Underline, () => run().toggleUnderline().run()],
    [Link2, () => { const url = prompt("URL"); if (url) run().setLink({ href: url }).run(); }],
    [List, () => run().toggleBulletList().run()],
    [ListOrdered, () => run().toggleOrderedList().run()],
  ] as const;

  return (
    <div className="rounded-md border border-border/40 bg-premium">
      <div className="flex gap-1 border-b border-border/20 p-1.5">
        {tools.map(([Icon, action], i) => (
          <AppButton key={i} variant="icon" type="button" onClick={action} className="rounded p-1.5 hover:bg-primary/20">
            <Icon size={16} />
          </AppButton>
        ))}
        <select value="" className={selectClass}
          onChange={(e) => e.target.value === "0" ? run().setParagraph().run() : run().setHeading({ level: Number(e.target.value) as 1 | 2 | 3 | 4 }).run()}>
          <option value="" disabled>Importance</option>
          <option value="0">Normal</option>
          {[1, 2, 3, 4].map((l) => <option key={l} value={l}>H{l}</option>)}
        </select>

        <select value="" className={selectClass}
          onChange={(e) => e.target.value === "normal" ? run().unsetFontSize().run() : run().setFontSize(e.target.value).run()}>
          <option value="" disabled>Size</option>
          <option value="normal">Normal</option>
          {SIZES.map(([name, size]) => <option key={name} value={size}>{name}</option>)}
        </select>

        <select value="" className={selectClass}
          onChange={(e) => e.target.value === "default" ? run().unsetColor().run() : run().setColor(e.target.value).run()}>
          <option value="" disabled>Color</option>
          <option value="default">Default</option>
          {COLORS.map(([name, hex]) => <option key={name} value={hex}>{name}</option>)}
        </select>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}