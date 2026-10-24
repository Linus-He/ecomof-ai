import { ArrowRight, ChartLine } from '@phosphor-icons/react'
import { useLang } from '../../contexts'
import '../pages/predictionMarkets.css'

export function PredictionMarketsFeature() {
  const { lang } = useLang(); const zh = lang === 'zh'
  return <section className="prediction-home-entry"><div className="prediction-home-icon"><ChartLine size={35} /></div><div><span>PREDICTION MARKETS</span><h2>{zh ? '开奖之前，市场如何判断？' : 'What did the market expect?'}</h2><p>{zh ? '按年份查看 The Nobel Prize in Chemistry 的历史预测与隐含概率。' : 'Source-labelled historical prices for The Nobel Prize in Chemistry, explored by year.'}</p></div><a href="#prediction-markets">{zh ? '查看赔率' : 'Explore markets'} <ArrowRight size={18} /></a></section>
}
