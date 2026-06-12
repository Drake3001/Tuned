import { HeroSlogan } from "@/components/landing/HeroSlogan";
import { AdminDailyPreview } from "@/components/landing/AdminDailyPreview";
import { ModePicker } from "@/components/landing/ModePicker";

export default function Home() {
  return (
    <main>
      <HeroSlogan />
      <AdminDailyPreview />
      <ModePicker />
    </main>
  );
}
