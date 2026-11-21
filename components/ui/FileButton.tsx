"use client";
import { useRef } from "react";
import AppButton from "./AppButton";

type Props = {
  accept: string;
  multiple?: boolean;
  className?: string;
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
};

export default function FileButton({ accept, multiple, className, onFiles, children }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <AppButton type="button" className={className} onClick={() => input.current?.click()}>
        {children}
      </AppButton>
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = ""; 
        }}
      />
    </>
  );
}