import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
type Message = { role: 'user' | 'assistant'; content: string }
export default function PropertyAssistant({ context, help = false }: { help?: boolean; context: { name: string; [key: string]: unknown } }) {
  const [role,setRole] = useState('manager')
  const [messages,setMessages] = useState<Message[]>([])
  const [draft,setDraft] = useState('')
  const [busy,setBusy] = useState(false)
  const [ready,setReady] = useState<boolean | null>(null)
  const [error,setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const check = new AbortController()
    fetch('/api/assistant/status',{signal:check.signal}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>setReady(data.ready === true)).catch(()=>{if(!check.signal.aborted)setReady(false)})
    return ()=>{check.abort();controller.current?.abort()}
  },[])
  useEffect(()=>{if(messages.length || busy || error)end.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[messages,busy,error])
  async function send(text: string) {
    if(!text.trim() || busy || !ready)return
    const next: Message[] = [...messages,{role:'user',content:text.trim()}]
    setMessages(next);setDraft('');setError('');setBusy(true)
    const abort = new AbortController();controller.current=abort
    try {
      const response = await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,context,messages:next.slice(-19)}),signal:abort.signal})
      const data = await response.json()
      if(!response.ok)throw new Error(data.error || 'Unable to get an answer.')
      setMessages([...next,{role:'assistant',content:data.answer}])
    } catch(e) {
      if(!abort.signal.aborted){setError(e instanceof Error ? e.message : 'Connection interrupted. Try again.');setMessages(next.slice(0,-1));setDraft(text)}
    } finally {if(!abort.signal.aborted)setBusy(false)}
  }
  const suggestions = help ? ['How do I use this app?', 'What does the risk score mean?'] : role==='executive' ? ['Give me a 30-second business briefing.','Which repair offers the best estimated return?'] : role==='technician' ? ['Which readings should I investigate first?','What should I verify before closing the task?'] : ['What needs my attention first?','Explain the recommended action and its cost.']
  return <section className="assistant-pane" aria-label="Property AI assistant">
    <div className="assistant-controls"><label>Answer for<select value={role} disabled={busy} onChange={e=>{setRole(e.target.value);setMessages([]);setError('')}}><option value="manager">Facilities manager</option><option value="technician">Technician</option><option value="executive">Portfolio executive</option></select></label><button className="secondary" disabled={busy || !messages.length} onClick={()=>{setMessages([]);setError('');setDraft('')}}>New chat</button></div>
    <div className="assistant-feed" role="log" aria-label="Conversation" aria-live="polite">
      {messages.length===0 && <div className="assistant-welcome"><span className="assistant-orb"><Icon name="sparkles" size={26}/></span><h3>{help ? 'A little guidance.' : 'A clearer next step.'}</h3><p>{help ? 'Ask how the app works, what a score means, or what to do next for this property.' : "Ask about this property's risks, repair options, or business impact. Answers use the assessment you see here."}</p><div className="assistant-suggestions">{suggestions.map(text=><button className="secondary" key={text} disabled={!ready} onClick={()=>void send(text)}>{text}<Icon name="arrow" size={15}/></button>)}</div><small>Property context · 5 systems · Current repair previews</small></div>}
      {ready===false && <div className="assistant-notice"><strong>Connect AI to start</strong><p>The risk assessment is ready. To enable conversations, add your API key to <code>app/.env</code> and restart the app. Setup steps are in the app README.</p></div>}
      {messages.map((message,i)=><div className={'chat-message '+message.role} key={i}><span>{message.role==='user'?'You':'CBRE Assistant'}</span><div>{message.content}</div></div>)}
      {busy && <div className="assistant-thinking" role="status">Reviewing this property's assessment…</div>}
      {error && <p className="assistant-notice" role="alert">{error} Your question is below so you can retry.</p>}
      <div ref={end}/>
    </div>
    <form className="assistant-composer" onSubmit={e=>{e.preventDefault();void send(draft)}}><label className="sr-only" htmlFor="assistant-question">Ask about this property</label><div><textarea id="assistant-question" placeholder={ready?'Ask about this property…':'AI connection required'} value={draft} disabled={!ready || busy} maxLength={2000} rows={2} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(draft)}}}/><button aria-label="Send message" disabled={!ready || busy || !draft.trim()}><Icon name="arrow" size={18}/></button></div><small>{ready===null?'Checking connection…':'AI explains; the risk model calculates. Verify before acting.'}</small></form>
  </section>
}


