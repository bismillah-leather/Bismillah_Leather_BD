import { redirect } from "next/navigation";

/** Legacy path — login lives at /admin. */
export default function AdminLoginAliasPage() {
  redirect("/");
}
