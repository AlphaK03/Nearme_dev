import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, ChevronRight, Clock3, Coffee, Compass, Crosshair, Download, Footprints, Bike, Car, Heart, Hourglass, Landmark, Leaf, LoaderCircle, Map, MapPin, Navigation, Palette, Plus, RefreshCw, Route, Search, Settings2, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Sun, Trees, Trash2, WifiOff, X, ExternalLink, Share2, CircleCheck, Info } from 'lucide-react';
import MapView from './MapView.jsx';
import { api, categories, defaultOrigin, defaults, directionsUrl, distance, duration, exportGpx, load, localDate, nextDeparture, persist, time } from './lib.js';

const icons = { Coffee, Trees, Landmark, Hourglass, Palette, ShoppingBag };
const modes = [{ id: 'foot', label: 'A pie', Icon: Footprints }, { id: 'bike', label: 'Bicicleta', Icon: Bike }, { id: 'car', label: 'En auto', Icon: Car }];
function CategoryIcon({ id, size = 20 }) { const category = categories.find(c => c.id === id) || categories[0]; const Icon = icons[category.icon]; return <span className={`category-icon ${category.tone}`}><Icon size={size} /></span>; }
function Brand() { return <span className="brand"><span className="brand-symbol"><Navigation size={23} fill="currentColor" /></span>NearMe<span className="brand-period">.</span></span>; }

