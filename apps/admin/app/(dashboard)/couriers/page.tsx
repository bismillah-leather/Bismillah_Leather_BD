import { getPrisma } from "@bismillah/db";
import { courierTrackingUrl, formatPaisa } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { courierSetup } from "@/lib/couriers";
import { CourierActions } from "../orders/courier-actions";

export default async function CouriersPage() {
  const setup = courierSetup();
  const [, shipments] = await Promise.all([
    requireAdmin(),
    getPrisma().shipment.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      courier: true,
      consignmentId: true,
      trackingCode: true,
      status: true,
      codAmount: true,
      bookedAt: true,
      order: { select: { id: true, number: true, customerPhone: true } },
    },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Delivery"
        title="Couriers"
        description="Steadfast and Pathao stay off until their env values are set. Booking a parcel moves the order to shipped."
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li className="admin-panel p-4">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Steadfast</p>
          <p className="font-display mt-2 text-2xl">{setup.steadfast ? "Ready" : "Add keys"}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            STEADFAST_API_KEY and STEADFAST_SECRET_KEY. A live key books a real parcel.
          </p>
        </li>
        <li className="admin-panel p-4">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Pathao</p>
          <p className="font-display mt-2 text-2xl">{setup.pathao ? "Ready" : "Add keys"}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Client id, secret, username, password, and store id. Mode is {setup.pathaoMode}.
            Live books a real Pathao parcel.
          </p>
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-tight">Recent bookings</h2>
        {shipments.length === 0 ? (
          <p className="admin-panel mt-4 px-4 py-8 text-sm text-muted-foreground">
            No parcels yet. Book one from an order.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {shipments.map((shipment) => {
              const code = shipment.trackingCode || shipment.consignmentId || "";
              const trackingUrl =
                shipment.courier === "steadfast" || shipment.courier === "pathao"
                  ? courierTrackingUrl(shipment.courier, code, shipment.order.customerPhone)
                  : "";
              return (
                <li key={shipment.id} className="admin-panel px-4 py-4">
                  <p className="text-sm font-medium">
                    {shipment.order.number} · {formatPaisa(shipment.codAmount)} COD
                  </p>
                  <CourierActions
                    orderId={shipment.order.id}
                    steadfast={setup.steadfast}
                    pathao={setup.pathao}
                    preferred={setup.preferred}
                    shipment={{
                      id: shipment.id,
                      courier: shipment.courier,
                      code,
                      status: shipment.status,
                      trackingUrl,
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
