import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Minus, Plus } from 'lucide-react';

const empty = [];

export default function MapView({ origin, places = empty, selected = empty, plan, focus, onPlace, picking, onPick, onLocate, controllerRef, onMapInteract }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const layer = useRef(null);
  const routeBounds = useRef(null);
  const callbacks = useRef({ onPlace, onPick, picking, onMapInteract });
  callbacks.current = { onPlace, onPick, picking, onMapInteract };
  const shown = plan ? plan.stops : places;
  const selectionKey = selected.join(',');
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: true, preferCanvas: true }).setView([origin.lat, origin.lng], 15);
    mapRef.current = map;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // Dev tunnels may override the document policy with same-origin.
      // OSM requires the real page origin; set it on each tile image.
      referrerPolicy: 'strict-origin-when-cross-origin',
      updateWhenIdle: true,
      keepBuffer: 1,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    layer.current = L.layerGroup().addTo(map);
    map.on('dragstart', () => callbacks.current.onMapInteract?.());
    const interact = () => callbacks.current.onMapInteract?.();
    map.getContainer().addEventListener('wheel', interact, { passive: true });
    map.getContainer().addEventListener('touchstart', interact, { passive: true });
    map.on('click', event => { if (callbacks.current.picking) callbacks.current.onPick({ lat: event.latlng.lat, lng: event.latlng.lng, label: 'Punto elegido en el mapa' }); });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(container.current);
    const motion = L.layerGroup().addTo(map);
    let marker = null, accuracy = null, heading = 0, lastCamera = 0;
    if (controllerRef) {
      const accuracyRenderer = L.canvas({ padding: 0.3 });
      const highlightBorder = L.polyline([], { color: '#fff', weight: 10, opacity: 0.95 }).addTo(motion);
      const highlight = L.polyline([], { color: '#246c55', weight: 6, opacity: 1 }).addTo(motion);
      controllerRef.current = {
        setSegment(points) {
          highlightBorder.setLatLngs(points).bringToFront(); highlight.setLatLngs(points).bringToFront();
        },
        clearTraveler() {
          if (marker) motion.removeLayer(marker);
          if (accuracy) motion.removeLayer(accuracy);
          marker = null; accuracy = null;
        },
        setTraveler(point, angle, options) {
          if (!marker) {
            marker = L.marker(point, { interactive: false, zIndexOffset: 1000, icon: L.divIcon({ className: 'journey-marker-container', iconSize: [46, 46], iconAnchor: [23, 23], html: '<span class="journey-marker"><span class="journey-marker-heading"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 21 21 12 17 3 21Z"/></svg></span></span>' }) }).addTo(motion);
            accuracy = L.circle(point, { radius: options.accuracy, color: '#44856c', weight: 1, opacity: 0.3, fillColor: '#559677', fillOpacity: 0.08, interactive: false, renderer: accuracyRenderer }).addTo(motion);
          }
          marker.setLatLng(point);
          if (options.accuracy > 0) accuracy.setLatLng(point);
          if (accuracy.getRadius() !== options.accuracy) accuracy.setRadius(options.accuracy);
          heading += ((angle - heading + 540) % 360 + 360) % 360 - 180;
          marker.getElement().querySelector('.journey-marker-heading').style.transform = `rotate(${heading}deg)`;
          const now = performance.now();
          if (options.follow && now - lastCamera > 1000 && !map.getBounds().pad(-0.28).contains(point)) {
            lastCamera = now;
            map.panTo(point, { animate: !options.reduced && !options.immediate, duration: 0.65, noMoveStart: true });
          }
        },
        focusTraveler(point, reduced) {
          map.stop(); map.setView(point, plan?.config.mode === 'car' ? 16 : 17, { animate: !reduced });
          lastCamera = performance.now();
        },
        overview() {
          map.stop();
          if (routeBounds.current) map.fitBounds(routeBounds.current, { padding: [40, 45], maxZoom: 16, animate: false });
        },
      };
    }
    return () => {
      if (controllerRef) controllerRef.current = null;
      map.getContainer().removeEventListener('wheel', interact);
      map.getContainer().removeEventListener('touchstart', interact);
      observer.disconnect(); map.remove();
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current; const group = layer.current; group.clearLayers();
    const originIcon = L.divIcon({ className: '', html: '<span class="origin-marker"><i></i></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
    L.marker([origin.lat, origin.lng], { icon: originIcon, title: 'Punto de partida' }).addTo(group).bindTooltip('Tu punto de partida');
    shown.forEach((place, index) => {
      const active = selected.includes(place.id) || Boolean(plan);
      const icon = L.divIcon({ className: '', html: `<span class="place-marker ${active ? 'selected' : ''}"><span style="transform:rotate(45deg)">${plan ? index + 1 : active ? '✓' : '•'}</span></span>`, iconSize: [34, 40], iconAnchor: [17, 38] });
      const text = document.createElement('span'); text.textContent = place.name;
      L.marker([place.lat, place.lng], { icon, title: place.name, keyboard: true }).addTo(group).bindTooltip(text).on('click', () => callbacks.current.onPlace?.(place.id));
    });
    if (plan?.geometry) {
      const path = L.geoJSON(plan.geometry, { style: { color: '#fff', weight: 9, opacity: 0.85 } }).addTo(group);
      L.geoJSON(plan.geometry, { style: { color: controllerRef ? '#a5bcae' : '#226f5e', weight: controllerRef ? 4 : 5, opacity: 1 } }).addTo(group);
      routeBounds.current = path.getBounds();
      map.fitBounds(path.getBounds(), { padding: [48, 60], maxZoom: 16, animate: false });
    } else if (shown.length) map.fitBounds(L.latLngBounds([[origin.lat, origin.lng], ...shown.map(p => [p.lat, p.lng])]), { padding: [40, 45], maxZoom: 16, animate: false });
    else map.setView([origin.lat, origin.lng], 15);
  }, [origin.lat, origin.lng, shown, selectionKey, plan]);
  useEffect(() => {
    const place = places.find(p => p.id === focus) || plan?.stops.find(p => p.id === focus);
    if (place) { callbacks.current.onMapInteract?.(); mapRef.current?.flyTo([place.lat, place.lng], 17, { duration: 0.5 }); }
  }, [focus]);
  return <div className={`map-frame ${picking ? 'picking' : ''}`}>
    <div ref={container} className="leaflet-map" aria-label="Mapa interactivo de lugares y recorridos" />
    <div className="map-label"><span className="live-dot" /> {picking ? 'Toca el mapa para elegir tu salida' : plan ? 'Tu recorrido, en el mapa' : 'Descubre tu alrededor'}</div>
    <div className="map-controls">
      <button aria-label="Acercar mapa" onClick={() => { callbacks.current.onMapInteract?.(); mapRef.current.zoomIn(); }}><Plus size={20} /></button>
      <button aria-label="Alejar mapa" onClick={() => { callbacks.current.onMapInteract?.(); mapRef.current.zoomOut(); }}><Minus size={20} /></button>
      <button aria-label="Centrar en mi ubicación" onClick={onLocate}><Crosshair size={20} /></button>
      <button aria-label="Ver punto de partida" onClick={() => { callbacks.current.onMapInteract?.(); mapRef.current.flyTo([origin.lat, origin.lng], 16); }}><MapPin size={20} /></button>
    </div>
    {tileError && <div className="map-error">No se pudo cargar parte del mapa. Comprueba tu conexión.</div>}
    <div className="map-legend"><i /> Punto de partida <b /> {plan ? 'Paradas de tu ruta' : 'Lugares cercanos'}</div>
  </div>;
}
