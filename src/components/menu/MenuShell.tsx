"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, Utensils, Users,
  Calendar, UserCog, BarChart3, Receipt, Settings, Bell, Search,
  ChevronRight, Sparkles, Plus, Pencil, X, ImagePlus, ChefHat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { fetchMenuItemRecipe } from "@/lib/menu-detail";
import {
  uploadMenuItemImageAction, createMenuItem, updateMenuItem, replaceMenuItemRecipe,
} from "@/lib/actions/menu";
import type { MenuCategory, MenuListRow, RecipeInventoryOption, RecipeLine } from "@/lib/queries/menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MenuShellProps = {
  items: MenuListRow[];
  categories: MenuCategory[];
  inventoryOptions: RecipeInventoryOption[];
  canManage: boolean;
  businessId: string;
};

const TAX_LABELS: Record<string, string> = {
  standard: "Standard",
  zero_rated: "Zero-rated",
  exempt: "Exempt",
};

const TAX_KEYS = ["standard", "zero_rated", "exempt"] as const;
type TaxKey = typeof TAX_KEYS[number];

// ---------------------------------------------------------------------------
// Sidebar nav
// ---------------------------------------------------------------------------
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard"  },
  { icon: ShoppingBag,     label: "Orders",     href: "/orders"     },
  { icon: Package,         label: "Inventory",  href: "/inventory"  },
  { icon: Wallet,          label: "Finance",    href: "/finance"    },
  { icon: Utensils,        label: "Menu",       href: "/menu"       },
  { icon: Users,           label: "Customers",  href: "/customers"  },
  { icon: Calendar,        label: "Bookings",   href: "/bookings"   },
  { icon: UserCog,         label: "Employees",  href: "/employees"  },
  { icon: BarChart3,       label: "Reports",    href: "/reports"    },
  { icon: Receipt,         label: "Tax",        href: "/tax"        },
  { icon: Settings,        label: "Settings",   href: "/settings"   },
];

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

function Chip({ children, tone = "neutral" }: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "black" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    green:   "bg-[rgba(12,151,98,0.10)] text-[var(--accent-green)]",
    yellow:  "bg-[rgba(250,255,127,0.55)] text-neutral-800",
    black:   "bg-black text-white",
    red:     "bg-[rgba(239,68,68,0.08)] text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-black" : "bg-neutral-300"}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-[14px] bg-neutral-100 px-3.5 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/10";

