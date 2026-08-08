import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

/** Legacy route — auth is a home-page popup. */
export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const params = new URLSearchParams({ auth: "login" });
  if (next?.startsWith("/")) params.set("next", next);
  redirect(`/?${params.toString()}`);
}
