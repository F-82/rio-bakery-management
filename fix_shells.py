import re
import os

files = [
    "src/components/orders/OrdersShell.tsx",
    "src/components/inventory/InventoryShell.tsx",
    "src/components/finance/FinanceShell.tsx",
    "src/components/customers/CustomersShell.tsx"
]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # 1. Add Image import
    if 'import Image from "next/image";' not in content:
        content = content.replace('"use client";\n', '"use client";\n\nimport Image from "next/image";\n')

    # 2. Fix layout root
    content = content.replace(
        '<div className="flex flex-col min-h-screen bg-white"',
        '<div className="flex flex-col h-dvh overflow-hidden bg-white"'
    )

    # 3. Fix Logo
    logo_old = """<Link href="/dashboard" className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity" style={{ background: "var(--accent-yellow)" }}>
          <span className="text-black text-sm select-none">✦</span>
        </Link>"""
    logo_new = """<Link href="/dashboard" className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity bg-neutral-100">
          <Image
            src="/brand/logo.webp"
            alt="Rio Bakers Hut"
            width={28}
            height={28}
            className="object-cover"
          />
        </Link>"""
    content = content.replace(logo_old, logo_new)

    # 4. Fix Promo Card
    content = content.replace('<span className="text-sm font-semibold">Pro plan</span>', '<span className="text-sm font-semibold">Need help?</span>')
    content = re.sub(
        r'<p className="mt-1\.5 text-xs text-black/70 leading-snug">.*?</p>',
        '<p className="mt-1.5 text-xs text-black/70 leading-snug">Head to our support section for guides and tutorials.</p>',
        content
    )
    content = content.replace(
        'Upgrade <ChevronRight',
        'Get support <ChevronRight'
    )

    with open(f, 'w') as file:
        file.write(content)
    print(f"Updated {f}")

