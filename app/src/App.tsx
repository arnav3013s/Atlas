import { useEffect, useRef, useState } from 'react'
import PropertyAssistant from './PropertyAssistant'
import NationalMap from './NationalMap'
import Icon, { type IconName } from './Icon'
import './interface.css'
import { nationalLocations, originalLocations } from './locations'

const systems = [
  { name: 'Power / UPS', probability: 20, loss: 100000, reduction: 60, cost: 2000,
    path: ['Power failure', 'Cooling interrupted', 'Servers warm', 'Tenant service disrupted'],
    readings: ['Load 91%', 'Battery health 62%', 'Runtime 12 min'],
    parameters: ['Voltage deviation', 'Load / rated capacity', 'Equipment temperature', 'Phase imbalance', 'Battery health', 'Backup runtime', 'Generator availability'],
    history: 'Battery assessment overdue by 45 days.',
    action: 'Assess UPS battery and verify backup coverage' },
  { name: 'HVAC / cooling', probability: 40, loss: 10000, reduction: 50, cost: 800,
    path: ['Filter restriction', 'Reduced airflow', 'Servers warm', 'Tenant service disrupted'],
    readings: ['Supply air 23 °C', 'Setpoint error +5 °C', 'Airflow 65%'],
    parameters: ['Supply-air temperature', 'Return-air temperature', 'Setpoint error', 'Airflow', 'Filter pressure differential', 'Fan speed', 'Compressor power'],
    history: 'Filter replacement overdue by 21 days.',
    action: 'Inspect the cooling system and restore airflow' },
  { name: 'Plumbing / pumps', probability: 10, loss: 20000, reduction: 70, cost: 600,
    path: ['Pipe leak', 'Pressure loss', 'Equipment exposed', 'Service disrupted'],
    readings: ['Pressure 2.1 bar', 'Demand +30%', 'Tank level 42%'],
    parameters: ['Water pressure', 'Flow', 'Pressure drop', 'Tank level', 'Pump power', 'Vibration', 'Water use / expected demand'],
    history: 'Pump seal inspected 90 days ago.',
    action: 'Investigate leak and isolate affected zone' },
  { name: 'Fire protection', probability: 10, reduction: 50, path: ['Detector or panel faults', 'Reduced protection coverage', 'Occupant safety concern'], action: 'Arrange a fire protection inspection' },
  { name: 'Elevators', probability: 10, reduction: 55, path: ['Door or drive faults', 'Elevator becomes unreliable', 'Building access is disrupted'], action: 'Inspect elevator doors and drive' },
]
const readings = [
  [['Electrical load (%)',70,100],['Battery health (%)',90,50],['Backup runtime (min)',30,5],['Voltage deviation (%)',2,10],['Service overdue (days)',0,90]],
  [['Supply air (°C)',16,28],['Setpoint error (°C)',1,8],['Airflow (% of target)',95,45],['Filter pressure (Pa)',80,240],['Service overdue (days)',0,90]],
  [['Water pressure (bar)',3.5,1],['Demand above normal (%)',5,50],['Tank level (%)',80,20],['Pump vibration (mm/s)',2,8],['Service overdue (days)',0,90]],
  [['Offline detectors',0,8],['Sprinkler pressure (%)',100,60],['Panel faults',0,5],['Battery health (%)',90,50],['Inspection overdue (days)',0,90]],
  [['Door retries per day',0,20],['Faults per week',0,10],['Drive temperature (°C)',40,80],['Cars available (%)',100,25],['Service overdue (days)',0,90]],
] as const
const samples = [
  [[91,62,12,5,45],[23,5,65,140,21],[2.1,30,42,3,0],[0,98,0,92,0],[3,1,46,100,0]],
  [[64,87,26,2,0],[26,7,48,220,42],[3.4,8,75,2,0],[1,94,0,89,8],[8,3,57,75,17]],
  [[72,78,19,3,0],[21,3,76,110,0],[1.8,42,31,6,34],[2,87,1,84,12],[5,2,52,80,9]],
]
samples.push(
  [[65,95,35,1,0],[16,0,100,70,0],[3.6,2,85,1,0],[0,100,0,95,0],[0,0,38,100,0]],
  [[82,80,22,3,12],[20,3,80,120,15],[3.1,12,70,3,8],[0,99,0,95,0],[2,1,43,100,0]],
)
const extraLoss = [[30000,10000],[25000,20000],[40000,23000],[18000,8000],[20000,18000]]
const extraCost = [[1200,750],[950,1200],[1400,1500],[900,600],[1100,950]]
const buildings = [
  { name: 'Richardson Data Center', dataset: 'Single-duct AHU', readings: systems.map(system => system.readings), history: systems.map(system => system.history), probability: [20, 40, 10], loss: [100000, 10000, 20000], cost: [2000, 800, 600] },
  { name: 'Plano Office Center', dataset: 'Rooftop unit', readings: [['Load 64%', 'Battery health 87%', 'Runtime 26 min'], ['Supply air 26 °C', 'Setpoint error +7 °C', 'Airflow 48%'], ['Pressure 3.4 bar', 'Demand +8%', 'Tank level 75%']], history: ['Generator tested last week.', 'Rooftop filter inspection overdue.', 'No open pump repairs.'], probability: [8, 48, 9], loss: [24000, 38000, 12000], cost: [900, 1400, 500] },
  { name: 'Frisco Medical Offices', dataset: 'Chiller plant', readings: [['Load 72%', 'Battery health 78%', 'Runtime 19 min'], ['Chilled water 10 °C', 'Setpoint error +3 °C', 'Flow 76%'], ['Pressure 1.8 bar', 'Demand +42%', 'Tank level 31%']], history: ['Battery inspection due next month.', 'Chiller flow inspection scheduled.', 'Leak reported in the east wing.'], probability: [12, 18, 38], loss: [50000, 31000, 68000], cost: [1300, 2400, 1800] },
]
buildings.push(
  { name: 'Allen Learning Campus', dataset: 'Single-duct AHU', readings: [], history: [], probability: [5,5,5], loss: [18000,12000,10000], cost: [850,700,450] },
  { name: 'Dallas Retail Plaza', dataset: 'Rooftop unit', readings: [], history: [], probability: [10,15,8], loss: [28000,22000,15000], cost: [1000,900,650] },
)
const propertyTypes = ['Data center', 'Commercial office', 'Medical offices', 'Education', 'Retail']
const propertyCategories = ['Data center', 'Commercial office', 'Medical offices', 'Education', 'Retail']
const propertyImages: Record<string,string> = { 'Data center':'data-center', 'Commercial office':'office', 'Medical offices':'medical', Education:'education', Retail:'retail' }
const buildingImage = (index: number) => '/buildings/' + propertyImages[propertyTypes[index]] + '.svg'
const locations = [...originalLocations, ...nationalLocations]
const buildingKinds = ['Data Center', 'Office Center', 'Medical Offices', 'Learning Campus', 'Retail Plaza']
nationalLocations.forEach((location, index) => {
  const kind = index % 5
  const tier = index % 3
  const severity = [0.035, 0.32, 0.88][tier]
  const baseLoss = [14000, 27000, 85000][tier]
  buildings.push({ name: location.city + ' ' + buildingKinds[kind], dataset: ['Single-duct AHU', 'Rooftop unit', 'Chiller plant'][index % 3], readings: [], history: [], probability: [10,10,10], loss: [baseLoss, Math.round(baseLoss * 0.85), Math.round(baseLoss * 0.7)], cost: [1200 + index * 25, 900 + index * 20, 600 + index * 15] })
  propertyTypes.push(['Data center', 'Commercial office', 'Medical offices', 'Education', 'Retail'][kind])
  extraLoss.push([Math.round(baseLoss * 0.6), Math.round(baseLoss * 0.4)])
  extraCost.push([850 + index * 12, 700 + index * 18])
  samples.push(readings.map((metrics, systemIndex) => metrics.map(([,target,critical], metricIndex) => {
    const variation = 0.8 + ((index * 7 + systemIndex * 3 + metricIndex) % 9) / 20
    const value = target + (critical - target) * Math.min(1, severity * variation)
    return Number(value.toFixed(2))
  })))
})
const statusLabels = { critical: 'Critical', attention: 'Needs attention', clear: 'Clear', unknown: 'Data needed' }
type PropertyStatus = keyof typeof statusLabels

