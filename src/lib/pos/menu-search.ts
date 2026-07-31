type SearchableMenuItem = {
  menu_number: number;
  name: string;
};

export function matchesMenuSearch(item: SearchableMenuItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (query === "") return true;

  const menuNumberQuery = query.replace(/^#\s*/, "");

  return (
    item.name.toLowerCase().includes(query) || String(item.menu_number).includes(menuNumberQuery)
  );
}
