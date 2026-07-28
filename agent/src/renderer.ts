export type PrintJobPayload = {
  order_number: string;
  counter_id: string | null;
  created_at: string;
  // Customer receipt only:
  subtotal?: number;
  discount_amount?: number;
  total?: number;
  payment_method?: string;
  items: Array<{
    name: string;
    qty: number;
    notes?: string | null;
    unit_price?: number;
    line_total?: number;
  }>;
};

export function renderCustomerReceipt(payload: PrintJobPayload): string {
  let out = "";
  
  // Header
  out += "       RIO BAKERS HUT       \n";
  out += "==============================\n";
  out += `Order No: ${payload.order_number}\n`;
  out += `Date: ${new Date(payload.created_at).toLocaleString('en-LK')}\n`;
  if (payload.payment_method) {
    out += `Payment: ${payload.payment_method.toUpperCase()}\n`;
  }
  out += "==============================\n\n";

  // Items
  for (const item of payload.items) {
    out += `${item.name}\n`;
    const qtyLine = `  ${item.qty} x ${item.unit_price?.toFixed(2)}`;
    const totalStr = item.line_total?.toFixed(2) ?? "0.00";
    
    // Calculate padding
    const paddingLength = 30 - qtyLine.length - totalStr.length;
    const padding = paddingLength > 0 ? " ".repeat(paddingLength) : " ";
    out += `${qtyLine}${padding}${totalStr}\n`;
  }
  out += "------------------------------\n";

  // Totals
  const subtotalStr = payload.subtotal?.toFixed(2) ?? "0.00";
  out += `Subtotal:${" ".repeat(30 - 9 - subtotalStr.length)}${subtotalStr}\n`;

  if (payload.discount_amount && payload.discount_amount > 0) {
    const discountStr = payload.discount_amount.toFixed(2);
    out += `Discount:${" ".repeat(30 - 9 - discountStr.length)}-${discountStr}\n`;
  }

  const totalStr = payload.total?.toFixed(2) ?? "0.00";
  out += `Total:   ${" ".repeat(30 - 9 - totalStr.length)}${totalStr}\n`;
  
  out += "==============================\n";
  out += "         Thank You!         \n";

  return out;
}

export function renderKitchenTicket(payload: PrintJobPayload): string {
  let out = "";

  // The spec says: "KOT carries no prices and leads with the order number at the largest size the printer supports."
  // Since we are generating plain text for now, we simulate large text with ASCII or just prominent spacing.
  out += "\n";
  out += "******************************\n";
  out += `*       ORDER: ${payload.order_number}       *\n`;
  out += "******************************\n\n";
  out += `Time: ${new Date(payload.created_at).toLocaleTimeString('en-LK')}\n`;
  out += "==============================\n\n";

  for (const item of payload.items) {
    out += `[${item.qty}] ${item.name}\n`;
    if (item.notes) {
      out += `    Note: ${item.notes}\n`;
    }
    out += "\n";
  }

  out += "==============================\n";

  return out;
}
