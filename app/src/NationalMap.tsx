import { useRef, useState } from 'react'
import { mapPoint, type Location } from './locations'
import { statePaths } from './usaMap'
type MapSite = Location & { index: number; name: string; priority: number; status: 'critical' | 'attention' | 'clear' | 'unknown' }
const labels = {critical:'Critical', attention:'Needs attention', clear:'Clear', unknown:'Data needed'}
const severity = {critical:3, unknown:2, attention:1, clear:0}
export default function NationalMap({ sites, onOpen }: {sites: MapSite[]; onOpen: (index: number) => void}) {
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([480,315])
  const [nearby, setNearby] = useState<number[]>([])
  const drag = useRef<{x:number;y:number;center:[number,number]} | null>(null)
  const groups: {x:number;y:number;sites:MapSite[]}[] = []
  sites.forEach(site => {
    const [x,y] = mapPoint(site)
    const group = groups.find(item => Math.hypot(item.x-x,item.y-y) * zoom < 22)
    if (group) group.sites.push(site)
    else groups.push({x,y,sites:[site]})
  })
  function choose(group: typeof groups[number]) {
    if (group.sites.length === 1) onOpen(group.sites[0].index)
    else setNearby(group.sites.map(site => site.index))
  }
  const nearbySites = sites.filter(site => nearby.includes(site.index))
  return <section className="panel national-map" aria-label="National property map">
    <div className="map-heading"><div><p className="label">PORTFOLIO MAP</p><h2>Your portfolio</h2><p>{sites.length} locations · select a marker to explore</p></div><div className="map-controls"><button className="secondary" aria-label="Zoom out map" disabled={zoom === 1} onClick={() => {setZoom(Math.max(1,zoom/1.6));if(zoom/1.6<=1)setCenter([480,315])}}>−</button><button className="secondary" aria-label="Zoom in map" disabled={zoom >= 8} onClick={() => setZoom(Math.min(8,zoom*1.6))}>+</button><button className="secondary" onClick={() => {setZoom(1);setCenter([480,315]);setNearby([])}}>Reset map</button></div></div>
    <div className="map-canvas"><svg viewBox={`${center[0]-480/zoom} ${center[1]-315/zoom} ${960/zoom} ${630/zoom}`} aria-label="United States property locations. Alaska and Hawaii shown as insets." onPointerDown={event => { if ((event.target as Element).closest('[data-marker]')) return; drag.current={x:event.clientX,y:event.clientY,center};event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if(!drag.current || zoom===1)return;const rect=event.currentTarget.getBoundingClientRect();const scale=Math.max(960/zoom/rect.width,630/zoom/rect.height);setCenter([Math.max(0,Math.min(960,drag.current.center[0]-(event.clientX-drag.current.x)*scale)),Math.max(0,Math.min(630,drag.current.center[1]-(event.clientY-drag.current.y)*scale))]) }} onPointerUp={() => {drag.current=null}} onPointerCancel={() => {drag.current=null}}>
      <g className="map-land">{statePaths.map(state => <path key={state.name} d={state.path}><title>{state.name}</title></path>)}</g>
      <g className="map-labels" aria-hidden="true"><text x="65" y="610">ALASKA</text><text x="280" y="610">HAWAII</text><text x="420" y="590">UNITED STATES</text></g>
      {groups.map(group => { const worst = group.sites.reduce((a,b) => severity[a.status] >= severity[b.status] ? a : b);const description = group.sites.length>1 ? `${group.sites.length} nearby properties, highest status ${labels[worst.status]}` : `${worst.name}, ${worst.city}, ${worst.state}: ${labels[worst.status]}, ${worst.priority} out of 100`;return <g data-marker="true" key={group.sites[0].index} role="button" tabIndex={0} aria-label={description} className={'map-marker '+worst.status} transform={`translate(${group.x},${group.y}) scale(${1/zoom})`} onClick={() => choose(group)} onKeyDown={event => {if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(group)}}}><title>{description}</title><circle className="marker-halo" r="16"/><circle className="marker-core" r={group.sites.length>1 ? 11 : 7}/>{group.sites.length>1 && <text textAnchor="middle" dy="4">{group.sites.length}</text>}</g> })}
    </svg>{sites.length===0 && <div className="map-empty">No properties match your search or filter.</div>}</div>
    <div className="map-legend">{(['critical','attention','clear','unknown'] as const).map(status => <span key={status}><i className={'status-dot '+status}/>{labels[status]}</span>)}<small>Drag to pan when zoomed · grouped markers show the highest priority</small></div>
    {nearbySites.length>0 && <div className="map-nearby"><div><h3>Nearby properties</h3><button className="secondary" onClick={() => setNearby([])}>Close list</button></div>{nearbySites.map(site => <button className="nearby-property" key={site.index} onClick={() => onOpen(site.index)}><span className={'status-dot '+site.status}/><span>{site.name}<small>{site.city}, {site.state}</small></span><strong>{site.priority}<small>/ 100</small></strong><span>→</span></button>)}</div>}
    <p className="note">Fictional demo properties at approximate city locations, not actual CBRE assets. Colors update with recovery previews. Alaska and Hawaii are repositioned and scaled. <a href="https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json" target="_blank" rel="noreferrer">Map boundaries</a>.</p>
  </section>
}
