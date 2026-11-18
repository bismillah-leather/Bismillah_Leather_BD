import { getPrisma } from "@bismillah/db";
import { courierTrackingUrl, formatPaisa } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { courierSetup } from "@/lib/couriers";
import { parcelBarcodeValue, parcelShortId } from "@/lib/parcel-code";
import { CourierDesk } from "./courier-desk";

export default async function CouriersPage() {
  const setup = courierSetup();
  const prisma = getPrisma();
  const [, shipments, openOrders] = await Promise.all([
    requireAdmin(),
    prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        courier: true,
        consignmentId: true,
        trackingCode: true,
        status: true,
        codAmount: true,
        order: { select: { id: true, number: true, customerPhone: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { not: "cancelled" },
        shipments: { none: { status: { notIn: ["cancelled", "returned"] } } },
      },
      orderBy: { placedAt: "desc" },
      take: 40,
      select: { id: true, number: true, customerPhone: true, total: true },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Delivery"
        title="Couriers"
        description="Prints the Steadfast consignment ID as barcode + QR, same as their invoice."
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
          </p>
        </li>
      </ul>

      <CourierDesk
        steadfast={setup.steadfast}
        pathao={setup.pathao}
        preferred={setup.preferred}
        openOrders={openOrders.map((order) => ({
          id: order.id,
          number: order.number,
          customerPhone: order.customerPhone,
          totalLabel: formatPaisa(order.total),
        }))}
        booked={shipments.map((shipment) => {
          const barcode = parcelBarcodeValue(shipment.consignmentId, shipment.trackingCode);
          const shortId = parcelShortId(shipment.consignmentId, shipment.trackingCode);
          return {
            id: shipment.id,
            orderId: shipment.order.id,
            number: shipment.order.number,
            courier: shipment.courier,
            barcode,
            shortId,
            status: shipment.status,
            trackingUrl:
              shipment.courier === "steadfast" || shipment.courier === "pathao"
                ? courierTrackingUrl(shipment.courier, barcode || shortId, shipment.order.customerPhone)
                : "",
            codLabel: formatPaisa(shipment.codAmount),
          };
        })}
      />
    </div>
  );
}
