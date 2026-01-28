import { auth0 } from "@/lib/auth/auth0";
import { redirect } from "next/navigation";
import PlayerScreen from "@/components/player/PlayerScreen";
import { DEFAULT_BASE_ID, getManifestForRef } from "@/lib/api/bible";
export default async function RecastPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const params = await searchParams;
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return redirect('/login');
  }

  const ref = params.ref;
  if (!ref) {
    return <h1>Ref not found</h1>;
  }
  console.log('Ref:', ref);
  const section = await getManifestForRef(DEFAULT_BASE_ID, ref);
  if (!section) {
    return <h1>Section not found</h1>;
  }

  return (
    <PlayerScreen section={section} />
  );
}