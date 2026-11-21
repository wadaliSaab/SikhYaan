import CreateTest from "@/components/gyaanTest/buildTest/CreateTest";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-background/65 w-full min-h-0 h-dvh min-w-0 flex">
      <CreateTest testId={id} />
    </div>
  );
}