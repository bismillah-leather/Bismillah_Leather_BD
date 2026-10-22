"use client";

import { Phone, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { useStoreBrand } from "./brand-provider";
import { useCartUi } from "./cart-provider";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-1.99.522.531-1.94-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const spring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.8 };
const soft = { type: "spring" as const, stiffness: 320, damping: 26 };

export function FloatingContact() {
  const brand = useStoreBrand();
  const { open: cartOpen } = useCartUi();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = useId();

  const whatsappHref = `${brand.whatsappUrl}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, ${brand.name} থেকে অর্ডার / প্রশ্ন করতে চাই।`,
  )}`;

  useEffect(() => {
    if (cartOpen) setOpen(false);
  }, [cartOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (cartOpen) return null;

  const actions = [
    {
      key: "whatsapp",
      href: whatsappHref,
      external: true,
      label: "WhatsApp",
      className:
        "bg-[#25D366] shadow-[0_12px_28px_rgba(37,211,102,0.42)] hover:brightness-110",
      icon: <WhatsAppIcon className="size-[1.35rem]" />,
      sr: "Chat on WhatsApp",
    },
    {
      key: "call",
      href: `tel:${brand.phoneE164}`,
      external: false,
      label: `Call ${brand.phoneDisplay}`,
      className:
        "bg-[#15803d] shadow-[0_12px_28px_rgba(21,128,61,0.4)] hover:brightness-110",
      icon: <Phone className="size-[1.15rem]" strokeWidth={2.25} />,
      sr: `Call ${brand.phoneDisplay}`,
    },
  ] as const;

  return (
    <div className="pointer-events-none fixed right-3 bottom-[max(5.25rem,calc(4.5rem+env(safe-area-inset-bottom,0px)))] z-[240] flex flex-col items-end gap-3 sm:right-5 sm:bottom-6">
      <div id={panelId} className="flex flex-col items-end gap-2.5" aria-hidden={!open}>
        <AnimatePresence>
          {open
            ? actions.map((action, index) => (
                <motion.a
                  key={action.key}
                  href={action.href}
                  target={action.external ? "_blank" : undefined}
                  rel={action.external ? "noreferrer" : undefined}
                  tabIndex={0}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, y: 18, scale: 0.55, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: 12,
                          scale: 0.6,
                          filter: "blur(3px)",
                          transition: { duration: 0.16, delay: (1 - index) * 0.04 },
                        }
                  }
                  transition={{
                    ...spring,
                    delay: reduce ? 0 : index * 0.06,
                  }}
                  className="pointer-events-auto group flex items-center gap-2.5"
                >
                  <motion.span
                    initial={reduce ? false : { opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ ...soft, delay: reduce ? 0 : 0.05 + index * 0.05 }}
                    className="hidden rounded-full border border-black/5 bg-white/95 px-3.5 py-1.5 text-xs font-medium tracking-wide text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm sm:inline"
                  >
                    {action.label}
                  </motion.span>
                  <span
                    className={`inline-flex size-12 items-center justify-center rounded-full text-white ring-2 ring-white/90 transition duration-200 group-hover:scale-110 group-active:scale-95 sm:size-[3.35rem] ${action.className}`}
                  >
                    {action.icon}
                    <span className="sr-only">{action.sr}</span>
                  </span>
                </motion.a>
              ))
            : null}
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close contact options" : "Open WhatsApp and call options"}
        onClick={() => setOpen((v) => !v)}
        whileHover={reduce ? undefined : { scale: 1.06 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        animate={
          reduce
            ? undefined
            : open
              ? { rotate: 0 }
              : { rotate: [0, -4, 4, -2, 0] }
        }
        transition={
          open
            ? spring
            : {
                rotate: {
                  duration: 4.5,
                  repeat: Infinity,
                  repeatDelay: 3.2,
                  ease: "easeInOut",
                },
              }
        }
        className="fab-contact-main pointer-events-auto relative size-[3.75rem] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:size-[4.15rem]"
      >
        {/* Soft glow ring */}
        <span
          aria-hidden
          className={`fab-contact-glow absolute -inset-1 rounded-full transition-opacity duration-500 ${
            open ? "opacity-0" : "opacity-100"
          }`}
        />

        <span className="relative block size-full overflow-hidden rounded-full shadow-[0_14px_36px_rgba(0,0,0,0.32)] ring-[3px] ring-white">
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 60, scale: 0.7 }}
                transition={spring}
                className="absolute inset-0 flex items-center justify-center bg-foreground text-background"
              >
                <X className="size-6 sm:size-7" strokeWidth={2.25} />
              </motion.span>
            ) : (
              <motion.span
                key="avatar"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: 25 }}
                transition={spring}
                className="absolute inset-0"
              >
                <Image
                  src="/support-avatar.jpg"
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                  priority={false}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        {/* Online status */}
        <AnimatePresence>
          {!open ? (
            <motion.span
              key="online"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={spring}
              aria-hidden
              className="absolute top-0.5 right-0.5 size-3.5 rounded-full border-2 border-white bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,0.2)]"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e]/65" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
