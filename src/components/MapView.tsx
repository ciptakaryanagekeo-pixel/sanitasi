import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SaranaSanitasi, KondisiSarana } from '../types/sanitasi';
import { MapPin, Navigation, Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface MapViewProps {
  saranaList: SaranaSanitasi[];
  onSelectSarana?: (sarana: SaranaSanitasi) => void;
  selectedKecamatan?: string;
  selectedDesa?: string;
}

export default function MapView({
  saranaList,
  onSelectSarana,
  selectedKecamatan = '',
  selectedDesa = '',
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [filterKondisi, setFilterKondisi] = useState<string>('all');
  const [filterSeptic, setFilterSeptic] = useState<string>('all');
  const [selectedSaranaDetail, setSelectedSaranaDetail] = useState<SaranaSanitasi | null>(null);

  // Filtered items
  const filteredItems = saranaList.filter((item) => {
    if (selectedKecamatan && item.kecamatan.toLowerCase() !== selectedKecamatan.toLowerCase()) return false;
    if (selectedDesa && item.desaKelurahan.toLowerCase() !== selectedDesa.toLowerCase()) return false;
    if (filterKondisi !== 'all' && item.kondisi !== filterKondisi) return false;
    if (filterSeptic === 'has_septic' && !item.memilikiSepticTank) return false;
    if (filterSeptic === 'no_septic' && item.memilikiSepticTank) return false;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around Nagekeo / Flores: ~ -8.65, 121.28
      const initialCenter: [number, number] = [-8.65, 121.28];
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 11,
        scrollWheelZoom: true,
      });

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Cipta Karya',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when filtered items change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredItems.forEach((sarana) => {
      if (!sarana.latitude || !sarana.longitude) return;

      const latLng: [number, number] = [sarana.latitude, sarana.longitude];
      bounds.extend(latLng);

      // Marker color
      let colorBg = 'bg-emerald-600';
      let borderColor = 'border-emerald-200';
      if (sarana.status === 'Tidak Berfungsi' || sarana.kondisi === 'Rusak Berat') {
        colorBg = 'bg-rose-600';
        borderColor = 'border-rose-200';
      } else if (sarana.kondisi === 'Rusak Ringan') {
        colorBg = 'bg-amber-500';
        borderColor = 'border-amber-200';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full ${colorBg} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ring-2 ${borderColor} transition-transform hover:scale-125">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Leaflet Popup content
      const popupHtml = `
        <div class="p-1 text-slate-800 text-xs font-sans max-w-[240px]">
          <div class="font-bold text-sm text-slate-900 leading-tight mb-1">${sarana.namaPemilik}</div>
          <div class="text-slate-600 mb-2">${sarana.desaKelurahan}, Kec. ${sarana.kecamatan}</div>
          <div class="space-y-1 py-1 border-t border-b border-slate-200 my-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Sarana:</span>
              <span class="font-medium text-slate-800">${sarana.jenisSarana}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Kondisi:</span>
              <span class="font-bold ${sarana.kondisi === 'Baik' ? 'text-emerald-700' : sarana.kondisi === 'Rusak Ringan' ? 'text-amber-700' : 'text-rose-700'}">${sarana.kondisi}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Status:</span>
              <span class="font-medium ${sarana.status === 'Berfungsi' ? 'text-emerald-700' : 'text-rose-700'}">${sarana.status}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Septic Tank:</span>
              <span class="font-semibold text-slate-700">${sarana.memilikiSepticTank ? 'Ada' : 'Tidak Ada'}</span>
            </div>
          </div>
          <div class="mt-2 flex gap-1">
            <a href="https://www.google.com/maps?q=${sarana.latitude},${sarana.longitude}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
              Navigasi Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedSaranaDetail(sarana);
        if (onSelectSarana) onSelectSarana(sarana);
      });

      marker.addTo(markersLayer);
    });

    if (filteredItems.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredItems, onSelectSarana]);

  const handleResetZoom = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([-8.65, 121.28], 11);
  };

  return (
    <div className="relative w-full h-full flex flex-col rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      {/* Top Filter Bar inside Map */}
      <div className="p-3 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Peta Sebaran Sarana Sanitasi Bidang CK</h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredItems.length} dari {saranaList.length} titik koordinat sarana
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div>
            <label className="text-slate-500 mr-1 font-medium">Kondisi:</label>
            <select
              value={filterKondisi}
              onChange={(e) => setFilterKondisi(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Semua Kondisi</option>
              <option value="Baik">Baik (Berfungsi)</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 mr-1 font-medium">Septic Tank:</label>
            <select
              value={filterSeptic}
              onChange={(e) => setFilterSeptic(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Semua</option>
              <option value="has_septic">Memiliki Septic Tank</option>
              <option value="no_septic">Belum Memiliki</option>
            </select>
          </div>

          <button
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition"
          >
            Reset Fokus
          </button>
        </div>
      </div>

      {/* Map Element Container */}
      <div className="relative flex-1 w-full min-h-[460px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-md text-xs z-[500] max-w-xs space-y-1.5">
          <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Legenda Kondisi</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-white shadow-sm" />
            <span className="text-slate-700">Baik / Berfungsi Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white shadow-sm" />
            <span className="text-slate-700">Rusak Ringan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-white shadow-sm" />
            <span className="text-slate-700">Rusak Berat / Tidak Berfungsi</span>
          </div>
        </div>

        {/* Selected Card Popup Preview at Bottom Right */}
        {selectedSaranaDetail && (
          <div className="absolute bottom-4 right-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xl max-w-sm w-full z-[500] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedSaranaDetail.jenisSarana}
                </span>
                <h4 className="font-bold text-slate-900 text-base mt-1">{selectedSaranaDetail.namaPemilik}</h4>
                <p className="text-xs text-slate-500">
                  {selectedSaranaDetail.dusun}, Desa {selectedSaranaDetail.desaKelurahan}, Kec. {selectedSaranaDetail.kecamatan}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaranaDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {selectedSaranaDetail.fotoUrl && (
              <div className="w-full h-28 rounded-lg overflow-hidden mb-2 bg-slate-100">
                <img
                  src={selectedSaranaDetail.fotoUrl}
                  alt={selectedSaranaDetail.namaPemilik}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-500 block text-[11px]">Kondisi:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  selectedSaranaDetail.kondisi === 'Baik'
                    ? 'text-emerald-700'
                    : selectedSaranaDetail.kondisi === 'Rusak Ringan'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {selectedSaranaDetail.kondisi === 'Baik' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {selectedSaranaDetail.kondisi === 'Rusak Ringan' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {selectedSaranaDetail.kondisi === 'Rusak Berat' && <XCircle className="w-3.5 h-3.5" />}
                  {selectedSaranaDetail.kondisi}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Septic Tank:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSaranaDetail.memilikiSepticTank ? '✅ Memiliki' : '❌ Belum Ada'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Pengguna:</span>
                <span className="font-semibold text-slate-800">{selectedSaranaDetail.jumlahPengguna} Jiwa</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tahun/Sumber:</span>
                <span className="font-semibold text-slate-800">{selectedSaranaDetail.tahunPembangunan || '-'} ({selectedSaranaDetail.sumberDana || 'CK'})</span>
              </div>
            </div>

            {selectedSaranaDetail.keteranganKerusakan && (
              <div className="text-xs text-rose-800 bg-rose-50 p-2 rounded border border-rose-200 mb-3">
                <span className="font-semibold">Catatan Kerusakan: </span>
                {selectedSaranaDetail.keteranganKerusakan}
              </div>
            )}

            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps?q=${selectedSaranaDetail.latitude},${selectedSaranaDetail.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Navigation className="w-3.5 h-3.5" /> Buka Google Maps
              </a>
              {onSelectSarana && (
                <button
                  onClick={() => onSelectSarana(selectedSaranaDetail)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Detail
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
