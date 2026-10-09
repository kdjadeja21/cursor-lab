import { ConnectBots } from "@/components/landing/connect-bots"
import { DownloadSection, MeetFirstBot } from "@/components/landing/download-section"
import { Guides } from "@/components/landing/guides"
import { Hero } from "@/components/landing/hero"
import { Jobs } from "@/components/landing/jobs"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { TeachAndMemory } from "@/components/landing/teach-and-memory"
import { WorksWhere } from "@/components/landing/works-where"

export default function Home() {
  return (
    <div className="bg-radial-glow flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <WorksWhere />
        <TeachAndMemory />
        <ConnectBots />
        <Jobs />
        <DownloadSection />
        <Guides />
        <MeetFirstBot />
      </main>
      <SiteFooter />
    </div>
  )
}
