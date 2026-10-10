const methods = ["COD", "bKash", "Nagad", "Card", "Pathao", "Steadfast"] as const;

export function PaymentStrip() {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Pay & ship</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {methods.map((method) => (
          <li
            key={method}
            className="inline-flex h-9 items-center border border-border bg-white px-3 text-xs tracking-wide"
          >
            {method}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Online pay and courier booking connect when accounts go live.
      </p>
    </div>
  );
}