function lkr(n: number) {
  return `LKR ${n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Item form (inside add/edit drawer)
// ---------------------------------------------------------------------------

type DraftItem = {
  name: string;
  category_id: string;
  price: number;
  requires_kitchen_prep: boolean;
  tax_category: TaxKey;
  available: boolean;
  image_url: string | null;
};

const EMPTY_DRAFT: DraftItem = {
  name: "", category_id: "", price: 0,
  requires_kitchen_prep: false, tax_category: "standard", available: true,
  image_url: null,
};

function ItemForm({
  value,
  onChange,
  categories,
}: {
  value: DraftItem;
  onChange: (v: DraftItem) => void;
  categories: MenuCategory[];
}) {
  const set = (patch: Partial<DraftItem>) => onChange({ ...value, ...patch });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Local string buffer for the price field. Binding the input straight to
  // `value.price` (a number defaulting to 0) means every re-render — e.g.
  // typing in the Name field above it — writes the DOM value back to "0",
  // so a cleared field never stays cleared. Same fix as Cart's cashGivenStr
  // and inventory ItemForm's lowStockThreshold.
  const [priceText, setPriceText] = useState(() => (value.price ? String(value.price) : ""));

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadMenuItemImageAction(fd);
    setUploading(false);
    if (!result.ok) { setUploadError(result.error); return; }
    set({ image_url: result.url });
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          className={inputCls}
          placeholder="e.g. Chicken Kottu"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select
            className={inputCls}
            value={value.category_id}
            onChange={(e) => set({ category_id: e.target.value })}
          >
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Price (LKR)">
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className={inputCls}
            value={priceText}
            onChange={(e) => {
              setPriceText(e.target.value);
              set({ price: Number(e.target.value) || 0 });
            }}
          />
        </Field>
      </div>

      <Field label="Tax category">
        <div className="flex gap-2">
          {TAX_KEYS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ tax_category: t })}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                value.tax_category === t
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {TAX_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Photo">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-[18px] border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-left hover:bg-neutral-100 disabled:opacity-60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm overflow-hidden">
            {value.image_url
              ? <img src={value.image_url} alt="" className="h-full w-full object-cover" />
              : <ImagePlus className="h-4 w-4" />}
          </span>
          <span>
            <span className="block text-sm font-medium">
              {uploading ? "Uploading…" : value.image_url ? "Replace photo" : "Upload a photo"}
            </span>
            <span className="block text-xs text-neutral-500">PNG, JPG or WebP · max 5 MB</span>
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFile}
          disabled={uploading}
        />
        {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
      </Field>

      <div className="flex items-center justify-between rounded-[18px] bg-neutral-100 px-4 py-3">
        <div>
          <div className="text-sm font-medium">Available</div>
          <div className="text-xs text-neutral-500">Show this item on the POS and online ordering.</div>
        </div>
        <Toggle on={value.available} onChange={(v) => set({ available: v })} />
      </div>

      <div className="rounded-[18px] p-4" style={{ background: "rgba(250,255,127,0.45)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ChefHat className="h-4 w-4" /> Send to the kitchen printer
          </div>
          <Toggle on={value.requires_kitchen_prep} onChange={(v) => set({ requires_kitchen_prep: v })} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-neutral-700">
          Turn on for anything cooked or warmed to order. Leave it off for anything sold as-is,
          like a bottled drink or a pre-made pastry.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit drawer
// ---------------------------------------------------------------------------

function EditDrawer({
  item,
  categories,
  inventoryOptions,
  businessId,
  onClose,
  onSaved,
}: {
  item: MenuListRow | null;
  categories: MenuCategory[];
  businessId: string;
  inventoryOptions: RecipeInventoryOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 p-0 md:p-4"
      onClick={onClose}
    >
      <EditDrawerContent
        key={item.id}
        item={item}
        categories={categories}
        inventoryOptions={inventoryOptions}
        businessId={businessId}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  );
}

function EditDrawerContent({
  item, categories, inventoryOptions, businessId, onClose, onSaved,
}: {
  item: MenuListRow;
  categories: MenuCategory[];
  inventoryOptions: RecipeInventoryOption[];
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<DraftItem>({
    name: item.name,
    category_id: item.category_id ?? "",
    price: item.price,
    requires_kitchen_prep: item.requires_kitchen_prep,
    tax_category: item.tax_category as TaxKey,
    available: item.available,
    image_url: item.image_url ?? null,
  });
  const [recipe, setRecipe] = useState<RecipeLine[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [newIngredient, setNewIngredient] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMenuItemRecipe(createClient(), item.id).then((lines) => {
      if (!cancelled) { setRecipe(lines); setLoadingRecipe(false); }
    });
    return () => { cancelled = true; };
  }, [item.id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateMenuItem(item.id, {
      name: draft.name,
      categoryId: draft.category_id || null,
      price: draft.price,
      requiresKitchenPrep: draft.requires_kitchen_prep,
      taxCategory: draft.tax_category,
      available: draft.available,
      imageUrl: draft.image_url,
    });
    if (!result.ok) { setError(result.error ?? "Failed to save."); setSaving(false); return; }

    // Persist recipe
    await replaceMenuItemRecipe(item.id, recipe.map((r) => ({
      inventoryItemId: r.inventory_item_id,
      qty: r.qty,
    })));

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div
      className="h-full w-full overflow-y-auto rounded-t-[28px] bg-white p-5 md:max-w-[520px] md:rounded-[28px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-neutral-500">{item.category?.name ?? "No category"}</div>
          <h2 className="mt-1 text-2xl font-light tracking-tight">{item.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip tone="black">{lkr(draft.price)}</Chip>
            {draft.available
              ? <Chip tone="green">Available</Chip>
              : <Chip tone="red">Unavailable</Chip>}
            {draft.requires_kitchen_prep && <Chip tone="yellow">Kitchen prep</Chip>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Recipe */}
      <div className="mt-5 rounded-[20px] bg-neutral-50 p-4">
        <div className="text-sm font-medium">Recipe</div>
        {loadingRecipe ? (
          <div className="mt-3 text-sm text-neutral-500">Loading…</div>
        ) : (
          <div className="mt-3 space-y-2">
            {recipe.map((r, idx) => (
              <div key={r.inventory_item_id} className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2">
                <span className="flex-1 text-sm">{r.inventory_item.name}</span>
                <input
                  type="number"
                  value={r.qty}
                  onChange={(e) =>
                    setRecipe((p) => p.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))}
                  className="w-20 rounded-lg bg-neutral-100 px-2 py-1 text-sm outline-none"
                />
                <span className="w-10 text-xs text-neutral-500">{r.inventory_item.base_unit}</span>
                <button
                  onClick={() => setRecipe((p) => p.filter((_, i) => i !== idx))}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <select
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className="flex-1 rounded-[14px] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Select ingredient</option>
                {inventoryOptions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button
                onClick={() => {
                  const inv = inventoryOptions.find((o) => o.id === newIngredient);
                  if (!inv) return;
                  setRecipe((p) => [...p, {
                    inventory_item_id: inv.id,
                    qty: 1,
                    inventory_item: { name: inv.name, base_unit: inv.base_unit },
                  }]);
                  setNewIngredient("");
                }}
                className="rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="mt-5">
        <div className="text-sm font-medium">Edit item</div>
        <div className="mt-3">
          <ItemForm value={draft} onChange={setDraft} categories={categories} />
        </div>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Sticky footer */}
      <div className="sticky bottom-0 mt-5 flex gap-2 bg-white pt-3 pb-1">
        <button
          onClick={onClose}
          className="flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-full bg-black px-4 py-3 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add modal
// ---------------------------------------------------------------------------

function AddModal({
  open, categories, businessId, onClose, onSaved,
}: {
  open: boolean;
  categories: MenuCategory[];
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setDraft(EMPTY_DRAFT); setError(null); } }, [open]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await createMenuItem({
      name: draft.name,
      categoryId: draft.category_id || null,
      price: draft.price,
      requiresKitchenPrep: draft.requires_kitchen_prep,
      taxCategory: draft.tax_category,
      available: draft.available,
      imageUrl: null,
    });
    if (!result.ok) { setError(result.error ?? "Failed to create item."); setSaving(false); return; }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 md:max-w-[520px] md:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light tracking-tight">Add menu item</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          <ItemForm value={draft} onChange={setDraft} categories={categories} />
        </div>
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !draft.name}
            className="flex-1 rounded-full bg-black px-4 py-3 text-sm text-white hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Adding…" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function MenuShell({ items, categories, inventoryOptions, canManage, businessId }: MenuShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Client-side filter state
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All categories");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [editing, setEditing] = useState<MenuListRow | null>(null);
  const [adding, setAdding] = useState(false);

  // Derived
  const filtered = useMemo(() =>
    items.filter((i) =>
      (activeCategory === "All categories" || i.category?.name === activeCategory) &&
      (!availableOnly || i.available) &&
      i.name.toLowerCase().includes(query.toLowerCase()),
    ), [items, activeCategory, availableOnly, query]);

  const statsTotal    = items.length;
  const statsAvail    = items.filter((i) => i.available).length;
  const statsPrep     = items.filter((i) => i.requires_kitchen_prep).length;
  const statsCats     = categories.length;

  function handleSaved() { router.refresh(); }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white" style={{ fontFamily: "var(--font-outfit, var(--font-sans))" }}>

      {/* ── Top tab bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-black/5 flex-shrink-0">
        <Link href="/dashboard" className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity bg-neutral-100">
          <Image
            src="/brand/logo.webp"
            alt="Rio Bakers Hut"
            width={28}
            height={28}
            className="object-cover"
          />
        </Link>
        <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium">
          <Utensils className="h-3.5 w-3.5 text-neutral-500" />
          <span>Menu</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="hidden md:flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 w-72 cursor-text">
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <input
              placeholder="Search menu items…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-neutral-400"
            />
            <span className="text-[10px] rounded-md bg-white px-1.5 py-0.5 text-neutral-400 font-mono">⌘K</span>
          </label>
          <button type="button" className="relative h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4 text-neutral-700" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: "var(--accent-green)" }} />
          </button>
          <SignOutButton />
        </div>
      </div>

      {/* ── Shell body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-black/5 p-3 gap-0.5 flex-shrink-0 overflow-y-auto">
          <div className="mb-2 px-3 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Rio Bakers Hut</div>
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive ? "bg-black text-white font-medium" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-auto pt-3">
            <div className="rounded-[20px] p-4" style={{ background: "var(--accent-yellow)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Need help?</span>
              </div>
              <p className="mt-1.5 text-xs text-black/70 leading-snug">Head to our support section for guides and tutorials.</p>
              <Link href="/settings" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">
                Get support <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile icon rail */}
        <aside className="flex md:hidden flex-col w-14 py-3 px-1.5 shrink-0 border-r border-black/5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.label} href={item.href}
                className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all duration-150 ${
                  isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5">

          {/* Page header */}
          <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Rio Bakers Hut</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-neutral-800 font-medium">Menu</span>
              </div>
              <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Menu</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700">
                Available only
                <Toggle on={availableOnly} onChange={setAvailableOnly} />
              </div>
              {canManage && (
                <button
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              )}
            </div>
          </section>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {["All categories", ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  activeCategory === c
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Summary stats */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Menu items",   value: statsTotal, bg: "#f5f5f5",                    text: "text-neutral-800" },
              { label: "Available",    value: statsAvail, bg: "rgba(12,151,98,0.10)",        text: "text-[var(--accent-green)]" },
              { label: "Kitchen prep", value: statsPrep,  bg: "rgba(250,255,127,0.45)",      text: "text-neutral-800" },
              { label: "Categories",   value: statsCats,  bg: "#f5f5f5",                     text: "text-neutral-800" },
            ].map((s) => (
              <div key={s.label} className="rounded-[20px] p-4" style={{ background: s.bg }}>
                <div className={`text-3xl font-light ${s.text}`}>{s.value}</div>
                <div className="mt-1 text-xs text-neutral-600 font-medium">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Items table */}
          <section className="overflow-hidden rounded-[24px] border border-black/5">
            {/* Header row — desktop */}
            <div className="hidden grid-cols-12 gap-3 bg-neutral-50 px-5 py-3 text-xs font-medium text-neutral-500 md:grid">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Kitchen prep</div>
              <div className="col-span-1">Tax</div>
              <div className="col-span-2 text-right">Availability</div>
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-2 items-center gap-3 border-t border-black/5 px-5 py-3.5 transition-colors hover:bg-neutral-50 md:grid-cols-12"
              >
                <div className="col-span-2 text-sm font-medium md:col-span-3">{item.name}</div>
                <div className="col-span-1 text-xs text-neutral-500 md:col-span-3 md:text-sm">{item.category?.name ?? "—"}</div>
                <div className="col-span-1 text-sm md:col-span-2 tabular-nums">{lkr(item.price)}</div>
                <div className="col-span-1 md:col-span-1">
                  {item.requires_kitchen_prep
                    ? <Chip tone="yellow">Prep</Chip>
                    : <span className="text-sm text-neutral-400">—</span>}
                </div>
                <div className="col-span-1 text-xs text-neutral-600 md:col-span-1">
                  {TAX_LABELS[item.tax_category] ?? item.tax_category}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-2">
                  {item.available
                    ? <Chip tone="green">Available</Chip>
                    : <Chip tone="red">Unavailable</Chip>}
                  {canManage && (
                    <button
                      onClick={() => setEditing(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors flex-shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="border-t border-black/5 px-5 py-10 text-center text-sm text-neutral-500">
                No items match this filter.
              </div>
            )}
          </section>

          <div className="h-4" />
        </main>
      </div>

      {/* Edit drawer */}
      {canManage && (
        <EditDrawer
          item={editing}
          categories={categories}
          inventoryOptions={inventoryOptions}
          businessId={businessId}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Add modal */}
      {canManage && (
        <AddModal
          open={adding}
          categories={categories}
          businessId={businessId}
          onClose={() => setAdding(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
