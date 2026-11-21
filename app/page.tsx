import Header from "@/components/home/Header";
import HomeContent from "@/components/home/content/HomeContent";
import NotificationButton from "@/components/home/NotificationButton";

export default function Home() {
  return (
    <div className="flex h-dvh w-full min-w-0 flex-col bg-background/70">
      <Header />
      <HomeContent />
      <NotificationButton  />
    </div>
  );
}