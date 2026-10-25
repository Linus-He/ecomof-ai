import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import manifest from '../../data/scientificStructures.json'
import guides from '../../../scripts/nobel/learning-guides.json'
describe('source-backed scientific structures',()=>{
 it('covers every annual concept with existing, unmodified and accessible vector assets',()=>{
  for(const concept of Object.values(guides.years)){
   expect(manifest.concepts[concept]?.length).toBeGreaterThan(0)
   for(const id of manifest.concepts[concept])expect(manifest.figures[id]||manifest.figures[id+'-zh']).toBeTruthy()
  }
  for(const figure of Object.values(manifest.figures)){
   const data=readFileSync(resolve('public',figure.image));expect(createHash('sha256').update(data).digest('hex')).toBe(figure.sha256)
   expect(data.toString()).toContain('<svg');expect(figure.caption[0]).toBeTruthy();expect(figure.caption[1]).toBeTruthy()
   expect(data.toString()).not.toMatch(/<script|foreignObject|onload=/i)
  }
 })
 it('preserves enantiomer identity and separates molecular graphs from schematic or calculated geometry',()=>{
  const r=manifest.figures['carvone-r'],s=manifest.figures['carvone-s']
  expect(r.formula).toBe('C10H14O');expect(s.formula).toBe(r.formula)
  expect(r.chiralCenters.map(c=>c[1])).toEqual(['R']);expect(s.chiralCenters.map(c=>c[1])).toEqual(['S'])
  expect(r.smiles).not.toBe(s.smiles)
  expect(manifest.figures['chair-model'].kind).toBe('computed-conformer')
  expect(manifest.figures['mof-zh'].caption[0]).toMatch(/示意|不是实验/)
  expect(manifest.concepts.ribozyme).not.toContain('peptide')
  expect(manifest.concepts.dna).toContain('deoxy-amp')
  expect(manifest.contexts.lk99).toEqual(['superconductor'])
 })
})
