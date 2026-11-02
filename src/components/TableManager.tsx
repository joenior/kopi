'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '@/lib/types';
import {
  QrCode,
  Printer,
  ArrowSquareOut,
  Users,
  Coffee,
  X,
} from '@phosphor-icons/react';

interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  area: 'Indoor AC' | 'Outdoor Garden' | 'Bar Area';
}

const DEFAULT_TABLES: TableInfo[] = [
  { id: '1', name: 'Meja 01', capacity: 2, area: 'Indoor AC' },
  { id: '2', name: 'Meja 02', capacity: 4, area: 'Indoor AC' },
  { id: '3', name: 'Meja 03', capacity: 4, area: 'Indoor AC' },
  { id: '4', name: 'Meja 04', capacity: 6, area: 'Indoor AC' },
  { id: '5', name: 'Meja 05', capacity: 2, area: 'Indoor AC' },
  { id: '6', name: 'Meja 06', capacity: 4, area: 'Outdoor Garden' },
  { id: '7', name: 'Meja 07', capacity: 4, area: 'Outdoor Garden' },
  { id: '8', name: 'Meja 08', capacity: 6, area: 'Outdoor Garden' },
  { id: '9', name: 'Meja 09', capacity: 2, area: 'Outdoor Garden' },
  { id: '10', name: 'Meja 10', capacity: 2, area: 'Bar Area' },
  { id: '11', name: 'Meja 11', capacity: 2, area: 'Bar Area' },
  { id: '12', name: 'Meja 12', capacity: 4, area: 'Bar Area' },
];

interface TableManagerProps {
  orders: Order[];
}

export function TableManager({ orders }: TableManagerProps) {
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>('Semua');

  // Check active order for each table
  const activeOrders = orders.filter((o) => o.status !== 'selesai' && o.order_type === 'dine');

  const getTableStatus = (tableId: string) => {
    const tableOrder = activeOrders.find((o) => o.table_number === tableId);
    if (!tableOrder) {
      return { status: 'kosong', label: 'Tersedia', order: null };
    }
    if (tableOrder.status === 'siap') {
      return { status: 'siap', label: 'Pesanan Siap', order: tableOrder };
    }
    return { status: 'terisi', label: 'Ada Pesanan', order: tableOrder };
  };

  const occupiedCount = DEFAULT_TABLES.filter(
    (t) => getTableStatus(t.id).status !== 'kosong'
  ).length;

  const filteredTables = DEFAULT_TABLES.filter(
    (t) => areaFilter === 'Semua' || t.area === areaFilter
  );

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
          <span className="text-xs font-medium text-[var(--text-muted)] block">Total Meja Kedai</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-[var(--text-main)]">
              {DEFAULT_TABLES.length}
            </span>
            <span className="text-xs text-[var(--text-muted)]">titik</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
          <span className="text-xs font-medium text-[var(--text-muted)] block">Meja Terisi / Aktif</span>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {occupiedCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-1">meja</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
          <span className="text-xs font-medium text-[var(--text-muted)] block">Meja Tersedia</span>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {DEFAULT_TABLES.length - occupiedCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] ml-1">meja kosong</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
          <span className="text-xs font-medium text-[var(--text-muted)] block">Sistem QR Code</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              QR Dinamis Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Area Filter & Table List Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <QrCode size={22} weight="bold" className="text-[var(--primary)]" />
              <span>Daftar Meja &amp; Kode QR Pemesanan</span>
            </h2>
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {['Semua', 'Indoor AC', 'Outdoor Garden', 'Bar Area'].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  areaFilter === area
                    ? 'bg-[var(--primary)] text-white shadow-2xs'
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const tableState = getTableStatus(table.id);
            const qrUrl = `${getBaseUrl()}/?meja=${table.id}&token=token_meja_${table.id}_secret`;

            return (
              <div
                key={table.id}
                className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-3"
              >
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--text-main)]">
                      {table.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                      <Users size={12} />
                      <span>{table.capacity} Kursi</span>
                      <span>·</span>
                      <span>{table.area}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      tableState.status === 'kosong'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : tableState.status === 'siap'
                        ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {tableState.label}
                  </span>
                </div>

                {/* QR Code Preview Box */}
                <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center shadow-2xs">
                  <QRCodeSVG
                    value={qrUrl}
                    size={110}
                    level="M"
                    fgColor="#2b1d14"
                    bgColor="#ffffff"
                  />
                  <span className="text-[10px] font-mono text-neutral-500 mt-1.5">
                    ?meja={table.id}
                  </span>
                </div>

                {/* Active Order Info if Any */}
                {tableState.order && (
                  <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px]">
                    <div className="font-bold text-[var(--text-main)] truncate">
                      #{tableState.order.id} · a/n {tableState.order.customer_name}
                    </div>
                    <div className="text-[var(--primary)] font-semibold mt-0.5">
                      Status: {tableState.order.status.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all active-press"
                  >
                    <Printer size={13} weight="bold" />
                    <span>Cetak QR</span>
                  </button>

                  <a
                    href={`/?meja=${table.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-[var(--border-strong)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--bg-surface)] transition-all active-press"
                  >
                    <ArrowSquareOut size={13} weight="bold" />
                    <span>Buka URL</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Cetak Standing Tent QR Meja */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-muted)] transition-colors"
            >
              <X size={18} weight="bold" />
            </button>

            {/* Standing Tent Card Mockup */}
            <div className="p-6 bg-gradient-to-b from-[#faf6f1] to-[#f4ebe1] dark:from-[#231b16] dark:to-[#1a1410] border-2 border-[var(--border-strong)] rounded-2xl shadow-md text-[var(--text-main)] space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                <Coffee size={16} weight="fill" />
                <span>Kedai Senja</span>
              </div>

              <div>
                <h3 className="text-2xl font-black tracking-tight">{selectedTable.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Area {selectedTable.area} · Kapasitas {selectedTable.capacity} Orang
                </p>
              </div>

              {/* QR Code Big */}
              <div className="p-4 bg-white rounded-2xl inline-block border-2 border-neutral-200 shadow-sm mx-auto">
                <QRCodeSVG
                  value={`${getBaseUrl()}/?meja=${selectedTable.id}&token=token_meja_${selectedTable.id}_secret`}
                  size={160}
                  level="H"
                  fgColor="#2b1d14"
                  bgColor="#ffffff"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-main)]">
                  Pindai QR untuk Pesan &amp; Bayar di Kasir
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  1. Scan dengan Kamera HP • 2. Pilih Menu • 3. Pesanan Langsung Dibuat
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors active-press"
              >
                <Printer size={15} weight="bold" />
                <span>Cetak Akrilik Meja</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-muted)]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
