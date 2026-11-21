import ContentEditor from "@/components/content-editor/ContentEditor";

export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;

  
  return <ContentEditor key={ref ?? "new"} referenceId={ref ?? null} />;
}