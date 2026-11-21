import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import ContentReader from "@/components/contentReader/ContentReader";
import { getContentByReference } from "@/services/content/manager.service";


export default async function Page({ params }: { params: Promise<{ referenceId: string }> }) {
   const { referenceId } = await params;
   if (referenceId.includes(".")) notFound();
  const content = await getContentByReference(referenceId).catch(() => null);
  console.log(JSON.stringify(content, null, 2));
  if (!content || !content.isActive) notFound();
  return (
    <div className="  min-w-0 h-dvh w-full min-h-0 flex flex-col  bg-text-background/30" >
       <Header    subtitle="learn build gain" />

     
      <ContentReader content={content} />
    </div>
  );
}