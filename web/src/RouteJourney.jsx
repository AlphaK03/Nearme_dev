import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crosshair, Footprints, Maximize2, Navigation, Pause, Play, Radio, Square } from 'lucide-react';
import MapView from './MapView.jsx';
import { buildTrack, matchPosition, metersBetween, pointAt, segmentPoints } from './route-motion.js';
import { distance } from './lib.js';
import './route-journey.css';

export default function RouteJourney({ plan, completed, active, onStart, onComplete, onPlace, focus }) {
  const track = useMemo(() => buildTrack(plan), [plan]);
  const pendingIndex = plan.stops.findIndex(stop => !completed.includes(stop.id));
  const allVisited = pendingIndex < 0;
  const nextIndex = Math.min(allVisited ? plan.stops.length : pendingIndex, (track?.segments.length || 1) - 1);
  const [index, setIndex] = useState(nextIndex);
  const [mode, setMode] = useState('idle');
  const [following, setFollowing] = useState(true);
  const [visible, setVisible] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [progress, setProgress] = useState(0);
  const [fix, setFix] = useState(null);
  const [message, setMessage] = useState('');
  const [stale, setStale] = useState(false);
  const controller = useRef(null);
  const frame = useRef(0);
  const cursor = useRef(null);
  const currentPoint = useRef(null);
  const followRef = useRef(following);
  followRef.current = following;
  const segment = track?.segments[index];

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(preference.matches);
    const visibility = () => {
      setVisible(!document.hidden);
      if (document.hidden) setMode(value => value === 'preview' ? 'paused' : value);
    };
    preference.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); cancelAnimationFrame(frame.current); };
  }, []);

  useEffect(() => {
    setIndex(nextIndex);
    setMode(value => value === 'gps' ? value : 'idle');
  }, [nextIndex]);

  useEffect(() => {
    if (allVisited && !plan.config.roundTrip) {
      cancelAnimationFrame(frame.current); setMode('idle'); setFix(null);
      controller.current?.clearTraveler(); currentPoint.current = null;
    }
  }, [allVisited, plan.config.roundTrip]);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (!segment) return;
    cursor.current = segment.start;
    currentPoint.current = null;
    setProgress(0); setFix(null); setMessage(''); setFollowing(true);
    controller.current?.clearTraveler();
    controller.current?.setSegment(segmentPoints(track, segment));
  }, [track, segment]);

  const paint = (point, heading, accuracy = 0, immediate = false) => {
    currentPoint.current = point;
    controller.current?.setTraveler(point, heading, { follow: followRef.current, accuracy, reduced, immediate });
  };

  useEffect(() => {
    if (mode !== 'preview' || !visible || !segment) return;
    let previous = performance.now(), drawn = 0, published = 0;
    const durationMs = Math.max(14000, Math.min(35000, segment.meters * 25));
    controller.current?.focusTraveler(pointAt(track, cursor.current ?? segment.start), reduced);
    const animate = now => {
      const delta = Math.min(100, now - previous); previous = now;
      cursor.current = Math.min(segment.end, (cursor.current ?? segment.start) + segment.meters * delta / durationMs);
      if (now - drawn >= (reduced ? 250 : 1000 / 30)) {
        const point = pointAt(track, cursor.current);
        paint(point, point.heading);
        drawn = now;
      }
      if (now - published > 250) { setProgress(cursor.current - segment.start); published = now; }
      if (cursor.current >= segment.end) {
        const point = pointAt(track, segment.end); paint(point, point.heading);
        setProgress(segment.meters); setMode('paused');
      } else frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [mode, visible, segment, track, reduced]);

  useEffect(() => {
    if (mode !== 'gps' || !visible || !segment) return;
    let disposed = false, lastUpdate = 0, lastSignal = 0, accepted = null;
    setStale(false); setMessage('Buscando una señal GPS precisa…');
    const success = position => {
      if (disposed || document.hidden) return;
      const now = Date.now();
      if (now - position.timestamp > 15000) { setStale(true); return; }
      if (now - lastUpdate < 1000) return;
      lastUpdate = now; lastSignal = now; setStale(false);
      const result = matchPosition(track, segment, position.coords, accepted?.along ?? segment.start);
      if (result.status === 'invalid' || result.status === 'inaccurate') {
        setMessage('Señal poco precisa. Esperando una mejor ubicación…');
        setFix(null);
        cancelAnimationFrame(frame.current);
        controller.current?.clearTraveler(); currentPoint.current = null; accepted = null;
        return;
      }
      setMessage(''); setFix(result);
      if (result.status === 'on-route') setProgress(result.along - segment.start);
      cancelAnimationFrame(frame.current);
      const before = currentPoint.current;
      const oldFix = accepted; accepted = result;
      if (!before || reduced || metersBetween(before, result.point) > 100) {
        paint(result.point, result.heading, result.accuracy, true);
        if (!before) controller.current?.focusTraveler(result.point, reduced);
        return;
      }
      const started = performance.now(); let drawn = 0;
      const animate = clock => {
        const t = Math.min(1, (clock - started) / 700);
        if (clock - drawn >= 1000 / 30 || t === 1) {
          // Interpolate on the route only when both real GPS readings match this leg.
          const point = oldFix?.status === 'on-route' && result.status === 'on-route'
            ? pointAt(track, oldFix.along + (result.along - oldFix.along) * t)
            : { lat: before.lat + (result.point.lat - before.lat) * t, lng: before.lng + (result.point.lng - before.lng) * t };
          paint(point, result.heading, result.accuracy); drawn = clock;
        }
        if (t < 1) frame.current = requestAnimationFrame(animate);
      };
      frame.current = requestAnimationFrame(animate);
    };
    const failure = error => {
      if (disposed) return;
      setMessage(error.code === 1 ? 'Permite la ubicación en tu navegador para seguir el recorrido.' : 'No pudimos obtener tu ubicación. Puedes reintentar o usar la vista previa.');
      setFix(null); controller.current?.clearTraveler(); currentPoint.current = null;
      setMode('idle');
    };
    let watch;
    try {
      watch = navigator.geolocation.watchPosition(success, failure, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    } catch { failure({ code: 1 }); }
    const timer = setInterval(() => {
      if (lastSignal && Date.now() - lastSignal > 15000) {
        setStale(true); cancelAnimationFrame(frame.current);
      }
    }, 5000);
    return () => { disposed = true; if (watch !== undefined) navigator.geolocation.clearWatch(watch); clearInterval(timer); cancelAnimationFrame(frame.current); };
  }, [mode, visible, track, segment, reduced]);

  const startGps = () => {
    if (!window.isSecureContext || !navigator.geolocation) { setMessage('Abre la app por HTTPS para usar el seguimiento GPS.'); return; }
    setIndex(nextIndex); setFollowing(true); setFix(null); setProgress(0); setMessage('');
    controller.current?.clearTraveler(); currentPoint.current = null;
    setMode('gps'); onStart();
  };
  const stop = () => {
    cancelAnimationFrame(frame.current); setMode('idle'); setFix(null); setStale(false); setMessage('');
    controller.current?.clearTraveler(); currentPoint.current = null;
  };
  const preview = () => {
    if (mode === 'preview') { setMode('paused'); return; }
    if (mode !== 'paused' || cursor.current >= segment.end) { cursor.current = segment.start; setProgress(0); }
    setFollowing(true); setFix(null); setMessage(''); setMode('preview');
  };
  const recenter = () => {
    setFollowing(true);
    if (currentPoint.current) controller.current?.focusTraveler(currentPoint.current, reduced);
  };

  if (!track || !segment) return <MapView origin={plan.config.origin} plan={plan} focus={focus} onPlace={onPlace} />;
  const simulating = mode === 'preview' || mode === 'paused';
  const live = mode === 'gps';
  const remaining = live ? fix?.status === 'on-route' && !stale ? fix.remaining : null : Math.max(0, segment.meters - progress);
  const status = message || (live ? !visible ? 'Seguimiento pausado mientras la app está oculta.' : stale ? 'Señal GPS desactualizada. Esperando tu posición…' : fix?.status === 'off-route' ? 'Estás fuera de este tramo. Mostramos tu ubicación real.' : fix ? `${remaining <= 25 ? 'Cerca de tu parada' : 'Siguiendo tu ubicación'} · precisión ±${Math.round(fix.accuracy)} m` : 'Buscando tu ubicación…' : simulating ? progress >= segment.meters ? 'Fin de la vista previa. Puedes explorar el siguiente tramo.' : 'Simulación del trayecto · no representa tu ubicación.' : 'Previsualiza el camino o síguelo con tu ubicación.');
  const percent = live && (!fix || fix.status !== 'on-route' || stale) ? 0 : Math.min(100, Math.round(progress / (segment.meters || 1) * 100));

  return <section className={`journey-card ${live ? 'is-live' : ''}`} aria-label="Seguimiento del recorrido">
    <header className="journey-header"><span className="journey-heading-icon"><Navigation size={19} /></span><div><span className="eyebrow">EL CAMINO TAMBIÉN CUENTA</span><h2>Disfruta cada tramo</h2></div><span className={`journey-badge ${live ? 'live' : ''}`}><i />{live ? 'GPS' : simulating ? 'Vista previa' : 'Tu ruta'}</span></header>
    <div className={`journey-map ${stale ? 'signal-stale' : ''}`}>
      <MapView origin={plan.config.origin} plan={plan} focus={focus} onPlace={onPlace} onLocate={startGps} controllerRef={controller} onMapInteract={() => setFollowing(false)} />
      {(live || simulating) && !following && <button className="journey-recenter" onClick={recenter}><Crosshair size={15} /> Seguir marcador</button>}
      <button className="journey-overview" aria-label="Ver ruta completa" onClick={() => { setFollowing(false); if (mode === 'preview') setMode('paused'); controller.current?.overview(); }}><Maximize2 size={16} /></button>
    </div>
    <div className="journey-panel">
      <div className="journey-destination"><span className="journey-step">{segment.stop.returning ? <Navigation size={19} /> : index + 1}</span><div><small>{segment.stop.returning ? 'DE VUELTA' : `PARADA ${index + 1} DE ${plan.stops.length}`}</small><h3>{segment.stop.name}</h3></div><div className="journey-distance"><b>{remaining === null ? '—' : distance(remaining)}</b><small>{live ? 'por recorrer' : 'de trayecto'}</small></div></div>
      <div className="journey-progress" role="progressbar" aria-label="Avance del tramo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
      <p className="journey-status" role="status">{live ? <Radio size={14} /> : <Footprints size={14} />}{status}</p>
      <div className="journey-actions"><button className="button secondary" onClick={preview}>{mode === 'preview' ? <Pause size={17} /> : <Play size={17} />}{mode === 'preview' ? 'Pausar' : mode === 'paused' && progress < segment.meters ? 'Reanudar' : 'Vista previa'}</button><button className="button" disabled={allVisited && !plan.config.roundTrip} onClick={live ? stop : startGps}>{live ? <Square size={15} /> : <Crosshair size={17} />}{live ? 'Detener GPS' : 'Seguir con GPS'}</button></div>
      <div className="journey-stages" aria-label="Tramos del itinerario">{track.segments.map((part, i) => <button key={part.stop.id} aria-label={`${part.stop.returning ? 'Regreso' : `Tramo ${i + 1}`}: ${part.stop.name}`} aria-pressed={i === index} disabled={live} onClick={() => { setMode('idle'); setIndex(i); }}><span>{part.stop.returning ? <Navigation size={12} /> : completed.includes(part.stop.id) ? <Check size={12} /> : i + 1}</span><small>{part.stop.returning ? 'Regreso' : part.stop.name}</small></button>)}</div>
      {active && index === nextIndex && !segment.stop.returning && !completed.includes(segment.stop.id) && <button className="journey-arrival" onClick={onComplete}><Check size={15} /> Marcar parada visitada</button>}
    </div>
  </section>;
}
