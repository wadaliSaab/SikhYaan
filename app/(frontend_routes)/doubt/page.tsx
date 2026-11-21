import DoubtContent from "@/components/doubt/content/DoubtContent";
import Header from "@/components/ui/Header";

export default function DoubtPage() {
  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-col bg-background/15">
      <Header subtitle="Ask & Clear Doubts"/>
      <DoubtContent/>
    </div>
  );
}