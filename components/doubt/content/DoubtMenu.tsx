"use client";

import { useState, type FormEvent } from "react";
import {
  Bookmark,
  BookOpen,
  Globe2,
  HelpCircle,
  History,
  ListChecks,
  Plus,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  active: string;
  onSelect: (value: string) => void;
  categories: string[];
  canManageCategories: boolean;
  onAddCategory: (value: string) => Promise<void>;
};

const mainItems = [
  { id: "all-doubts", label: "All Doubts", icon: ListChecks },
  { id: "my-questions", label: "My Questions", icon: HelpCircle },
  { id: "saved", label: "Saved", icon: Bookmark },
];

const categoryIcons = [BookOpen, History, ScrollText, Globe2, Sparkles];

export default function DoubtMenu({
  active,
  onSelect,
  categories,
  canManageCategories,
  onAddCategory,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

 const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const value = name.trim();
  if (!value) return;

  try {
    await onAddCategory(value);
    setName("");
    setAdding(false);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Something went wrong");
  }
};

 
  const renderCategoryForm = () => (
    <form onSubmit={submitCategory} className="flex gap-1 max-sm:px-4">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setAdding(false);
            setName("");
          }
        }}
        placeholder="Category name"
        className="min-w-0 flex-1 rounded-lg border border-border  px-2 py-2 text-xs text-text-primary outline-none focus:border-primary"
      />
      <AppButton
        type="submit"
        variant="icon"
        aria-label="Add category"
        className="rounded-md bg-primary/80 px-2 text-premium"
      >
        <Plus size={14} />
      </AppButton>
      <AppButton
        type="button"
        variant="icon"
        aria-label="Cancel"
        onClick={() => {
          setAdding(false);
          setName("");
        }}
        className="rounded-lg px-1 text-text-secondary"
      >
        <X size={14} />
      </AppButton>
    </form>
  );

  return (
    <>
      <aside className="hidden h-full w-52 shrink-0 flex-col  min-h-0  border-border/30 border-r bg-premium/65 md:p-2 p-3  md:flex">
        <AppText variant="body" className="mb-3 px-2  uppercase tracking-wider text-accent font-semibold">
          Doubts
        </AppText>

        <nav className="flex flex-col gap-1 ">
          {mainItems.map(({ id, label, icon: Icon }) => (
            <AppButton
              key={id}
              type="button"
              variant="filter"
              onClick={() => onSelect(id)}
              active={active === id}
            
            >
              <Icon size={16} />
              {label}
            </AppButton>
          ))}
        </nav>

        <div className="mb-2 mt-7 flex min-h-0 items-center justify-between px-2">
          <AppText variant="caption" className="uppercase tracking-wider text-accent ">
            Categories
          </AppText>
         
             {canManageCategories && !adding && (
            <AppButton
              type="button"
              variant="icon"
              aria-label="Add category"
              title="Add category"
              onClick={() => setAdding(true)}
              className="rounded-md p-1.5 text-accent hover:bg-background hover:text-accent/70"
            >
              <Plus size={16} />
            </AppButton>
          )}
        
         
        </div>

        {adding && canManageCategories && (
          <div className="mb-2">{renderCategoryForm()}</div>
        )}

        <nav className="flex flex-col gap-1  hide-scrollbar overflow-y-auto ">
           {categories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            const id = `category:${category}`;

            return (
              <AppButton
                key={category}
                type="button"
                variant="filter"
                onClick={() => onSelect(id)}
                active={active === id}
              >
                <Icon size={16} />
                <span className="truncate">{category}</span>
              </AppButton>
            );
          })} 
         
        </nav>
      </aside>



      {/*  Mobile view */}

      <div className="flex min-w-0 flex-col gap-2 py-2 md:hidden  bg-premium/65 ">
        <div className="flex space-x-2 items-center mx-auto overflow-x-auto hide-scrollbar pb-1">
          {mainItems.map(({ id, label, icon: Icon }) => (
            <AppButton
              key={id}
              type="button"
              variant="filterMob"
              onClick={() => onSelect(id)}
              active={active === id}

          
            >
              <Icon size={14} />
              {label}
            </AppButton>
          ))}
        </div>

        <div className="flex items-center gap-1 px-1 overflow-x-auto pb-1">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            const id = `category:${category}`;

            return (
              <AppButton
                key={category}
                type="button"
                variant="filterMob"
                onClick={() => onSelect(id)}
                active ={active === id}
                className="text-text-secondary"
                activeClassName="text-text-primary border-text-primary"
                
              >
                <Icon size={14} />
                {category}
              </AppButton>
            );
          })}

          {canManageCategories && !adding && (
            <AppButton
              type="button"
              variant="icon"
              onClick={() => setAdding(true)}
              className="inline-flex shrink-0 items-center gap-1  px-3 py-2 text-xs text-accent"
            >
              <Plus size={14} />
              Category
            </AppButton>
          )}
        </div>

        {adding && canManageCategories && renderCategoryForm()}
      </div>
    </>
  );
}