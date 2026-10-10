import { Card, CardDescription, CardHeader, CardTitle } from "@bismillah/ui";

const tiles = [
  { title: "Orders today", detail: "No orders yet." },
  { title: "Pending confirmation", detail: "COD orders will wait here for a confirmation call." },
  { title: "Low stock", detail: "Stock alerts appear after variants are created." },
  { title: "By source", detail: "Facebook, TikTok, Google, WhatsApp, and direct." },
];

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Sign-in, product upload, and the order list are the next build. This screen is the layout
        they will sit in.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <li key={tile.title}>
            <Card>
              <CardHeader>
                <CardTitle>{tile.title}</CardTitle>
                <CardDescription>{tile.detail}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
