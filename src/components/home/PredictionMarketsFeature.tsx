import { ArrowRight, ChartLine } from '@phosphor-icons/react'
import { useLang } from '../../contexts'
import '../pages/predictionMarkets.css'

export function PredictionMarketsFeature() {
  const { lang } = useLang(); const zh = lang === 'zh'
  return <section className="prediction-home-entry"><div className="prediction-home-icon"><ChartLine size={35} /></div><div><span>SCIENCE FORECASTS</span><h2>{zh ? '科学预测' : 'Science Forecasts'}</h2><p>{zh ? '从科学奖项，到电池、超导与碳捕集，查看有来源的预测、规则与验证证据。' : 'Explore source-linked forecasts, rules and evidence across scientific awards, batteries, superconductors and carbon capture.'}</p></div><a href="#science-forecasts">{zh ? '探索科学预测' : 'Explore forecasts'} <ArrowRight size={18} /></a></section>
}
