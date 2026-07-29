"use client";

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
    const { t } = useTranslation();
  return (
    <div className="relative px-3 py-2">
      <Search
        className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("Search menu")}
        className="flex h-11 w-full items-center rounded-full bg-surface-2 pr-3 pl-9 text-body-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-focus/20"
      />
    </div>
  );
}
