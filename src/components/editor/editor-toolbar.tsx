"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/config";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const previewMode = useUIStore((s) => s.previewMode);
  const setPreviewMode = useUIStore((s) => s.setPreviewMode);
  const { t } = useTranslation();

  if (!editor) return null;

  const tools: {
    icon: typeof Bold;
    action: () => void;
    active: boolean;
    labelKey: TranslationKey;
  }[] = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), labelKey: "toolbar.bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), labelKey: "toolbar.italic" },
    { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), labelKey: "toolbar.underline" },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), labelKey: "toolbar.strikethrough" },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), labelKey: "toolbar.heading1" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), labelKey: "toolbar.heading2" },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), labelKey: "toolbar.bulletList" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), labelKey: "toolbar.numberedList" },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), labelKey: "toolbar.quote" },
    {
      icon: Link,
      action: () => {
        const url = window.prompt(t("toolbar.linkPrompt"));
        if (url) editor.chain().focus().setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
      labelKey: "toolbar.link",
    },
    {
      icon: Image,
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            editor.chain().focus().setImage({ src: reader.result as string }).run();
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
      active: false,
      labelKey: "toolbar.image",
    },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock"), labelKey: "toolbar.codeBlock" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-4 py-2">
      {tools.map(({ icon: Icon, action, active, labelKey }) => (
        <Button
          key={labelKey}
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
          onClick={action}
          aria-label={t(labelKey)}
          type="button"
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", previewMode && "bg-accent")}
          onClick={() => setPreviewMode(!previewMode)}
          aria-label={t("toolbar.preview")}
          type="button"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
