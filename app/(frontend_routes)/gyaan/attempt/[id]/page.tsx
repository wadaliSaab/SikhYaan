import TakeTest from "@/components/gyaanTest/takeTest/TakeTest";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-background/65 w-full min-h-0 h-dvh min-w-0 flex">
      <TakeTest attemptId={id} />
    </div>
  );
}