"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type SpinRecord = {
  id: string;
  is_delivered: boolean;
  delivery_note: string | null;
  created_at: string;
  users: { name: string; surname: string; phone: string };
  campaign_slug: string | null;
  campaigns: { title: string };
  prizes: { title: string };
};

export default function AdminSpinsPage() {
  const [spins, setSpins] = useState<SpinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  
  // Modal State
  const [editingSpin, setEditingSpin] = useState<SpinRecord | null>(null);

  const fetchSpins = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/spins', window.location.origin);
      if (search) url.searchParams.append('search', search);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        setSpins(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced Search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSpins();
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const handleUpdateDelivery = async () => {
    if (!editingSpin) return;
    try {
      const res = await fetch(`/api/admin/spins/${editingSpin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_delivered: editingSpin.is_delivered,
          delivery_note: editingSpin.delivery_note
        })
      });
      
      if (res.ok) {
        setEditingSpin(null);
        fetchSpins();
      } else {
        alert('Güncellenemedi.');
      }
    } catch (e) {
      alert('Hata.');
    }
  };

  const exportCSV = () => {
    if (spins.length === 0) return alert('Dışa aktarılacak veri yok.');
    
    const headers = ['Tarih', 'İsim', 'Soyisim', 'Telefon', 'Kampanya', 'Ödül', 'Teslimat Durumu', 'Teslimat Notu'];
    const rows = spins.map(s => [
      new Date(s.created_at).toLocaleString('tr-TR'),
      s.users?.name,
      s.users?.surname,
      s.users?.phone,
      `${s.campaigns?.title} (${s.campaign_slug})`,
      s.prizes?.title,
      s.is_delivered ? 'Teslim Edildi' : 'Bekliyor',
      s.delivery_note || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${(field || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel TR characters
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kazananlar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Kazananlar & Teslimat</h1>
          <p className="text-sm text-gray-500">Hediye kazanan kullanıcıları yönetin ve CSV olarak dışa aktarın.</p>
        </div>
        <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">CSV İndir</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <Input 
            placeholder="İsim veya Telefon ile ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Tarih</th>
                <th className="px-6 py-3">Kullanıcı</th>
                <th className="px-6 py-3">Telefon</th>
                <th className="px-6 py-3">Ödül / Kampanya</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && spins.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : spins.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
              ) : (
                spins.map(spin => (
                  <tr key={spin.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(spin.created_at).toLocaleString('tr-TR')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{spin.users?.name} {spin.users?.surname}</td>
                    <td className="px-6 py-4">{spin.users?.phone}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-luxury-gold">{spin.prizes?.title}</div>
                      <div className="text-sm font-medium text-gray-800 mt-1">{spin.campaigns?.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{spin.campaign_slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      {spin.is_delivered ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Teslim Edildi</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Bekliyor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => setEditingSpin(spin)}>Detay / Güncelle</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delivery Modal */}
      {editingSpin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Teslimat Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm bg-gray-50 p-3 rounded">
                <p><strong>Kullanıcı:</strong> {editingSpin.users?.name} {editingSpin.users?.surname} ({editingSpin.users?.phone})</p>
                <p><strong>Kazanılan:</strong> {editingSpin.prizes?.title}</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded border">
                <input 
                  type="checkbox" 
                  checked={editingSpin.is_delivered}
                  onChange={e => setEditingSpin({...editingSpin, is_delivered: e.target.checked})} 
                  className="w-5 h-5 accent-luxury-gold"
                />
                <span className="font-medium text-gray-900">Ödül Teslim Edildi</span>
              </label>

              <div className="space-y-1">
                <label className="text-sm font-medium">Teslimat Notu (Kargo Takip No vb.)</label>
                <textarea 
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-luxury-gold outline-none"
                  rows={3}
                  value={editingSpin.delivery_note || ''}
                  onChange={e => setEditingSpin({...editingSpin, delivery_note: e.target.value})}
                  placeholder="Kullanıcıya elden teslim edildi veya kargo takip no: 123456"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSpin(null)}>İptal</Button>
                <Button onClick={handleUpdateDelivery}>Kaydet</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
