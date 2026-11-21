"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import Header from "@/components/ui/Header";
import ContentTree from "./ContentTree";
import EditorMain from "./EditorMain";
import EditTextModal from "./EditTextModal";
import UnsavedModal from "./UnsavedModal";
import { useContentEditor } from "@/src/hooks/useContentEditor";

const url = (ref?: string) =>
  ref ? `/settings/content/manager?ref=${encodeURIComponent(ref)}` : "/settings/content/manager";

const outline =
  "flex items-center gap-1.5 rounded-md border border-border/50 bg-premium px-3 py-2 text-sm text-text-primary";

export default function ContentEditor({ referenceId }: { referenceId: string | null }) {
  const router = useRouter();
  const editor = useContentEditor(referenceId);
  const { state, dirty } = editor;

  const [editing, setEditing] = useState<string | null>(null); 
  const [pending, setPending] = useState<(() => void) | null>(null); 
  const [search, setSearch] = useState("");

  const go = (path: string) => {
    if (dirty) setPending(() => () => router.push(path));
    else router.push(path);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const handleSave = async () => {
    const ref = await editor.save();
    if (!ref) return;

    
    if (ref !== referenceId) router.replace(url(ref));
    else await editor.reload();
  };


  const saveAndContinue = async () => {
    if (!(await editor.save())) return;
    pending?.();
    setPending(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${state.title}" with all its children and blocks?`)) return;
    if (await editor.remove()) router.push(url(state.parent?.referenceId));
  };

  const block = state.blocks.find((b) => b.id === editing);

  return (
    <div className="flex h-dvh w-full bg-background/20">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-1020 flex-col">
        <Header subtitle="Content Editor" />

        
        <div className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-premium px-3 pb-6 pt-3 sm:px-6 sm:py-4 md:overflow-hidden">
          {/* Top bar */}
          <div className="flex shrink-0 flex-col gap-3 border-b border-primary/20 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Reference ID (GURU-N7K2)"
                className="min-w-0 flex-1 rounded-md border border-border/40 bg-premium px-3 py-2 text-sm lg:w-60 lg:flex-none"
              />
              <AppButton
                className="shrink-0 rounded-md px-4 py-2"
                onClick={() => search.trim() && go(url(search.trim()))}
              >
                Load
              </AppButton>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {state.parent && (
                <AppButton
                  variant="link"
                  className="max-w-full truncate"
                  onClick={() => go(url(state.parent!.referenceId))}
                >
                  ← {state.parent.title}
                </AppButton>
              )}

              {editor.uploading > 0 && <AppText variant="caption">Uploading files…</AppText>}

              <AppButton className={outline} onClick={() => go(url())}>
                <Plus size={14} /> New Content
              </AppButton>

              {state.id && (
                <AppButton className={`${outline} text-error`} onClick={handleDelete}>
                  <Trash2 size={14} /> Delete
                </AppButton>
              )}

              <AppButton
                className="flex items-center gap-1.5 rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!dirty || editor.saving || editor.uploading > 0}
                onClick={handleSave}
              >
                <Save size={14} /> {editor.saving ? "Saving…" : "Save Changes"}
              </AppButton>
            </div>
          </div>

          {editor.error && (
            <AppText variant="caption" className="shrink-0 text-error wrap-anywhere">
              {editor.error}
            </AppText>
          )}

          {/* Tree + Main */}
          <div className="grid shrink-0 gap-4 md:min-h-0 md:flex-1 md:shrink md:grid-cols-[230px_1fr] md:grid-rows-1">
            <ContentTree
              items={state.children}
              onAdd={editor.addChild}
              onOpen={(child) => child.referenceId && go(url(child.referenceId))}
            />

            <div className="hide-scrollbar min-w-0 md:min-h-0 md:overflow-y-auto">
              {editor.loading ? (
                <AppText>Loading…</AppText>
              ) : (
                <EditorMain
                  state={state}
                  set={editor.set}
                  heroActions={editor.heroActions}
                  blockActions={editor.blockActions}
                  onEdit={setEditing}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Text modal */}
      {editing !== null && (
        <EditTextModal
          key={editing}
          title={editing === "summary" ? undefined : block?.title}
          html={editing === "summary" ? state.summary : (block?.content ?? "")}
          onSave={(title, html) => {
            editor.saveText(editing, title, html);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Unsaved changes modal */}
      {pending && (
        <UnsavedModal
          isNew={!state.id}
          saving={editor.saving}
          onSave={saveAndContinue}
          onDiscard={() => {
            pending();
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}