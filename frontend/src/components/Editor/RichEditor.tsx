"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import CharacterCount from "@tiptap/extension-character-count";
import styles from "./RichEditor.module.scss";

type HeadingLevel = 1 | 2 | 3;

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichEditor({ content, onChange, placeholder, maxLength }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const isInternalUpdate = useRef(false);
  const onChangeRef = useRef(onChange);
  const maxLengthRef = useRef(maxLength);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onChangeRef.current = onChange;
  maxLengthRef.current = maxLength;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        strike: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextStyleKit,
      Placeholder.configure({
        placeholder: placeholder || "",
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
    onUpdate: ({ editor }) => {
      const limit = maxLengthRef.current;
      if (limit && editor.storage.characterCount.characters() > limit) {
        return;
      }

      isInternalUpdate.current = true;
      onChangeRef.current(editor.getHTML());
    },
    onFocus: () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setIsFocused(true);
    },
    onBlur: ({ editor }) => {
      blurTimeoutRef.current = setTimeout(() => {
        if (!editor.isFocused) {
          setIsFocused(false);
        }
        blurTimeoutRef.current = null;
      }, 200);
    },
  });

  useEffect(() => {
    if (!editor || isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  useEffect(() => {
    if (editor && placeholder) {
      const ext = editor.extensionManager.extensions.find(
        (e) => e.name === "placeholder"
      );
      if (ext) {
        (ext as any).options.placeholder = placeholder;
      }
    }
  }, [editor, placeholder]);

  const toggleHeading = useCallback(
    (level: HeadingLevel) => {
      if (!editor) return;
      if (editor.isActive("heading", { level })) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level }).run();
      }
    },
    [editor]
  );

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const setFontSize = useCallback(
    (px: number) => {
      editor?.chain().focus().setFontSize(`${px}px`).run();
    },
    [editor]
  );

  const clearFontSize = useCallback(() => {
    editor?.chain().focus().unsetFontSize().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={`${styles.wrapper} ${isFocused ? styles.focused : ""}`}>
      <div className={styles.editorWrapper}>
        <EditorContent editor={editor} />
      </div>

      <div className={`${styles.toolbar} ${isFocused ? styles.toolbarVisible : ""}`}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={`${styles.toolbarBtn} ${editor.isActive("paragraph") ? styles.active : ""}`}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            P
          </button>
          {([1, 2, 3] as HeadingLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              className={`${styles.toolbarBtn} ${editor.isActive("heading", { level }) ? styles.active : ""}`}
              onClick={() => toggleHeading(level)}
              title={`Heading ${level}`}
            >
              H{level}
            </button>
          ))}
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={`${styles.toolbarBtn} ${editor.isActive("bold") ? styles.active : ""}`}
            onClick={toggleBold}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`${styles.toolbarBtn} ${editor.isActive("italic") ? styles.active : ""}`}
            onClick={toggleItalic}
            title="Italic"
          >
            <em>I</em>
          </button>
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setFontSize(12)}
            title="Smaller"
          >
            A-
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={clearFontSize}
            title="Default size"
          >
            A
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setFontSize(20)}
            title="Larger"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
