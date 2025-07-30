import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from "@tiptap/extension-placeholder";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { createRoot } from "react-dom/client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type MentionEditorRef = {
  retrieveEnteredText: () => { plainText: string, mentions: { label: string, id?: string }[] };
}

const MentionEditor = forwardRef<MentionEditorRef, { availableForMentionList: string[] }>(({ availableForMentionList }: { availableForMentionList: string[] }, ref) => {
  const suggestionRef = useRef<string[]>([]);
  const selectedIndex = useRef<number>(0);

  useEffect(() => {
    suggestionRef.current = availableForMentionList;
  }, [availableForMentionList]);

  const MentionList = ({ items, command }: any) => (
    <div className="max-h-48 overflow-auto">
      {items.map((item: any, index: number) => (
        <button key={index} onClick={() => command(item)} className="mention-item w-full px-2 py-1 rounded text-start hover:bg-red-100 hover:text-red-500 hover:font-semibold">
          @{item.label}
        </button>
      ))}
    </div>
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: { 
          class: "mention px-1 py-0.5 bg-gray-100 rounded text-xs text-blue-500 font-semibold"
        },
        suggestion: {
          items: ({ query }: any) => {
            return suggestionRef.current
              .filter(user => user.toLowerCase().includes(query.toLowerCase()))
              .map(user => ({ id: user, label: user }));
          },
          render: () => {
            let popup: any;

            return {
              onStart: (props: any) => {
                const container = document.createElement('div');
                const root = createRoot(container);
                root.render(<MentionList items={props.items} command={props.command} />);

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: container,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'top-start',
                })[0];
              },
              onUpdate(props: any) {
                const container = document.createElement('div');
                const root = createRoot(container);
                root.render(<MentionList items={props.items} command={props.command} />);

                popup?.setProps({
                  getReferenceClientRect: props.clientRect,
                  content: container,
                });
              },
              onKeyDown: ({ event }) => {
                const suggestions = document.querySelectorAll(".mention-item");
                if (!suggestions.length) return false;

                if (event.key === "ArrowDown") {
                  selectedIndex.current = (selectedIndex.current + 1) % suggestions.length;
                  highlightSelected(suggestions);
                  return true;
                }

                if (event.key === "ArrowUp") {
                  selectedIndex.current = (selectedIndex.current - 1 + suggestions.length) % suggestions.length;
                  highlightSelected(suggestions);
                  return true;
                }

                if (event.key === "Enter") {
                  (suggestions[selectedIndex.current] as HTMLElement)?.click();
                  return true;
                }

                if (event.key === "Escape") {
                  popup?.destroy();
                  return true;
                }

                return false;
              },
              onExit: ({ editor, range, query }) => {
                const matched = suggestionRef.current.find(item => item.toLowerCase() === query.toLowerCase());
                if (matched) {
                  // Manually insert the mention
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent([
                      {
                        type: "mention",
                        attrs: { id: matched, label: matched },
                      },
                      { type: "text", text: " " },
                    ])
                    .run();
                }
                popup?.destroy();
              },
            };
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Type note here..."
      })
    ],
    content: ""
  });

  const highlightSelected = (items: NodeListOf<Element>) => {
    items.forEach((el, idx) => {
      const element = el as HTMLElement;
      const isSelected = idx === selectedIndex.current;

      el.classList.toggle("bg-red-100", isSelected);
      el.classList.toggle("text-red-500", isSelected);
      el.classList.toggle("font-semibold", isSelected);

      if (isSelected)
        element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  useImperativeHandle(ref, () => ({
    retrieveEnteredText: () => {
      const json = editor!.getJSON();
      const mentions: { label: string, id?: string }[] = [];
      let plainText = "";

      function walk(node: any) {
        if (node.type === "paragraph" && plainText.length > 0) {
          plainText += "\n";
        } else if (node.type === "text") {
          plainText += node.text;
        } else if (node.type === "mention") {
          const label = node.attrs.label.split(" ")[0] || "";
          mentions.push({ label, id: node.attrs.id });
          plainText += `@${label}!`;
        }

        if (Array.isArray(node.content)) {
          node.content.forEach(walk);
        }
      }

      walk(json);
      return { plainText, mentions };
    }
  }))

  return (
    <div className="border border-gray-300 rounded-lg h-18 overflow-auto">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
});

export default MentionEditor;
