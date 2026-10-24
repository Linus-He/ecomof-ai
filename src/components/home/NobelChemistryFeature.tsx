import { useLang } from '../../contexts'
import edition from '../../data/nobelLatest.json'
import './nobelChemistry.css'
export function NobelChemistryFeature() {
  const { lang } = useLang()
  const zh = lang === 'zh'
  return <section className="nobel-editorial nobel-feature" aria-labelledby="nobel-feature-title">
    <div className="nobel-feature-copy">
      <span className="nobel-kicker">THE NOBEL PRIZE IN CHEMISTRY</span>
      <h2 id="nobel-feature-title">{zh ? '化学，改变我们理解世界的方式' : 'Chemistry changes how we see the world'}</h2>
      <p>{zh ? '从发现背后的问题，到方法、意义与边界。每一年，读懂一项改变化学的成果。' : 'Explore the questions, discoveries and limits behind each year’s prize.'}</p>
      <a className="nobel-read-link" href={`#nobel-chemistry-${edition.year}`}>{zh ? '阅读年度解读' : 'Explore the Nobel readings'} <span aria-hidden="true">→</span></a>
      <div className="nobel-feature-edition">{edition.year} · {edition.theme[zh ? 0 : 1]}</div>
    </div>
    {edition.imageYear && <a className="nobel-feature-image" href={`#nobel-chemistry-${edition.year}`} aria-label={zh ? `阅读 ${edition.year} 年诺奖解读` : `Read the ${edition.year} edition`}><img src={`${import.meta.env.BASE_URL}images/nobel/chemistry-${edition.imageYear || 2026}.jpg`} alt="Henri B. Kagan and Kenso Soai" loading="lazy" /><span>Ill. Niklas Elmehed © Nobel Prize Outreach</span></a>}
  </section>
}