function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);
  return <dialog ref={ref} className={`sheet ${wide ? 'wide' : ''}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="sheet-grip" /><header className="sheet-header"><h2>{title}</h2><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={21} /></button></header>{children}
  </dialog>;
}

export default function App() {
  const [tab, setTab] = useState(() => ['explore', 'map', 'route', 'saved', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'explore');
  const [origin, setOrigin] = useState(defaultOrigin);
  const [config, setConfig] = useState(() => ({ ...defaults, ...load('preferences', {}), startAt: nextDeparture() }));
  const [search, setSearch] = useState(null);
  const [selected, setSelected] = useState([]);
  const [focus, setFocus] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState(() => load('current-plan', null));
  const [saved, setSaved] = useState(() => load('saved', []));
  const [progress, setProgress] = useState(() => load('progress', { id: null, completed: [], startedAt: null }));
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [picking, setPicking] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const request = useRef(null);
  const main = useRef(null);

  useEffect(() => {
    api('health').then(setHealth).catch(() => {});
    fetchPlaces(defaultOrigin, config.radiusKm);
    const onHash = () => setTab(['explore', 'map', 'route', 'saved', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'explore');
    const onOnline = () => setOffline(!navigator.onLine);
    const onInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('hashchange', onHash); window.addEventListener('online', onOnline); window.addEventListener('offline', onOnline); window.addEventListener('beforeinstallprompt', onInstall);
    const timer = setInterval(() => setTick(Date.now()), 30_000);
    return () => { request.current?.abort(); clearInterval(timer); window.removeEventListener('hashchange', onHash); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOnline); window.removeEventListener('beforeinstallprompt', onInstall); };
  }, []);
  useEffect(() => { persist('preferences', config); }, [config]);
  useEffect(() => { persist('current-plan', plan); }, [plan]);
  useEffect(() => { persist('progress', progress); }, [progress]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); } }, [notice]);

  function navigate(value) { location.hash = value; setTab(value); setFocus(null); setError(''); main.current?.scrollTo(0, 0); }
  function updateConfig(key, value) { setConfig(previous => ({ ...previous, [key]: value })); }
  async function fetchPlaces(point = origin, radiusKm = config.radiusKm) {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setSearching(true); setError('');
    try { const result = await api('places', { origin: { lat: point.lat, lng: point.lng }, radiusKm }, controller.signal); setSearch(result); setSelected([]); return result; }
    catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { if (!controller.signal.aborted) setSearching(false); }
  }
  function chooseOrigin(point) { setOrigin(point); setSearch(null); setSelected([]); setPicking(false); setModal(null); fetchPlaces(point); }
  function locate() {
    if (!navigator.geolocation) { setError('Este navegador no permite obtener la ubicación. Elige un punto en el mapa.'); return; }
    setNotice('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(position => {
      chooseOrigin({ lat: position.coords.latitude, lng: position.coords.longitude, label: 'Mi ubicación actual' }); setNotice('Punto de partida actualizado.');
    }, () => { setError('No pudimos obtener tu ubicación. Permite el acceso o elige tu salida en el mapa.'); setNotice(''); }, { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 });
  }
  function togglePlace(id) { setSelected(previous => previous.includes(id) ? previous.filter(p => p !== id) : previous.length < 10 ? [...previous, id] : previous); }
  function toggleInterest(id) { setConfig(previous => ({ ...previous, interests: previous.interests.includes(id) ? previous.interests.filter(i => i !== id) : [...previous.interests, id] })); }
  async function generate(recalculate = false) {
    if (planning) return;
    if (!config.interests.length) { setError('Selecciona al menos un interés.'); return; }
    setPlanning(true); setError('');
    try {
      let point = origin;
      let ids = selected;
      let settings = { ...config, startAt: new Date(config.startAt).toISOString() };
      let data = search;
      if (recalculate && plan) {
        const completed = progress.id === plan.id ? progress.completed : [];
        const visited = plan.stops.filter(p => completed.includes(p.id));
        point = visited.at(-1) || plan.config.origin;
        ids = plan.stops.filter(p => !completed.includes(p.id)).map(p => p.id);
        if (!ids.length) throw new Error('Ya completaste todas las paradas. Crea un recorrido nuevo.');
        data = await api('places', { origin: { lat: point.lat, lng: point.lng }, radiusKm: 10 });
        ids = ids.filter(id => data.places.some(p => p.id === id));
        if (!ids.length) throw new Error('No encontramos las paradas pendientes. Actualiza la búsqueda.');
        settings = { ...settings, startAt: new Date().toISOString(), useAi: false };
      }
      if (!data) data = await api('places', { origin: { lat: point.lat, lng: point.lng }, radiusKm: config.radiusKm });
      const payload = { ...settings, origin: { lat: point.lat, lng: point.lng }, searchId: data.searchId, placeIds: ids };
      let result;
      try { result = await api('plan', payload); }
      catch (failure) {
        if (!failure.message.includes('expiró')) throw failure;
        data = await api('places', { origin: payload.origin, radiusKm: config.radiusKm });
        result = await api('plan', { ...payload, searchId: data.searchId, placeIds: ids.filter(id => data.places.some(p => p.id === id)) });
      }
      setSearch(data); setOrigin(point); setPlan(result); setProgress({ id: result.id, completed: [], startedAt: recalculate ? Date.now() : null });
      setModal(null); navigate('route'); setNotice(recalculate ? 'Recorrido reajustado con tus paradas pendientes.' : 'Tu recorrido está listo.');
      api('health').then(setHealth).catch(() => {});
    } catch (failure) { setError(failure.message); }
    finally { setPlanning(false); }
  }
  function saveRoute() {
    if (!plan) return;
    const next = [plan, ...saved.filter(p => p.id !== plan.id)].slice(0, 20);
    if (persist('saved', next)) { setSaved(next); setNotice('Ruta guardada en este dispositivo.'); }
    else setError('No hay suficiente espacio local para guardar esta ruta.');
  }
  async function install() {
    if (installPrompt) { await installPrompt.prompt(); setInstallPrompt(null); }
    else setModal('install');
  }
  async function share() {
    if (!plan) return;
    const text = `${plan.title}\n${plan.stops.map((p, i) => `${i + 1}. ${p.name} (${time(p.arrival)})`).join('\n')}\n${duration(plan.totalMinutes)} · ${distance(plan.meters)}\nCreado con NearMe. Confirma horarios antes de salir.`;
    try { if (navigator.share) await navigator.share({ title: plan.title, text }); else { await navigator.clipboard.writeText(text); setNotice('Itinerario copiado.'); } } catch (failure) { if (failure.name !== 'AbortError') setNotice('Usa Descargar GPX para compartir la ruta.'); }
  }
  const places = search?.places || [];
  const filtered = places.filter(p => (filter === 'all' || p.category === filter) && p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const focused = places.find(p => p.id === focus) || plan?.stops.find(p => p.id === focus);
  const completed = progress.id === plan?.id ? progress.completed : [];
  const nextStop = plan?.stops.find(p => !completed.includes(p.id));
  const active = progress.id === plan?.id && progress.startedAt;
  const finished = plan && completed.length === plan.stops.length;
  const elapsed = active ? Math.max(0, Math.floor((tick - progress.startedAt) / 60_000)) : 0;
  const nav = [{ id: 'explore', label: 'Descubrir', Icon: Compass }, { id: 'map', label: 'Mapa', Icon: Map }, { id: 'route', label: 'Mi recorrido', Icon: Route }, { id: 'saved', label: 'Guardados', Icon: Bookmark }];
  const mapProps = { origin: tab === 'route' && plan ? plan.config.origin : origin, places: filtered, selected, plan: tab === 'route' ? plan : null, focus, onPlace: setFocus, picking, onPick: chooseOrigin, onLocate: locate };

  return <div className="app-shell">
    <aside className="sidebar"><button className="brand-button" onClick={() => navigate('explore')}><Brand /></button><p className="sidebar-tagline">Cada lugar, a tu medida.</p><span className="nav-caption">TU ESPACIO</span><nav aria-label="Navegación principal">{nav.map(({ id, label, Icon }) => <button key={id} className={`nav-link ${tab === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span>{id === 'saved' && saved.length > 0 && <small>{saved.length}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="install-card"><span className="install-icon"><Navigation size={24} /></span><b>Siempre cerca de ti</b><p>Lleva NearMe en tu pantalla de inicio.</p><button onClick={install}>Instalar aplicación <ArrowRight size={16} /></button></div><button className={`nav-link ${tab === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}><Settings2 size={20} />Preferencias</button><span className="sidebar-foot"><span className="live-dot" /> Hecho para explorar</span></div></aside>
    <div className="workspace"><header className="topbar"><div className="mobile-brand"><Brand /></div><div className="desktop-breadcrumb">Tu espacio <ChevronRight size={14} /><strong>{tab === 'settings' ? 'Preferencias' : nav.find(n => n.id === tab)?.label}</strong></div><button className="location-button" onClick={() => setModal('location')}><MapPin size={17} /><span>{origin.label || 'Punto de partida'}</span><ChevronDown size={14} /></button><button className="avatar-button" aria-label="Preferencias" onClick={() => navigate('settings')}><Settings2 size={20} /></button></header>
      {offline && <div className="offline-banner" role="status"><WifiOff size={16} /> Sin conexión. Puedes consultar tus rutas guardadas; el mapa y los nuevos cálculos necesitan internet.</div>}
      {error && !modal && <div className="error-banner" role="alert"><Info size={19} /><span>{error}</span><button aria-label="Cerrar aviso" onClick={() => setError('')}><X size={18} /></button></div>}
      <main ref={main} className={`main-content tab-${tab}`}>
        {tab === 'explore' && <>
          <section className="page-intro"><div><span className="eyebrow">SAL DE LA RUTINA</span><h1>Tu próximo plan<br className="mobile-only" /> está cerca<span>.</span></h1><p>Un café, un museo, un respiro. Descubre lo que te rodea.</p></div><span className="date-chip"><Sun size={18} /> {new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long' })}</span></section>
          <section className="discovery-layout"><div className="discovery-column"><div className="planner-hero"><div className="hero-topline"><span><Sparkles size={15} /> UN PLAN MUY TUYO</span><Navigation size={26} /></div><h2>Menos planear.<br /><em>Más descubrir.</em></h2><p>Combina tus intereses con el tiempo que tienes. Nosotros conectamos las paradas.</p><div className="hero-facts"><span><Clock3 size={15} /> {duration(config.minutes)}</span><span><Footprints size={15} /> Hasta {config.maxDistanceKm} km</span></div><button className="button lime" onClick={() => { setError(''); setModal('plan'); }}>Crear mi recorrido <ArrowRight size={18} /></button><small><ShieldCheck size={14} /> Trayectos reales · Tu ritmo · Tus decisiones</small></div><div className="location-card"><span className="category-icon mint"><Crosshair size={22} /></span><div><small>EXPLORANDO DESDE</small><b>{origin.label || 'Punto seleccionado'}</b></div><button aria-label="Cambiar ubicación" className="icon-button" onClick={() => setModal('location')}><ChevronRight size={20} /></button></div></div><div className="home-map"><MapView {...mapProps} /><button className="map-expand" onClick={() => navigate('map')}><Map size={16} /> Explorar mapa <ArrowRight size={15} /></button></div></section>
          <section className="places-section"><div className="section-heading"><div><span className="eyebrow">PEQUEÑOS DESCUBRIMIENTOS</span><h2>Lugares para tu próximo plan</h2></div><button className="text-button" onClick={() => fetchPlaces()} disabled={searching}><RefreshCw size={16} className={searching ? 'spinning' : ''} /><span>Actualizar</span></button></div><div className="discovery-tools"><div className="filter-strip"><button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}><Compass size={16} /> Todos</button>{categories.map(c => { const Icon = icons[c.icon]; return <button key={c.id} className={`filter-chip ${filter === c.id ? 'active' : ''}`} onClick={() => setFilter(c.id)}><Icon size={16} />{c.label}</button>; })}</div><label className="search-box"><Search size={18} /><input placeholder="Buscar entre los lugares" aria-label="Buscar lugares" value={query} onChange={event => setQuery(event.target.value)} /></label></div><div className="results-meta"><span>{searching ? 'Consultando lugares cercanos…' : `${filtered.length} lugares a tu alrededor`}</span><span>OpenStreetMap · {config.radiusKm} km de radio</span></div>{searching ? <div className="skeleton-grid">{[1, 2, 3, 4].map(n => <div className="skeleton-card" key={n} />)}</div> : filtered.length ? <div className="places-grid">{filtered.slice(0, 24).map(place => <PlaceCard key={place.id} place={place} selected={selected.includes(place.id)} onSelect={() => togglePlace(place.id)} onOpen={() => { setFocus(place.id); setModal('place'); }} />)}</div> : <Empty Icon={Search} title={search ? 'Un poco más allá puede estar tu plan' : 'Busquemos tu próximo lugar'} text={search ? 'Prueba otra categoría o amplía el radio en Preferencias.' : 'Actualiza la búsqueda para consultar lugares reales.'} action="Buscar lugares" onAction={() => fetchPlaces()} />}</section>
        </>}
        {tab === 'map' && <div className="full-map"><MapView {...mapProps} /><div className="map-bottom-card">{focused ? <><CategoryIcon id={focused.category} /><div><b>{focused.name}</b><small>{focused.distanceKm} km · Visita estimada de {focused.visitMinutes} min</small></div><button className="icon-button" aria-label="Detalles del lugar" onClick={() => setModal('place')}><ChevronRight /></button></> : <><span className="category-icon mint"><MapPin /></span><div><b>{picking ? 'Elige tu punto de partida' : `${places.length} lugares por descubrir`}</b><small>{picking ? 'Toca cualquier punto en el mapa' : 'Toca un marcador para conocer el lugar'}</small></div><button className="icon-button" aria-label="Cambiar ubicación" onClick={() => setModal('location')}><Crosshair /></button></>}</div></div>}
        {tab === 'route' && (plan ? <>
          <div className="route-heading"><div><span className="eyebrow">{finished ? 'RECORRIDO COMPLETADO' : active ? 'TU RECORRIDO EN CURSO' : 'LISTO PARA SALIR'}</span><h1>{plan.title}</h1><p>{plan.summary}</p></div><div className="route-actions"><button className="icon-button" aria-label="Guardar ruta" onClick={saveRoute}><Bookmark size={20} fill={saved.some(p => p.id === plan.id) ? 'currentColor' : 'none'} /></button><button className="icon-button" aria-label="Compartir itinerario" onClick={share}><Share2 size={20} /></button><button className="icon-button" aria-label="Descargar GPX" onClick={() => exportGpx(plan)}><Download size={20} /></button></div></div>
          <div className="route-layout"><div className="route-information"><div className="route-stats"><div><Clock3 /><b>{duration(plan.totalMinutes)}</b><small>tiempo total</small></div><div><Route /><b>{distance(plan.meters)}</b><small>recorrido</small></div><div><MapPin /><b>{plan.stops.length}</b><small>paradas</small></div></div><div className="route-status"><span className="live-dot" /><span>{plan.advice.used ? `${plan.advice.cached ? 'Selección reutilizada' : 'Selección personalizada'} con ChatGPT` : 'Ruta calculada con tus preferencias'}</span></div>{!plan.advice.used && plan.config.useAi && <p className="muted small">{plan.advice.reason}</p>}
          <div className="timeline"><div className="origin-stop"><span className="origin-dot" /><div><b>Punto de partida</b><small>{time(plan.config.startAt)} · {modes.find(m => m.id === plan.config.mode)?.label}</small></div></div>{plan.stops.map((stop, index) => <div className={`timeline-stop ${completed.includes(stop.id) ? 'completed' : ''}`} key={stop.id}><div className="travel-line"><Footprints size={13} />{stop.travelMinutes} min de traslado · {distance(stop.travelMeters)}</div><div className="stop-content"><span className="stop-number">{completed.includes(stop.id) ? <Check size={15} /> : index + 1}</span><div className="stop-copy"><span className="stop-time">{time(stop.arrival)} — {time(stop.departure)}</span><button onClick={() => { setFocus(stop.id); setModal('place'); }}>{stop.name}</button><small>{categories.find(c => c.id === stop.category)?.label} · {stop.visitMinutes} min de visita</small></div><CategoryIcon id={stop.category} /></div></div>)}{plan.config.roundTrip && <div className="return-stop"><Route size={16} /> Regreso al punto de partida</div>}</div>
          <div className="route-time-note"><Info size={16} /><p>Incluye {plan.travelMinutes} min de traslado, {plan.visitMinutes} min de visitas y {plan.bufferMinutes} min de margen. Finaliza a las {time(plan.endAt)}.</p></div>
          {active && !finished && <div className="active-card"><span className="eyebrow">SIGUIENTE PARADA</span><h3>{nextStop?.name}</h3><p>{duration(elapsed)} transcurridos · {completed.length}/{plan.stops.length} paradas completadas</p><a className="button" href={directionsUrl(completed.length ? plan.stops.find(p => p.id === completed.at(-1)) : plan.config.origin, nextStop, plan.config.mode)} target="_blank" rel="noopener noreferrer"><Navigation size={17} /> Cómo llegar</a><button className="button secondary" onClick={() => { setProgress(p => ({ ...p, completed: [...p.completed, nextStop.id] })); setNotice('Parada completada. ¡Sigamos descubriendo!'); }}><Check size={17} /> Completar parada</button></div>}
          {finished ? <div className="finish-card"><CircleCheck size={32} /><h3>Un recorrido, nuevos recuerdos.</h3><p>Completaste todas las paradas. Guarda este plan para otra ocasión.</p><button className="button" onClick={saveRoute}>Guardar mi recorrido <Bookmark size={17} /></button></div> : !active && <button className="button full" onClick={() => { setProgress({ id: plan.id, completed: [], startedAt: Date.now() }); setTick(Date.now()); }}><Navigation size={18} /> Iniciar recorrido</button>}
          {!finished && <button className="button secondary full" onClick={() => { setError(''); updateConfig('minutes', Math.max(15, plan.totalMinutes - elapsed)); setModal('replan'); }}><RefreshCw size={17} /> Tengo menos tiempo</button>}
          </div><div className="route-map-column"><MapView {...mapProps} /><div className="safety-card"><ShieldCheck size={22} /><div><h3>Explora con información</h3>{plan.warnings.map(w => <p key={w}>{w}</p>)}{plan.advice.tips?.map(t => <p key={t}>{t}</p>)}{plan.omitted.length > 0 && <p><b>No incluidas por los límites:</b> {plan.omitted.join(', ')}.</p>}<small>Fuente del trayecto: {plan.routingSource}</small></div></div></div></div>
        </> : <Empty Icon={Route} title="Tu próximo recorrido empieza aquí" text="Elige tus intereses, el tiempo disponible y tu punto de partida. Creamos una ruta con lugares reales." action="Crear mi recorrido" onAction={() => setModal('plan')} />)}
        {tab === 'saved' && <><section className="page-intro"><div><span className="eyebrow">PARA VOLVER A VIVIRLO</span><h1>Tus recorridos guardados<span>.</span></h1><p>Planes que se quedan contigo, en este dispositivo.</p></div></section>{saved.length ? <div className="saved-grid">{saved.map(item => <article className="saved-card" key={item.id}><div className="saved-art"><Route size={46} /><span>{item.stops.length} paradas</span></div><div className="saved-content"><small>{new Date(item.createdAt).toLocaleDateString('es-CR')}</small><h2>{item.title}</h2><p>{item.stops.map(p => p.name).join(' → ')}</p><div className="saved-meta"><span><Clock3 size={15} />{duration(item.totalMinutes)}</span><span><Footprints size={15} />{distance(item.meters)}</span></div><div className="saved-buttons"><button className="button secondary" onClick={() => { setPlan(item); navigate('route'); }}>Ver recorrido <ArrowRight size={16} /></button><button className="icon-button" aria-label={`Eliminar ${item.title}`} onClick={() => { const next = saved.filter(p => p.id !== item.id); persist('saved', next); setSaved(next); }}><Trash2 size={18} /></button></div></div></article>)}</div> : <Empty Icon={Bookmark} title="Guarda un plan para después" text="Tus rutas favoritas aparecerán aquí. Abre un recorrido y toca el marcador para guardarlo." action="Descubrir lugares" onAction={() => navigate('explore')} />}</>}
        {tab === 'settings' && <><section className="page-intro"><div><span className="eyebrow">A TU MANERA</span><h1>Lo que te mueve<span>.</span></h1><p>Tus preferencias se guardan automáticamente en este dispositivo.</p></div></section><div className="settings-layout"><section className="settings-card"><h2>Tus intereses</h2><p>Ayúdanos a elegir los lugares que van contigo.</p><InterestPicker config={config} toggle={toggleInterest} /><label className="field-label">Radio de búsqueda <span>{config.radiusKm} km</span><input type="range" min="0.5" max="10" step="0.5" value={config.radiusKm} onChange={e => updateConfig('radiusKm', Number(e.target.value))} /></label><button className="button full" onClick={async () => { const result = await fetchPlaces(); if (result) navigate('explore'); }} disabled={searching}>{searching ? <LoaderCircle className="spinning" /> : <Search size={18} />}Actualizar recomendaciones</button></section><section className="settings-card"><h2>Tu app, siempre a mano</h2><p>Instala NearMe para abrirla sin la barra del navegador.</p><button className="button secondary full" onClick={install}><Download size={18} /> Instalar aplicación</button><hr /><h3>Inteligencia artificial</h3><p>{health?.ai?.configured ? 'OpenAI está conectado. La IA ayuda a interpretar tus preferencias; los trayectos se verifican con el motor de rutas.' : 'El cálculo de rutas funciona sin IA. La conexión con OpenAI está pendiente o el servidor no responde.'}</p><div className="usage-box"><Sparkles size={20} /><div><b>{health?.ai?.calls ?? 0} / {health?.ai?.maxCalls ?? 30} consultas de prueba</b><small>La caché evita repetir consultas. Reajustar no consume IA.</small></div></div><hr /><h3>Privacidad y datos</h3><p>La ubicación se solicita solo al pulsar «Usar mi ubicación». Guardamos preferencias y rutas en este navegador. OpenStreetMap recibe las coordenadas para buscar y trazar; a OpenAI se envían nombres y categorías de hasta 10 lugares y tu petición, sin coordenadas GPS precisas.</p><p>Evita incluir datos personales en tus indicaciones. El mapa necesita internet; los recorridos guardados pueden consultarse sin conexión después de abrir la app.</p></section></div></>}
      </main>
      {selected.length > 0 && ['explore', 'map'].includes(tab) && <div className="selection-dock"><div><b>{selected.length} {selected.length === 1 ? 'lugar elegido' : 'lugares elegidos'}</b><small>Organizamos el orden por ti</small></div><button className="button lime" onClick={() => setModal('plan')}>Crear ruta <ArrowRight size={17} /></button><button aria-label="Vaciar selección" className="dock-close" onClick={() => setSelected([])}><X size={18} /></button></div>}
      <nav className="mobile-nav" aria-label="Navegación móvil">{nav.map(({ id, label, Icon }) => <button className={tab === id ? 'active' : ''} key={id} onClick={() => navigate(id)}><span><Icon size={21} /></span><small>{label}</small></button>)}</nav>
    </div>
    {notice && <div className="toast" role="status"><Check size={18} />{notice}</div>}
    {(modal === 'plan' || modal === 'replan') && <Modal title={modal === 'replan' ? 'Ajustemos tu recorrido' : 'Un recorrido a tu medida'} onClose={() => { if (!planning) setModal(null); }} wide>
      <div className="sheet-body"><p className="sheet-description">{modal === 'replan' ? 'Conservaremos las paradas pendientes que quepan en tu nuevo tiempo. Partiremos desde tu última parada completada y usaremos la hora actual.' : selected.length ? `${selected.length} lugares elegidos. Incluiremos los que quepan en tus límites.` : 'Elegiremos lugares cercanos según tus intereses y tus límites.'}</p><div className="form-grid"><div><h3>¿Qué quieres descubrir?</h3><InterestPicker config={config} toggle={toggleInterest} /></div><div className="route-controls"><label className="field-label">{modal === 'replan' ? 'Tiempo restante' : 'Tiempo disponible'}<span>{duration(config.minutes)}</span><input type="range" min="15" max="480" step="15" value={config.minutes} onChange={e => updateConfig('minutes', Number(e.target.value))} /></label><label className="field-label">Distancia total máxima<span>{config.maxDistanceKm} km</span><input type="range" min="0.5" max="30" step="0.5" value={config.maxDistanceKm} onChange={e => updateConfig('maxDistanceKm', Number(e.target.value))} /></label><fieldset className="mode-field"><legend>¿Cómo te mueves?</legend><div className="segmented">{modes.map(({ id, label, Icon }) => <button key={id} className={config.mode === id ? 'active' : ''} onClick={() => updateConfig('mode', id)}><Icon size={18} />{label}</button>)}</div></fieldset>{modal !== 'replan' && <label className="field-label">Hora de salida<input type="datetime-local" value={config.startAt} onChange={e => updateConfig('startAt', e.target.value)} /></label>}</div></div><div className="toggle-group"><Toggle checked={config.roundTrip} onChange={v => updateConfig('roundTrip', v)} title="Volver al punto de partida" detail="El regreso también cuenta en tus límites." Icon={Route} /><Toggle checked={config.daylightOnly} onChange={v => updateConfig('daylightOnly', v)} title="Solo con luz de día" detail="Consideramos el atardecer estimado en tu ubicación." Icon={Sun} />{modal !== 'replan' && <Toggle checked={config.useAi} onChange={v => updateConfig('useAi', v)} title="Personalizar con ChatGPT" detail="Una consulta breve para elegir mejor; la ruta se verifica después." Icon={Sparkles} />}</div>{config.useAi && modal !== 'replan' && <label className="field-label prompt-label">Dale tu toque personal <small>Opcional · {config.prompt.length}/400</small><textarea rows="2" maxLength="400" placeholder="Por ejemplo: un café tranquilo y algo de historia, sin centros comerciales…" value={config.prompt} onChange={e => updateConfig('prompt', e.target.value)} /><span className="input-hint">Tu texto se envía a OpenAI. Evita datos personales.</span></label>}{error && <div className="inline-error" role="alert">{error}</div>}</div><footer className="sheet-footer"><span><ShieldCheck size={16} /> Tiempos y distancias verificados</span><button className="button" disabled={planning || !config.interests.length || !config.startAt || offline} onClick={() => generate(modal === 'replan')}>{planning ? <><LoaderCircle className="spinning" size={18} /> Calculando tu ruta…</> : <><Sparkles size={18} />{modal === 'replan' ? 'Recalcular recorrido' : 'Encontrar mi recorrido'}<ArrowRight size={17} /></>}</button></footer>
    </Modal>}
    {modal === 'location' && <LocationModal onClose={() => setModal(null)} onChoose={chooseOrigin} onLocate={() => { setModal(null); locate(); }} onPick={() => { setModal(null); setPicking(true); navigate('map'); }} />}
    {modal === 'place' && focused && <Modal title={focused.name} onClose={() => setModal(null)}><div className="sheet-body"><div className="place-detail-head"><CategoryIcon id={focused.category} size={30} /><div><span className="eyebrow">{categories.find(c => c.id === focused.category)?.label}</span><p>{focused.address || 'Ubicación registrada en OpenStreetMap'}</p></div></div><div className="detail-stats"><span><Footprints size={18} />{focused.distanceKm} km desde la búsqueda</span><span><Clock3 size={18} />{focused.visitMinutes} min estimados</span></div><div className="info-card"><h3>Antes de ir</h3><p><b>Horario publicado:</b> {focused.openingHours || 'No disponible. Confirma con el establecimiento.'}</p><p><b>Entrada:</b> {focused.fee}</p><p><b>Acceso en silla de ruedas:</b> {focused.wheelchair === 'yes' ? 'Indicado en OSM; confirmar condiciones.' : focused.wheelchair === 'no' ? 'No, según OSM.' : 'No confirmado.'}</p></div><a className="text-link" href={focused.osmUrl} target="_blank" rel="noopener noreferrer">Consultar ficha en OpenStreetMap <ExternalLink size={15} /></a>{focused.website && <a className="text-link" href={focused.website} target="_blank" rel="noopener noreferrer">Sitio del lugar <ExternalLink size={15} /></a>}<button className="button full" onClick={() => { togglePlace(focused.id); setModal(null); }}>{selected.includes(focused.id) ? <Check size={18} /> : <Plus size={18} />}{selected.includes(focused.id) ? 'Quitar de mi selección' : 'Añadir a mi recorrido'}</button></div></Modal>}
    {modal === 'install' && <Modal title="NearMe en tu pantalla de inicio" onClose={() => setModal(null)}><div className="sheet-body"><div className="install-preview"><Brand /></div><h3>En iPhone o iPad</h3><p>Abre esta dirección en Safari, toca Compartir y elige «Añadir a pantalla de inicio».</p><h3>En Android o computadora</h3><p>Abre el menú del navegador y selecciona «Instalar aplicación» o «Añadir a pantalla de inicio», si está disponible.</p><div className="info-card">En un teléfono, la instalación y la ubicación requieren una dirección HTTPS. El servidor local de esta computadora permite probar la app aquí.</div></div></Modal>}
  </div>;
}

function PlaceCard({ place, selected, onSelect, onOpen }) {
  const category = categories.find(c => c.id === place.category) || categories[0];
  const Icon = icons[category.icon];
  return <article className={`place-card ${selected ? 'selected' : ''}`}><button className={`place-art ${category.tone}`} onClick={onOpen} aria-label={`Ver ${place.name}`}><div className="art-orbit" /><Icon size={50} strokeWidth={1.2} /><span className="art-category">{category.label}</span><span className="art-distance"><MapPin size={11} />{place.distanceKm} km</span></button><div className="place-card-body"><button className="place-title" onClick={onOpen}>{place.name}</button><p>{place.address || category.detail}</p><div className="place-bottom"><span><Clock3 size={14} />{place.visitMinutes} min <small>estimados</small></span><button className={`select-place ${selected ? 'selected' : ''}`} aria-label={`${selected ? 'Quitar' : 'Añadir'} ${place.name}`} aria-pressed={selected} onClick={onSelect}>{selected ? <Check size={18} /> : <Plus size={18} />}</button></div></div></article>;
}
function InterestPicker({ config, toggle }) { return <div className="interest-picker">{categories.map(category => { const Icon = icons[category.icon]; return <button key={category.id} aria-pressed={config.interests.includes(category.id)} className={config.interests.includes(category.id) ? 'selected' : ''} onClick={() => toggle(category.id)}><span className={`category-icon ${category.tone}`}><Icon size={21} /></span><span>{category.label}</span><span className="interest-check">{config.interests.includes(category.id) && <Check size={12} />}</span></button>; })}</div>; }
function Toggle({ checked, onChange, title, detail, Icon }) { return <label className="toggle-row"><Icon size={20} /><span><b>{title}</b><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i className="switch" /></label>; }
function Empty({ Icon, title, text, action, onAction }) { return <div className="empty-state"><div className="empty-icon"><Icon size={36} /></div><h2>{title}</h2><p>{text}</p><button className="button" onClick={onAction}>{action}<ArrowRight size={17} /></button></div>; }
function LocationModal({ onClose, onChoose, onLocate, onPick }) {
  const [query, setQuery] = useState(''); const [results, setResults] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function search(event) { event.preventDefault(); setBusy(true); setError(''); try { const data = await api(`geocode?q=${encodeURIComponent(query)}`); setResults(data.results); } catch (failure) { setError(failure.message); } finally { setBusy(false); } }
  return <Modal title="¿Desde dónde exploramos?" onClose={onClose}><div className="sheet-body"><p>Elige un punto de partida para encontrar lugares a tu alrededor.</p><button className="location-option" onClick={onLocate}><Crosshair /><span><b>Usar mi ubicación</b><small>Te pediremos permiso al navegador.</small></span><ChevronRight size={18} /></button><button className="location-option" onClick={onPick}><Map /><span><b>Elegir un punto en el mapa</b><small>Toca el lugar desde el que quieres salir.</small></span><ChevronRight size={18} /></button><form onSubmit={search} className="location-search"><label className="field-label">Buscar una dirección<input placeholder="Barrio Escalante, San José…" value={query} minLength="3" maxLength="150" required onChange={e => setQuery(e.target.value)} /></label><button className="button" disabled={busy || query.trim().length < 3}>{busy ? <LoaderCircle className="spinning" size={18} /> : <Search size={18} />} Buscar</button></form>{error && <p role="alert" className="inline-error">{error}</p>}{results?.map((point, index) => <button className="geocode-result" key={index} onClick={() => onChoose(point)}><MapPin size={18} /><span>{point.label}</span><ChevronRight size={16} /></button>)}{results?.length === 0 && <p>No encontramos esa dirección. Prueba con el nombre de la ciudad.</p>}<button className="text-button" onClick={() => onChoose(defaultOrigin)}>Explorar el centro de San José <ArrowRight size={16} /></button><p className="muted small">Búsqueda por Nominatim / OpenStreetMap.</p></div></Modal>;
}
