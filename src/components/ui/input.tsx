import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-iaf-800">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-iaf-200 bg-white/90 px-3.5 py-2.5 text-sm text-iaf-950 placeholder:text-iaf-400 focus:border-iaf-400 focus:outline-none focus:ring-2 focus:ring-iaf-200/60",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-iaf-200 bg-white/90 px-3.5 py-2.5 text-sm text-iaf-950 focus:border-iaf-400 focus:outline-none focus:ring-2 focus:ring-iaf-200/60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[88px] rounded-xl border border-iaf-200 bg-white/90 px-3.5 py-2.5 text-sm text-iaf-950 placeholder:text-iaf-400 focus:border-iaf-400 focus:outline-none focus:ring-2 focus:ring-iaf-200/60",
        className
      )}
      {...props}
    />
  );
}

export function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}
