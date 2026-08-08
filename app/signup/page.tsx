import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

/** Legacy route — auth is a home-page popup. */
export default async function SignupPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const params = new URLSearchParams({ auth: "signup" });
  if (next?.startsWith("/")) params.set("next", next);
  redirect(`/?${params.toString()}`);
}
