import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Minus, Plus } from 'lucide-react';

export default function MapView({ origin, places = [], selected = [], plan, focus, onPlace, picking, onPick, onLocate }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const layer = useRef(null);
  const callbacks = useRef({ onPlace, onPick, picking });
  callbacks.current = { onPlace, onPick, picking };
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: true }).setView([origin.lat, origin.lng], 15);
    mapRef.current = map;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // Dev tunnels may override the document policy with same-origin.
      // OSM requires the real page origin; set it on each tile image.
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    layer.current = L.layerGroup().addTo(map);
    map.on('click', event => { if (callbacks.current.picking) callbacks.current.onPick({ lat: event.latlng.lat, lng: event.latlng.lng, label: 'Punto elegido en el mapa' }); });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); };
  }, []);
  useEffect(() => {
    const map = mapRef.current; const group = layer.current; group.clearLayers();
    const originIcon = L.divIcon({ className: '', html: '<span class="origin-marker"><i></i></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
    L.marker([origin.lat, origin.lng], { icon: originIcon, title: 'Punto de partida' }).addTo(group).bindTooltip('Tu punto de partida');
    const shown = plan ? plan.stops : places;
    shown.forEach((place, index) => {
      const active = selected.includes(place.id) || Boolean(plan);
      const icon = L.divIcon({ className: '', html: `<span class="place-marker ${active ? 'selected' : ''}"><span style="transform:rotate(45deg)">${plan ? index + 1 : active ? '✓' : '•'}</span></span>`, iconSize: [34, 40], iconAnchor: [17, 38] });
      const text = document.createElement('span'); text.textContent = place.name;
      L.marker([place.lat, place.lng], { icon, title: place.name, keyboard: true }).addTo(group).bindTooltip(text).on('click', () => callbacks.current.onPlace?.(place.id));
    });
    if (plan?.geometry) {
      const path = L.geoJSON(plan.geometry, { style: { color: '#fff', weight: 9, opacity: 0.85 } }).addTo(group);
      L.geoJSON(plan.geometry, { style: { color: '#226f5e', weight: 5, opacity: 1 } }).addTo(group);
      map.fitBounds(path.getBounds(), { padding: [48, 60], maxZoom: 16, animate: false });
    } else if (shown.length) map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], ...shown.map(p => [p.lat, p.lng])]), { padding: [40, 45], maxZoom: 16, animate: false });
    else map.setView([origin.lat, origin.lng], 15);
  }, [origin, places, selected, plan]);
  useEffect(() => {
    const place = places.find(p => p.id === focus) || plan?.stops.find(p => p.id === focus);
    if (place) mapRef.current?.flyTo([place.lat, place.lng], 17, { duration: 0.5 });
  }, [focus]);
  return <div className={`map-frame ${picking ? 'picking' : ''}`}>
    <div ref={container} className="leaflet-map" aria-label="Mapa interactivo de lugares y recorridos" />
    <div className="map-label"><span className="live-dot" /> {picking ? 'Toca el mapa para elegir tu salida' : plan ? 'Tu recorrido, en el mapa' : 'Descubre tu alrededor'}</div>
    <div className="map-controls">
      <button aria-label="Acercar mapa" onClick={() => mapRef.current.zoomIn()}><Plus size={20} /></button>
      <button aria-label="Alejar mapa" onClick={() => mapRef.current.zoomOut()}><Minus size={20} /></button>
      <button aria-label="Centrar en mi ubicación" onClick={onLocate}><Crosshair size={20} /></button>
      <button aria-label="Ver punto de partida" onClick={() => mapRef.current.flyTo([origin.lat, origin.lng], 16)}><MapPin size={20} /></button>
    </div>
    {tileError && <div className="map-error">No se pudo cargar parte del mapa. Comprueba tu conexión.</div>}
    <div className="map-legend"><i /> Punto de partida <b /> {plan ? 'Paradas de tu ruta' : 'Lugares cercanos'}</div>
  </div>;
}
