import { notFound } from "next/navigation";
import Storefront from "@/components/storefront";
const routes = [
  "tienda",
  "meditaciones",
  "recursos",
  "cursos",
  "mi-cuenta",
  "carrito",
  "admin",
];
export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  return {
    title: `${({ tienda: "Tienda", meditaciones: "Meditaciones", recursos: "Recursos", cursos: "Clases y cursos", "mi-cuenta": "Mi cuenta", carrito: "Carrito", admin: "Administración" } as Record<string, string>)[view] || "Página"} | Alma & Tierra`,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!routes.includes(view)) notFound();
  return <Storefront view={view} />;
}
