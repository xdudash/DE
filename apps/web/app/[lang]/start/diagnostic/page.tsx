import { PlacementCheck } from "../../../../components/PlacementCheck";

export default async function PlacementPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <PlacementCheck lang={lang} />;
}