function riskFactor(row: ReturnType<typeof initial>[number], index: number, automatic: boolean) {
  if (!automatic) return row.probability
  return readings[index].reduce((sum, [, target, critical], metric) => {
    const severity = (Number(row.readings[metric]) - target) / (critical - target)
    return sum + Math.max(0, Math.min(1, severity)) * 8
  }, 0)
}

const initial = (buildingIndex: number) => {
  const building = buildings[buildingIndex]
  return systems.map((_, i) => ({ probability: building.probability[i] ?? 10, loss: [...building.loss, ...extraLoss[buildingIndex]][i], cost: [...building.cost, ...extraCost[buildingIndex]][i], readings: samples[buildingIndex][i].map(String), missing: false }))
}
const equipmentIcons: IconName[] = ['bolt','cooling','water','shield','elevator']
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const score = (exposure: number, k: number) => (100 * exposure / (exposure + k)).toFixed(1)

function App() {
  const [helpOpen, setHelpOpen] = useState(false)
  const [buildingType, setBuildingType] = useState('all')
  const helpButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!helpOpen) return
    const escape = (event: KeyboardEvent) => { if(event.key === 'Escape') { setHelpOpen(false); helpButton.current?.focus() } }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [helpOpen])
  const [home, setHome] = useState(true)
  const [quickIndex, setQuickIndex] = useState<number | null>(null)
  const [aiPage, setAiPage] = useState(false)
  const quickDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (quickIndex !== null) quickDialog.current?.showModal()
    else quickDialog.current?.close()
  }, [quickIndex])
  const [fullRecovery, setFullRecovery] = useState<boolean[]>(() => buildings.map(() => false))
  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState('priority')
  const [pageSize, setPageSize] = useState(12)
  const [mobileNav, setMobileNav] = useState(false)
  const [activeSection, setActiveSection] = useState('fixes')
  useEffect(() => {
    if (!mobileNav) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNav(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileNav])
  const [recent, setRecent] = useState<number[]>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem('cbre-recent') ?? '[]'); return Array.isArray(saved) ? [...new Set(saved.filter((value): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < buildings.length))].slice(0,5) : [] } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem('cbre-recent', JSON.stringify(recent)) } catch { /* Recent properties remain available in this session. */ } }, [recent])
  const [filter, setFilter] = useState<PropertyStatus | 'all'>('all')
  const [selected, setSelected] = useState(0)
  const [buildingIndex, setBuildingIndex] = useState(0)
  const building = buildings[buildingIndex]
  const [portfolio] = useState(() => buildings.map((_, i) => initial(i)))
  const inputs = portfolio[buildingIndex]
  const auto = true
  const reference = 10000
  const [manualPortfolio, setManualPortfolio] = useState(() => buildings.map((_, index) => initial(index).map((row, i) => ({ probability: String(riskFactor(row, i, true)), loss: String(row.loss), cost: String(row.cost) }))))
  const [manualSystem, setManualSystem] = useState(0)
  const manualRows = manualPortfolio[buildingIndex]
  const manualRow = manualRows[manualSystem]
  const manualValid = manualRows.every(row => Object.values(row).every(value => value.trim() !== '' && Number.isFinite(Number(value))))
  const manualTotal = manualRows.reduce((sum, row) => sum + Number(row.probability) / 100 * Number(row.loss), 0)
  function updateManual(field: 'probability' | 'loss' | 'cost', value: string) {
    if (value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > (field === 'probability' ? 100 : 1000000000))) return
    setManualPortfolio(current => current.map((rows, index) => index === buildingIndex ? rows.map((row, i) => i === manualSystem ? { ...row, [field]: value } : row) : rows))
  }
  const [previews, setPreviews] = useState<number[][]>(() => buildings.map(() => []))
  const applied = previews[buildingIndex]
  const setApplied = (next: number[]) => setPreviews(rows => rows.map((row, i) => i === buildingIndex ? next : row))
  const [orders, setOrders] = useState<number[][]>(() => buildings.map(() => []))
  const tickets = orders[buildingIndex]
  const setTickets = (next: number[]) => setOrders(rows => rows.map((row, i) => i === buildingIndex ? next : row))
  const [light, setLight] = useState(() => { try { return localStorage.getItem('cbre-theme') === 'light' } catch { return false } })
  useEffect(() => { try { localStorage.setItem('cbre-theme', light ? 'light' : 'dark') } catch { /* Theme still works for this session. */ } }, [light])
  const system = systems[selected]
  const input = inputs[selected]
  const factors = inputs.map((row, i) => riskFactor(row, i, auto))
  const known = inputs.map(row => !row.missing && (!auto || row.readings.every(value => value !== '')))
  const valid = known.every(Boolean)
  const before = inputs.map((row, i) => factors[i] / 100 * row.loss)
  const after = before.map((value, i) => fullRecovery[buildingIndex] ? 0 : value * (applied.includes(i) ? 1 - systems[i].reduction / 100 : 1))
  const total = after.reduce((sum, value) => sum + value, 0)
  const ranked = systems.map((s, i) => ({ index: i, benefit: before[i] * s.reduction / 100 - inputs[i].cost }))
    .filter(row => known[row.index] && !applied.includes(row.index) && !fullRecovery[buildingIndex]).sort((a, b) => b.benefit - a.benefit)

  function openProperty(index: number) {
    setHelpOpen(false)
    setAiPage(false)
    setRecent(current => [index, ...current.filter(item => item !== index)].slice(0, 5))
    setQuickIndex(null)
    setMobileNav(false)
    setBuildingIndex(index)
    setSelected(0)
    setActiveSection('fixes')
    setHome(false)
    window.scrollTo({ top: 0 })
  }

  const summaries = buildings.map((site, index) => {
    const rows = portfolio[index]
    const complete = rows.every(row => !row.missing && (!auto || row.readings.every(value => value !== '')))
    const losses = rows.map((row, i) => fullRecovery[index] ? 0 : riskFactor(row, i, auto) / 100 * row.loss *
      (previews[index].includes(i) ? 1 - systems[i].reduction / 100 : 1))
    const priority = Number(score(losses.reduce((sum, loss) => sum + loss, 0), reference))
    const status: PropertyStatus = !complete ? 'unknown' : priority >= 65 ? 'critical' : priority >= 25 ? 'attention' : 'clear'
    const lead = losses.indexOf(Math.max(...losses))
    return { ...site, index, priority, status, lead, exposure: losses.reduce((sum, loss) => sum + loss, 0) }
  })
  const portfolioAverage = summaries.every(site => site.status !== 'unknown')
    ? summaries.reduce((sum, site) => sum + site.priority, 0) / summaries.length
    : null
  const matching = summaries.filter(site =>
    (site.name + ' ' + propertyTypes[site.index] + ' ' + locations[site.index].city + ' ' + locations[site.index].state).toLowerCase().includes(query.toLowerCase().trim()))
  const visible = matching.filter(site => buildingType === 'all' || propertyTypes[site.index] === buildingType).filter(site => filter === 'all' || site.status === filter)
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : ({ critical: 0, unknown: 1, attention: 2, clear: 3 }[a.status] -
      { critical: 0, unknown: 1, attention: 2, clear: 3 }[b.status]) || b.priority - a.priority)

  function openQuick(index: number) {
    setHelpOpen(false)
    setRecent(current => [index, ...current.filter(item => item !== index)].slice(0, 5))
    setQuickIndex(index)
  }
  function nextAction(index: number) {
    if (fullRecovery[index]) return null
    return systems.map((item, i) => ({ index: i, benefit: riskFactor(portfolio[index][i], i, true) / 100 * portfolio[index][i].loss * item.reduction / 100 - portfolio[index][i].cost }))
      .filter(item => !previews[index].includes(item.index)).sort((a,b) => b.benefit-a.benefit)[0] ?? null
  }
  function openAssistant(index: number) {
    setHelpOpen(false)
    setBuildingIndex(index)
    setRecent(current => [index, ...current.filter(item => item !== index)].slice(0, 5))
    setQuickIndex(null)
    setMobileNav(false)
    setAiPage(true)
    window.scrollTo({ top: 0 })
  }
  function assistantContext(index: number) {
    return {
            name: buildings[index].name, location: locations[index], buildingType: propertyTypes[index],
            priorityScore: summaries[index].priority, expectedLossUSD: summaries[index].exposure,
            dataSource: 'Illustrative sample readings, not live telemetry or measured dataset records',
            fullRecoveryPreview: fullRecovery[index],
            formula: 'riskFactor = sum(clamp((reading-target)/(critical-target),0,1)*8); expectedLoss = factor/100 * failureCost * previewAdjustment; priority = 100*expectedLoss/(expectedLoss+10000). Heuristic, not calibrated probability.',
            systems: systems.map((item,i)=>{const row=portfolio[index][i];return {name:item.name, readings:readings[i].map(([label,target,critical],j)=>({label,value:row.readings[j],target,critical})), riskFactor: riskFactor(row,i,true), failureCostUSD:row.loss, repairCostUSD:row.cost, action:item.action, modeledReductionPercent:item.reduction, repairPreviewApplied:previews[index].includes(i), workOrderRecorded:orders[index].includes(i), expectedLossUSD:fullRecovery[index]?0:riskFactor(row,i,true)/100*row.loss*(previews[index].includes(i)?1-item.reduction/100:1)}}),
    }
  }

  const attention = [...visible].filter(site => site.status === 'critical' || site.status === 'attention').sort((a,b) => b.priority-a.priority).slice(0, 3)
  const quickAction = quickIndex === null ? null : nextAction(quickIndex)

  return (
    <div className={(light ? 'application light' : 'application') + (!aiPage && !home && (applied.length > 0 || fullRecovery[buildingIndex]) ? ' preview-active' : '')}>
      <aside className={mobileNav ? 'sidebar mobile-open' : 'sidebar'}>
        <a className="brand" href="#overview" onClick={() => { setAiPage(false); setHome(true); setMobileNav(false) }}><span className="brand-word">CBRE<span className="brand-square" /></span><span>PROPERTY INTELLIGENCE</span></a>
        <div className="workspace-chip"><span className="workspace-mark"><Icon name="building"/></span><div>Your portfolio<small>55 properties · United States</small></div></div><p className="rail-label">WORKSPACE</p>
        <a className={!aiPage && home ? "nav-active" : ""} href="#overview" onClick={() => { setAiPage(false); setHome(true); setMobileNav(false) }}><Icon name="grid"/> Portfolio home</a>
        <a className={!aiPage && !home && activeSection === 'fixes' ? 'nav-active' : ''} href="#fixes" onClick={() => { setAiPage(false); setHome(false); setMobileNav(false); setActiveSection('fixes') }}><Icon name="check"/> Action Items</a>
        <a className={!aiPage && !home && activeSection === 'systems' ? 'nav-active' : ''} href="#systems" onClick={() => { setAiPage(false); setHome(false); setMobileNav(false); setActiveSection('systems') }}><Icon name="activity"/> Equipment Health</a>
        <a className={aiPage ? 'nav-active' : ''} aria-current={aiPage ? 'page' : undefined} href="#assistant" onClick={event => { event.preventDefault(); openAssistant(buildingIndex) }}><Icon name="sparkles"/> AI Assistant</a>
        <section className="recent-sidebar" aria-label="Recently viewed properties">
          <p className="rail-label">RECENTLY VIEWED <span>{recent.length}</span></p>
          {recent.length === 0 && <p className="recent-empty">Properties you open appear here.</p>}
          {recent.map(index => <button className="property-link" aria-pressed={!aiPage && !home && buildingIndex === index} key={index} onClick={() => openProperty(index)}>
            <span className={'status-dot ' + summaries[index].status} /><span>{buildings[index].name}<small>{propertyTypes[index]}</small></span>
          </button>)}
        </section>
        <div className="sidebar-note"><Icon name="shield" size={16}/><span>Demo environment<small>Sample data · session previews</small></span></div><div className="rail-bottom"><span className="avatar">A</span><div>Arnav<small>Facilities Manager</small></div></div>
      </aside>{mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}<main id="overview" className={aiPage ? 'assistant-main' : ''}>
      <header><div className="header-location"><button className="mobile-menu secondary" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Icon name="menu"/></button><Icon name="globe" size={16}/><span>Portfolio <span className="breadcrumb">/</span> <b>{aiPage ? 'AI Assistant' : home ? 'Overview' : building.name}</b></span></div><div><span className="demo-tag"><i/> DEMO DATA</span><button className="theme" aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setLight(!light)}><Icon name={light ? 'moon' : 'sun'} size={16}/><span>{light ? 'Dark' : 'Light'}</span></button></div></header>
      {!aiPage && <div className="global-search-bar">
        <div className="global-search-field"><span aria-hidden="true"><Icon name="search" size={19}/></span><input type="search" className="property-search" aria-label="Search properties" placeholder="Search by property, city, state, or building type…" value={query} onChange={event => { setQuery(event.target.value); setPageSize(12); setFilter('all'); setHome(true) }} /></div>
        <select className="global-building-select" aria-label="Choose a building" value={home ? '' : buildingIndex} onChange={event => openProperty(Number(event.target.value))}><option value="" disabled>Choose a building ({matching.length})</option>{propertyCategories.map(type => <optgroup key={type} label={type}>{matching.filter(site=>propertyTypes[site.index]===type).map(site => <option key={site.index} value={site.index}>{site.name} · {locations[site.index].state}</option>)}</optgroup>)}</select>
      </div>
      }
      {aiPage ? <section className="ai-workspace" id="assistant">
        <div className="ai-page-heading"><div><p className="label">YOUR PROPERTY COPILOT</p><h1>AI Assistant</h1><p>From building data to a clear next step.</p></div><span className="ai-model-badge"><Icon name="sparkles" size={15}/> Property-aware AI</span></div>
        <div className="ai-context-bar"><span className="ai-context-icon"><Icon name="building" size={21}/></span><label>Discussing<select aria-label="Assistant property" value={buildingIndex} onChange={event=>openAssistant(Number(event.target.value))}>{propertyCategories.map(type=><optgroup key={type} label={type}>{buildings.map((site,i)=>propertyTypes[i]===type ? <option key={i} value={i}>{site.name} · {locations[i].state}</option> : null)}</optgroup>)}</select></label><span className={'status-pill '+summaries[buildingIndex].status}>{statusLabels[summaries[buildingIndex].status]}</span><button className="secondary" onClick={()=>openProperty(buildingIndex)}>View property <Icon name="arrow" size={15}/></button></div>
        <PropertyAssistant key={buildingIndex} context={assistantContext(buildingIndex)}/>
      </section> : home ? <>
        <section className="portfolio-intro"><div><p className="label">PROPERTY OPERATIONS / UNITED STATES</p><h1>Portfolio overview<span className="heading-dot">.</span></h1><p>Your properties. Your priorities. A clear next step.</p></div><div className="portfolio-scale"><span><strong>{buildings.length}</strong> properties</span><i/><span><strong>{new Set(locations.map(location => location.state)).size}</strong> states</span></div></section>
        <div className="status-summary">
          <section className="status-tile portfolio-average" aria-label="Average portfolio risk"><span>Average portfolio risk</span><strong>{portfolioAverage === null ? '—' : portfolioAverage.toFixed(1) + '%'}</strong><small>{portfolioAverage === null ? 'Waiting for complete property data' : `Sum of all ${buildings.length} property scores ÷ ${buildings.length}`}</small><small>Average priority score · not a failure probability</small></section>
          {(['critical','attention','clear','unknown'] as const).map(status => <button key={status} className={'status-tile ' + status} aria-pressed={filter === status} onClick={() => { setFilter(filter === status ? 'all' : status); setPageSize(12) }}>
            <span><i className={'status-dot ' + status} />{statusLabels[status]}</span><strong>{summaries.filter(site => site.status === status).length}</strong><small>View properties <Icon name="arrow" size={13}/></small>
          </button>)}
        </div>
        <div className="portfolio-command"><NationalMap sites={visible.map(site => ({...site, ...locations[site.index]}))} onOpen={openQuick} />
          <section className="panel attention-queue"><div className="attention-header"><div><h2>Attention needed</h2><p>Highest-priority properties</p></div><span className="inline-count">{visible.filter(site => site.status === 'critical' || site.status === 'attention').length}</span></div><div className="attention-list">{attention.map(site => <button className="attention-row" key={site.index} onClick={() => openQuick(site.index)}><div className="attention-row-top"><span className={'status-dot '+site.status}/><span>{statusLabels[site.status]}</span><strong>{site.priority}<small>/100</small></strong></div><h3>{site.name}</h3><p>{locations[site.index].city}, {locations[site.index].state}</p><div className="attention-row-bottom"><span>{systems[site.lead].name}</span><Icon name="arrow" size={16}/></div></button>)}</div>{attention.length===0 && <div className="queue-empty"><Icon name="check" size={28}/><h3>No priority alerts</h3><p>No properties need attention in this view.</p></div>}<button className="attention-all secondary" onClick={() => {setFilter('critical');setPageSize(12);document.getElementById('property-browser')?.scrollIntoView({behavior:'smooth'})}}>View critical properties <Icon name="arrow" size={15}/></button></section>
        </div>
        <section className="panel portfolio-panel" id="property-browser">
          <div className="portfolio-toolbar"><div><h2>Properties <span className="inline-count">{visible.length}</span></h2><p>Explore a property or open its action plan.</p></div><div className="property-tools"><select aria-label="Filter building type" value={buildingType} onChange={event=>{setBuildingType(event.target.value);setPageSize(12)}}><option value="all">All building types</option>{propertyCategories.map(type=><option key={type} value={type}>{type}</option>)}</select><select aria-label="Filter property status" value={filter} onChange={event => {setFilter(event.target.value as PropertyStatus | 'all');setPageSize(12)}}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Sort properties" value={sort} onChange={event => {setSort(event.target.value);setPageSize(12)}}><option value="priority">Highest priority</option><option value="name">Name A–Z</option></select><div className="view-toggle" aria-label="Property layout"><button aria-label="Grid view" aria-pressed={layout==='grid'} onClick={() => setLayout('grid')}><Icon name="grid" size={16}/></button><button aria-label="List view" aria-pressed={layout==='list'} onClick={() => setLayout('list')}><Icon name="list" size={18}/></button></div></div></div>
          <div className={layout === 'grid' ? 'property-grid' : 'property-grid property-list'}>{visible.slice(0,pageSize).map(site => <article className={'property-card ' + site.status} key={site.name} tabIndex={0} aria-label={'Quick overview: ' + site.name} onClick={() => openQuick(site.index)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openQuick(site.index) } }}>
            <div className="property-card-top"><img className="property-image" src={buildingImage(site.index)} alt={propertyTypes[site.index]+' illustration'} loading="lazy"/><span className="image-caption">Illustrative</span><span className={'status-pill ' + site.status}>{statusLabels[site.status]}</span></div>
            <div className="property-identity"><small>{propertyTypes[site.index]}</small><h3>{site.name}</h3><p><Icon name="pin" size={12}/>{locations[site.index].city}, {locations[site.index].state}</p></div>
            <div className="property-score"><span>Priority score</span><strong>{site.status === 'unknown' ? '—' : site.priority}<small> / 100</small></strong></div>
            <div className="priority-bar"><span className={site.status} style={{width: site.status === 'unknown' ? '0%' : site.priority + '%'}} /></div>
            <p className="attention-reason">{site.status === 'unknown' ? 'Complete the missing readings to assess this property.' : site.status === 'clear' ? 'No priority alert in the current sample readings.' : systems[site.lead].name + ' contributes most to estimated loss.'}</p>
            <button onClick={event => { event.stopPropagation(); openProperty(site.index) }}>{site.status === 'clear' ? 'View property' : 'Review action items'} <Icon name="arrow" size={15}/></button>
          </article>)}</div>
          {visible.length > 0 && <div className="property-pagination"><span>Showing {Math.min(pageSize,visible.length)} of {visible.length} properties</span>{pageSize<visible.length && <button className="secondary" onClick={() => setPageSize(pageSize+12)}>Show 12 more <Icon name="chevron" size={15}/></button>}</div>}
          {visible.length === 0 && <div className="empty"><h3>No properties match</h3><p>Try another name or remove the status filter.</p><button onClick={() => { setQuery(''); setFilter('all'); setBuildingType('all') }}>Clear filters</button></div>}
          <p className="note threshold-note">Demo alert thresholds · Critical ≥65 · Needs attention 25–64.9 · Clear &lt;25. Missing data is shown separately. Colors update from current inputs and fix previews.</p>
        </section>
      </> : <>
      <button className="back-link" onClick={() => { setAiPage(false); setHome(true); setMobileNav(false) }}>← Back to portfolio</button>
      <div className="property-hero"><img src={buildingImage(buildingIndex)} alt={propertyTypes[buildingIndex]+' illustration'}/><span>Illustrative building image</span></div>
      <section className="intro"><div><p className="label">PROPERTY OVERVIEW</p><h1>{building.name}</h1><p>{locations[buildingIndex].city}, {locations[buildingIndex].state} · {propertyTypes[buildingIndex]}</p></div><div className="property-stamp"><span className={'status-pill '+summaries[buildingIndex].status}>{statusLabels[summaries[buildingIndex].status]}</span><small>{locations[buildingIndex].city}, {locations[buildingIndex].state}</small></div></section>
      <label className="building-picker">Building
        <select value={buildingIndex} onChange={event => {
          const next = Number(event.target.value)
          openProperty(next)
        }}>
          {propertyCategories.map(type=><optgroup key={type} label={type}>{buildings.map((site,i)=>propertyTypes[i]===type ? <option key={site.name} value={i}>{site.name}</option> : null)}</optgroup>)}
        </select>
      </label>
      <div className="metrics" aria-live="polite">
        <section className="panel"><p className="label">BUILDING RISK</p><strong className="score">{valid ? score(total, reference) : '—'}<small> / 100</small></strong><p>Priority score (100 × exposure ÷ (exposure + K))</p></section>
        <section className="panel"><p className="label">EXPECTED LOSS</p><strong className="score">{valid ? money(total) : '—'}</strong><p>Sum of system estimates (risk factor × cost). Shared losses may overlap.</p></section>
        <section className="panel"><p className="label">SYSTEMS WITH DATA</p><strong className="score">{known.filter(Boolean).length} / 5</strong><p>Complete inputs · {tickets.length} demo work orders</p></section>
      </div>
      <section className="panel featured" id="fixes"><div className="section-heading"><div><p className="label">YOUR NEXT MOVE</p><h2>Action Items</h2><p>Highest estimated savings first. Preview a fix before creating a work order.</p></div><span className="count-badge">{ranked.length} options</span></div>
        <div className="full-recovery"><div><span className="recommendation">COMPLETE RECOVERY SCENARIO</span><h3>Resolve every equipment issue</h3><p>Preview a fully restored property with a modeled risk score of 0.</p><small>Assumes all faults are resolved. This is a demo scenario, not a guarantee of zero real-world risk.</small></div><div><small>Total estimated repair cost</small><strong>{money(inputs.reduce((sum, row) => sum + row.cost, 0))}</strong><button disabled={!valid || fullRecovery[buildingIndex]} onClick={() => setFullRecovery(current => current.map((value, index) => index === buildingIndex ? true : value))}>{fullRecovery[buildingIndex] ? 'Full recovery preview active' : 'Preview full recovery →'}</button></div></div>
        <div className="cards fixes">
        {ranked.map(({ index: i, benefit }, rank) => <article className="action" data-recommended={rank === 0 && benefit > 0} key={i}>
          <div className="action-name"><span className="rank">{String(rank + 1).padStart(2, '0')}</span><div>{rank === 0 && benefit > 0 && <span className="recommendation">RECOMMENDED FIRST</span>}<h3>{systems[i].action}</h3><p>{systems[i].name} · assumed {systems[i].reduction}% risk reduction</p></div></div>
          <div className="action-value"><small>Repair cost</small><strong>{money(inputs[i].cost)}</strong></div>
          <div className={benefit < 0 ? 'action-value savings negative' : 'action-value savings'}><small>Net savings</small><strong>{money(benefit)}</strong></div>
          <div className="action-buttons"><button disabled={!valid} onClick={() => setApplied([...applied, i])}>Preview fix ↗</button><button className="secondary" disabled={tickets.includes(i)} onClick={() => setTickets([...tickets, i])}>{tickets.includes(i) ? '✓ Order created' : '+ Work order'}</button></div>
        </article>)}
        {ranked.length === 0 && <p className="empty">No remaining actions to preview. Reset the demo to review the original assessment.</p>}
      </div>
      {fullRecovery[buildingIndex] && <p role="status">Full recovery preview: all modeled faults are assumed resolved. Original readings remain unchanged.</p>}
      {!fullRecovery[buildingIndex] && applied.length > 0 && <p role="status">Previewing completed fixes for {applied.map(i => systems[i].name).join(', ')}. Scores reflect the assumed improvement.</p>}
      {tickets.length > 0 && <div className="orders"><h3>Work orders · assigned to facilities</h3>{tickets.map(i => <p key={i}>CBRE-{String(buildingIndex+1).padStart(2,'0')}-{String(i+1).padStart(2,'0')} · {systems[i].action} · Open</p>)}<p className="note">A work order records a task. Completion is simulated separately. Session records clear on refresh.</p></div>}
      <button className="secondary" onClick={() => { setApplied([]); setTickets([]); setFullRecovery(current => current.map((value, index) => index === buildingIndex ? false : value)) }}>Reset demo</button></section>
      {!valid && <p role="alert" className="warning">Building score unavailable. Complete or verify missing readings to see the total.</p>}
      <section className="panel" id="systems"><h2>Equipment Health</h2><p>Select a system to see its readings and likely impact.</p><div className="cards system-cards">
        {systems.map((s, i) => <button className="system" key={s.name} aria-pressed={selected === i} onClick={() => setSelected(i)}><span className="system-name"><span className="system-icon"><Icon name={equipmentIcons[i]} size={22}/></span>{s.name}</span><strong>{!known[i] ? 'Unknown' : score(after[i], reference)}</strong><div className="risk-track"><span style={{ width: known[i] ? score(after[i], reference) + '%' : '0%' }} /></div><span>{!known[i] ? 'Insufficient evidence' : money(after[i]) + ' estimated loss'}</span></button>)}
      </div></section>
      <div className="columns">
        <section className="panel"><p className="label">CONNECTED IMPACT</p><h2>{system.name}</h2>
          <ol className="chain">{(selected < 2 && buildingIndex > 0 ? [...system.path.slice(0, 2), 'Indoor conditions worsen', 'Building operations disrupted'] : system.path).map(step => <li key={step}>{step}</li>)}</ol>
          <h3>Equipment readings</h3>
          <div className="reading-grid automatic-readings">{readings[selected].map(([label, target, critical], j) => (
            <div className={'reading-value '+((Number(input.readings[j])-target)/(critical-target)>0 ? 'off-target' : 'on-target')} key={label}><span>{label}</span><strong>{input.readings[j]}</strong><small><i className="status-dot"/>{(Number(input.readings[j])-target)/(critical-target)>0 ? 'Off target' : 'Within target'} · Target {target}</small></div>
          ))}</div>
          <p className="note">Read-only sample readings · alert thresholds used in the demo model {selected === 1 && <>(reference: <a href="https://faultdetection.lbl.gov/data/" target="_blank" rel="noreferrer">Berkeley Lab HVAC FDD · {building.dataset}</a>)</>}.</p>
        </section>
        <section className="panel auto-assessment"><div className="section-heading"><div><p className="label">AUTOMATIC ASSESSMENT</p><h2>Risk breakdown</h2></div><span className="count-badge">Read only</span></div>
          <p>Calculated from the equipment readings for this property.</p>
          <div className="auto-factor"><span>Estimated risk factor</span><strong>{factors[selected].toFixed(1)}<small>%</small></strong></div>
          <dl className="assessment-values"><div><dt>Estimated repair cost</dt><dd>{money(input.cost)}</dd></div><div><dt>Cost if equipment fails</dt><dd>{money(input.loss)}</dd></div><div><dt>Expected loss before action</dt><dd>{money(before[selected])}</dd></div></dl>
          <p className="note">Risk factor × failure cost = expected loss. Automatic screening uses demo thresholds, up to 8 points per reading. Priority score uses K = $10,000.</p>
        </section>
      </div>
      <details className="panel manual-panel" key={buildingIndex}>
        <summary><span>Manual scenario <small>Try your own estimates in a separate workspace</small></span><span className="manual-chevron" aria-hidden="true">⌄</span></summary>
        <div className="manual-content"><p>These estimates affect only this scenario. The automatic assessment and portfolio remain unchanged.</p>
          <label>Equipment to adjust<select value={manualSystem} onChange={event => setManualSystem(Number(event.target.value))}>{systems.map((item, i) => <option key={item.name} value={i}>{item.name}</option>)}</select></label>
          <div className="manual-fields">
            <label>Risk factor (%)<input type="number" min="0" max="100" step="any" value={manualRow.probability} onChange={event => updateManual('probability', event.target.value)} /></label>
            <label>Repair cost ($)<input type="number" min="0" max="1000000000" step="any" value={manualRow.cost} onChange={event => updateManual('cost', event.target.value)} /></label>
            <label>Cost if equipment fails ($)<input type="number" min="0" max="1000000000" step="any" value={manualRow.loss} onChange={event => updateManual('loss', event.target.value)} /></label>
          </div>
          <div className="manual-results" aria-live="polite"><div><small>Scenario building risk</small><strong>{manualValid ? score(manualTotal, reference) + ' / 100' : '—'}</strong></div><div><small>Scenario expected loss</small><strong>{manualValid ? money(manualTotal) : '—'}</strong></div><div><small>Selected action net savings</small><strong>{manualValid ? money(Number(manualRow.probability) / 100 * Number(manualRow.loss) * systems[manualSystem].reduction / 100 - Number(manualRow.cost)) : '—'}</strong></div></div>
          {!manualValid && <p role="status">Complete the scenario inputs to calculate results.</p>}
          <button className="secondary" onClick={() => setManualPortfolio(current => current.map((rows, index) => index === buildingIndex ? inputs.map((row, i) => ({ probability: String(factors[i]), loss: String(row.loss), cost: String(row.cost) })) : rows))}>Reset scenario to automatic values</button>
        </div>
      </details>
      </>}
      {!aiPage && <footer><span>◉ CBRE · Property operations</span><span>Sample buildings and readings · Illustrative estimates</span></footer>}
      {!aiPage && !home && (applied.length > 0 || fullRecovery[buildingIndex]) && <div className="preview-result" role="status"><span className="preview-result-icon"><Icon name="activity" size={20}/></span><div><small>{fullRecovery[buildingIndex] ? 'Full recovery scenario' : 'Action preview'} · modeled risk</small><strong><span>{score(before.reduce((sum, value) => sum + value, 0), reference)}</span><Icon name="arrow" size={17}/>{score(total, reference)}<small>/ 100</small></strong></div><div className="preview-savings"><small>Estimated loss avoided</small><strong>{money(before.reduce((sum, value) => sum + value, 0) - total)}</strong></div><button className="secondary" onClick={() => {setApplied([]);setFullRecovery(current => current.map((value,index) => index === buildingIndex ? false : value))}}>Clear preview</button></div>}
    </main>
      {!aiPage && <><button ref={helpButton} className="help-launcher" aria-label={helpOpen ? 'Close AI help' : 'Ask AI for help'} aria-expanded={helpOpen} aria-controls="ai-help" onClick={()=>setHelpOpen(!helpOpen)}><Icon name={helpOpen ? 'close' : 'sparkles'} size={19}/><span>{helpOpen ? 'Close help' : 'Ask AI'}</span></button>
      {helpOpen && <section id="ai-help" className="help-widget" role="region" aria-label="AI help"><div className="help-heading"><div><strong>How can we help?</strong><small>{building.name}</small></div><button className="secondary" aria-label="Open full-page AI assistant" onClick={()=>openAssistant(buildingIndex)}><Icon name="arrow" size={18}/></button><button className="secondary" aria-label="Close help panel" onClick={()=>{setHelpOpen(false);helpButton.current?.focus()}}><Icon name="close" size={18}/></button></div><PropertyAssistant help key={buildingIndex} context={assistantContext(buildingIndex)}/></section>}</>}

      <dialog ref={quickDialog} className="property-drawer" aria-labelledby="quick-title" onCancel={() => setQuickIndex(null)} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setQuickIndex(null) } }}>
        {quickIndex !== null && <div className="quick-shell">
          <div className="quick-topbar"><span><Icon name="building" size={16}/> PROPERTY INSIGHTS</span><button className="quick-close secondary" aria-label="Close quick overview" onClick={() => setQuickIndex(null)}><Icon name="close" size={20}/></button></div>
          <img className="inspector-image" src={buildingImage(quickIndex)} alt={propertyTypes[quickIndex]+' illustration'}/><header className="inspector-heading"><span className={'status-pill '+summaries[quickIndex].status}>{statusLabels[summaries[quickIndex].status]}</span><h2 id="quick-title">{buildings[quickIndex].name}</h2><p><Icon name="pin" size={13}/>{locations[quickIndex].city}, {locations[quickIndex].state} · {propertyTypes[quickIndex]}</p></header>
          <div className="inspector-launch"><span>Property overview</span><button className="secondary" onClick={()=>openAssistant(quickIndex)}><Icon name="sparkles" size={15}/> Ask AI <Icon name="arrow" size={14}/></button></div>
          <div className="quick-body">
            <div className="quick-metrics"><div><span>Priority score</span><strong>{summaries[quickIndex].priority}<small>/100</small></strong><div className="priority-bar"><span className={summaries[quickIndex].status} style={{width:summaries[quickIndex].priority+'%'}}/></div></div><div><span>Expected loss</span><strong>{money(summaries[quickIndex].exposure)}</strong><small>{fullRecovery[quickIndex] ? 'Full recovery preview' : 'Based on current assessment'}</small></div></div>
            {quickAction && quickAction.benefit>0 ? <section className="quick-next"><div className="quick-section-title"><h3>Recommended action</h3><span>01</span></div><p>{systems[quickAction.index].action}</p><div className="quick-action-cost"><span>Repair cost<strong>{money(portfolio[quickIndex][quickAction.index].cost)}</strong></span><span>Estimated net savings<strong>{money(quickAction.benefit)}</strong></span></div></section> : <section className="quick-next quiet"><Icon name="check" size={18}/><p>{fullRecovery[quickIndex] ? 'Full recovery is being previewed. Original readings are preserved.' : 'No repair currently shows positive modeled net savings. Review equipment details for context.'}</p></section>}
            <section className="quick-equipment"><div className="quick-section-title"><h3>Equipment health</h3><span>5 systems</span></div>{systems.map((item,i) => {const row=portfolio[quickIndex][i];const exposure=fullRecovery[quickIndex] ? 0 : riskFactor(row,i,true)/100*row.loss*(previews[quickIndex].includes(i)?1-item.reduction/100:1);const value=Number(score(exposure,reference));const status=value>=65?'critical':value>=25?'attention':'clear';return <div className="quick-equipment-row" key={item.name}><span className="quick-equipment-icon"><Icon name={equipmentIcons[i]} size={17}/></span><span>{item.name}</span><div className="priority-bar"><span className={status} style={{width:value+'%'}}/></div><strong>{value.toFixed(1)}</strong></div>})}</section>
            <p className="quick-footnote">Sample readings · Screening scores, not failure probabilities.</p>
          </div>
          <div className="quick-footer"><button onClick={() => openProperty(quickIndex)}>Review action items <Icon name="arrow" size={17}/></button><small>Compare repairs and preview their impact</small></div>
        </div>}

      </dialog>
    </div>
  )
}
export default App




