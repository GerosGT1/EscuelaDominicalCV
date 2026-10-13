import { useState, useEffect } from 'react'
import { Upload, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface SettingMap { [key: string]: string }

export function AdminSettingsPage() {
  const { profile } = useAuth()
  const [settings, setSettings] = useState<SettingMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolLogoFile, setSchoolLogoFile] = useState<File | null>(null)
  const [churchLogoFile, setChurchLogoFile] = useState<File | null>(null)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map: SettingMap = {}
        data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
      }
      setLoading(false)
    })
  }, [])

  const uploadLogo = async (file: File, key: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `logos/${key}.${ext}`
    const { error } = await supabase.storage.from('settings').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('settings').getPublicUrl(path)
    return data.publicUrl
  }

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('settings').upsert({ key, value, updated_by: profile?.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (schoolLogoFile) {
        const url = await uploadLogo(schoolLogoFile, 'school_logo')
        if (url) { await saveSetting('school_logo_url', url); setSettings(s => ({ ...s, school_logo_url: url })) }
      }
      if (churchLogoFile) {
        const url = await uploadLogo(churchLogoFile, 'church_logo')
        if (url) { await saveSetting('church_logo_url', url); setSettings(s => ({ ...s, church_logo_url: url })) }
      }
      await saveSetting('church_name', settings.church_name ?? '')
      await saveSetting('school_name', settings.school_name ?? '')
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Configuración institucional</h1>
        <p className="section-subtitle">Personaliza los logotipos y datos de la plataforma</p>
      </div>

      {/* Logotipos */}
      <div className="card p-6 space-y-6">
        <h2 className="font-display font-semibold text-neutral-900 border-b pb-3">Logotipos</h2>
        {[
          { key: 'school_logo', label: 'Logotipo Escuela Dominical', settingKey: 'school_logo_url', setter: setSchoolLogoFile },
          { key: 'church_logo', label: 'Logotipo Iglesia', settingKey: 'church_logo_url', setter: setChurchLogoFile },
        ].map(({ key, label, settingKey, setter }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-neutral-700 mb-3">{label}</label>
            <div className="flex items-start gap-4">
              {settings[settingKey] && (
                <img src={settings[settingKey]} alt={label} className="w-16 h-16 object-contain rounded-lg border border-neutral-200" />
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                <span className="text-xs text-neutral-500">Subir nuevo logotipo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setter(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Datos institucionales */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-neutral-900 border-b pb-3">Datos institucionales</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre de la iglesia</label>
          <input
            className="input-base"
            value={settings.church_name ?? ''}
            onChange={e => setSettings(s => ({ ...s, church_name: e.target.value }))}
            placeholder="Ej: Auditorium Cristo Viene"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre de la Escuela Dominical</label>
          <input
            className="input-base"
            value={settings.school_name ?? ''}
            onChange={e => setSettings(s => ({ ...s, school_name: e.target.value }))}
            placeholder="Ej: Escuela Dominical Asambleas de Dios"
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary btn-lg w-full">
        {saving ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : <Save className="w-5 h-5" />}
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  )
}
