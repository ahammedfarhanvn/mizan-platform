import Link from "next/link";
import { ArrowRight, Bot, Calculator, Check, GitBranch, Globe2, LockKeyhole, Scale, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PublicHeader } from "../components/public-header";
import { HeroScrollStory } from "../components/hero-scroll-story";
import { Landing3D } from "../components/landing-3d";
import { ScrollDirector } from "../components/scroll-director";

const modules = [
  [Calculator, "Zakat Intelligence", "Calculate with context", "Identify eligible wealth, track niṣāb and ḥawl, and generate a transparent calculation."],
  [GitBranch, "MĪZĀN Farā’iḍ", "Map every relationship", "Build a family relationship map, deduct obligations and understand each preliminary share."],
  [Bot, "Masā’il Assistant", "Ask. Trace. Verify.", "Explore modern questions through madhhab-aware, source-noted preliminary guidance."],
  [Users, "Qazi Connect", "Bring in human judgment", "Share a review-ready case with a qualified scholar and track verification status."],
] as const;

export default function Home() {
  return <main className="public-site">
    <PublicHeader />
    <ScrollDirector />
    <HeroScrollStory />
    <section className="intelligence-section page-width" aria-labelledby="intelligence-title">
      <div className="intelligence-copy">
        <span className="eyebrow" data-text-reveal="line"><Sparkles /> Scholarship, organised with intelligence</span>
        <h2 id="intelligence-title" data-text-reveal="line" data-scroll-offset="28">Madhhab-aware <em>clarity.</em><br />Confident <em>calculations.</em></h2>
        <p data-text-reveal="line" data-scroll-offset="56">A trusted digital workspace for Zakat, Farā’iḍ and modern Masā’il—designed around the recognised sources of the four Sunni madhhabs.</p>
        <strong className="intelligence-tagline" data-text-reveal="line" data-scroll-offset="82">Identify. Calculate. Verify. Distribute.</strong>
        <div className="intelligence-actions" data-text-reveal="line" data-scroll-offset="104">
          <Link className="primary-button" href="/zakat">Explore Zakat Intelligence <ArrowRight /></Link>
          <span><ShieldCheck /> Every step remains traceable</span>
        </div>
      </div>
      <div className="intelligence-visual" aria-label="Interactive Zakat Intelligence calculation preview">
        <span className="autonomous-motion-label"><i /> Live interface · independent motion</span>
        <Landing3D />
      </div>
    </section>
    <section className="module-section page-width" id="platform"><div className="section-copy" data-scroll-motion="up"><span className="eyebrow"><Sparkles /> One connected platform</span><h2>Every layer enters at the right moment.</h2><p>Scroll through a guided sequence—from understanding your wealth to calculation, verification and responsible action.</p></div><div className="module-grid">{modules.map(([Icon,title,caption,text], index) => <article key={title} data-scroll-motion={index % 2 ? "right" : "left"} data-scroll-offset={index * 18} style={{"--card-index":index} as React.CSSProperties}><span className={`module-number n${index+1}`}>0{index+1}</span><div className="module-icon-3d"><Icon /></div><small className="module-caption">{caption}</small><h3>{title}</h3><p>{text}</p><Link href={["/zakat","/faraid","/masail","/qazi"][index]}>Open this layer <ArrowRight /></Link></article>)}</div></section>
    <section className="workflow-section"><div className="workflow-orb orb-a"/><div className="workflow-orb orb-b"/><div className="page-width workflow-inner"><div><span className="eyebrow">A safer decision path</span><h2>Technology creates order. Scholarship creates confidence.</h2><p>MĪZĀN never hides the reasoning behind a number. It organises your facts, reveals the method and marks the exact moment when human verification matters.</p><Link className="ghost-button" href="/knowledge">Understand the knowledge layer <ArrowRight /></Link></div><ol>{["Choose your madhhab — keep the method visible","Describe the real case — not just a final balance","Read the calculation trail — understand every step","Verify complex cases — act with qualified guidance"].map((item,index)=><li key={item} style={{"--step":index} as React.CSSProperties}><span>{index+1}</span><strong>{item}</strong><Check /></li>)}</ol></div></section>
    <section className="feature-band page-width"><div data-scroll-motion="left"><Globe2 /><strong>Multilingual by design</strong><span>English · Malayalam · Arabic</span></div><div data-scroll-motion="up" data-scroll-offset="34"><ShieldCheck /><strong>Four madhhabs</strong><span>Hanafi · Maliki · Shafi&apos;i · Hanbali</span></div><div data-scroll-motion="right" data-scroll-offset="68"><LockKeyhole /><strong>Private case workspace</strong><span>Role-based records and controlled sharing</span></div></section>
    <section className="public-cta page-width"><div className="cta-orbit" aria-hidden="true"><Scale/><i/><i/></div><div><span className="eyebrow">Clarity before action</span><h2>Do not accept a number you cannot understand.</h2><p>Build a transparent case. See the method. Invite qualified verification.</p></div><Link className="primary-button" href="/auth?mode=signup">Begin the guided journey <ArrowRight /></Link></section>
    <footer className="public-footer page-width"><Link className="brand" href="/"><Scale /><span>MĪZĀN</span></Link><p>Identify. Calculate. Verify. Distribute.</p><div><Link href="/knowledge">Knowledge</Link><Link href="/about">About</Link><Link href="/auth">Sign in</Link></div></footer>
  </main>;
}
