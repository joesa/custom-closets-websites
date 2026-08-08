'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { PUBLIC_API_URL } from '@/lib/urls'
import type { ThemeType } from '@/types/config'
import { getSectionTokens, type ThemeTokenSelection } from '@/lib/theme'

type Service = {
  id: string
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  tier: string
}

type AvailabilityWindow = {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

type BookedSlot = {
  booking_date: string
  booking_time: string
  service_id: string
}

export default function BookingEngine({ 
  contractorId, 
  accentColor = '#2d2d2d',
  radius = 'soft',
  theme,
  themeTokens,
  fontSeed,
}: { 
  contractorId: string
  accentColor?: string
  radius?: 'sharp' | 'soft' | 'pill'
  theme?: ThemeType
  themeTokens?: ThemeTokenSelection | null
  fontSeed?: string
}) {
  const radiusPx = radius === 'sharp' ? '4px' : radius === 'pill' ? '9999px' : '16px'

  const section = theme ? getSectionTokens(theme, fontSeed ?? '', themeTokens) : null
  const isDark = section?.isDark ?? false
  const ui = {
    card: `${section?.surface ?? 'bg-white'} ${section?.surfaceBorder ?? 'border-zinc-100'}`,
    headerBg: isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-100',
    stepIdle: isDark ? 'bg-white/15' : 'bg-zinc-200',
    heading: isDark ? 'text-white' : 'text-zinc-900',
    body: isDark ? 'text-white/60' : 'text-zinc-500',
    bodyStrong: isDark ? 'text-white/70' : 'text-zinc-600',
    muted: isDark ? 'text-white/40' : 'text-zinc-400',
    label: isDark ? 'text-white/80' : 'text-zinc-700',
    hoverHeading: isDark ? 'hover:text-white' : 'hover:text-zinc-900',
    panel: isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-100',
    itemBorder: isDark ? 'border-white/15 hover:border-white/35' : 'border-zinc-200 hover:border-zinc-400',
    optionIdle: isDark ? 'border-white/15 hover:border-white/30 text-white/70' : 'border-zinc-200 hover:border-zinc-300 text-zinc-700',
    dashedBorder: isDark ? 'border-white/15' : 'border-zinc-200',
    divider: isDark ? 'border-white/10' : 'border-zinc-100',
    input: isDark
      ? 'bg-white/5 border-white/15 text-white placeholder-white/40 focus:border-white/40'
      : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-400',
    errorBox: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
    spinner: isDark ? 'text-white/30' : 'text-zinc-300',
    chevron: isDark ? 'text-white/30 group-hover:text-white/60' : 'text-zinc-300 group-hover:text-zinc-500',
    badge: isDark ? 'text-emerald-300 bg-emerald-500/15' : 'text-emerald-700 bg-emerald-50',
  }
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Service, 2: Date/Time, 3: Details, 4: Done
  
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([])
  const [booked, setBooked] = useState<BookedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const [servRes, availRes] = await Promise.all([
          fetch(`${PUBLIC_API_URL}/api/booking/services?contractorId=${contractorId}`),
          fetch(`${PUBLIC_API_URL}/api/booking/availability?contractorId=${contractorId}`)
        ])
        if (!mounted) return
        
        const servData = await servRes.json()
        const availData = await availRes.json()
        
        if (servData.services) setServices(servData.services)
        if (availData.availability) setAvailability(availData.availability)
        if (availData.booked) setBooked(availData.booked)
      } catch (err) {
        console.error('Failed to load booking config:', err)
        setError('Failed to load booking system. Please try again later.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [contractorId])

  const todayStr = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  const availableDates = useMemo(() => {
    const dates: string[] = []
    const today = new Date()
    today.setHours(0,0,0,0)
    
    if (availability.length > 0) {
      for (let i = 0; i < 60; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        const dayOfWeek = d.getDay()
        if (availability.some(a => a.day_of_week === dayOfWeek)) {
          dates.push(d.toISOString().split('T')[0])
        }
      }
    } else {
      // Fallback: Next 60 days (Mon-Fri) if no availability rows exist
      for (let i = 0; i < 60; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        const day = d.getDay()
        if (day >= 1 && day <= 5) {
          dates.push(d.toISOString().split('T')[0])
        }
      }
    }

    if (selectedDate && !dates.includes(selectedDate)) {
      dates.push(selectedDate)
      dates.sort()
    }

    return dates
  }, [availability, selectedDate])

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedService) return []
    const d = new Date(selectedDate + 'T12:00:00Z')
    const dayOfWeek = d.getUTCDay()
    let windows = availability.filter(a => a.day_of_week === dayOfWeek)
    
    if (windows.length === 0) {
      windows = [{ day_of_week: dayOfWeek, start_time: '09:00:00', end_time: '17:00:00', slot_duration_minutes: 60 }]
    }
    
    const times: string[] = []
    for (const win of windows) {
      const startParts = (win.start_time || '09:00:00').split(':').map(Number)
      const endParts = (win.end_time || '17:00:00').split(':').map(Number)
      
      let currentMinutes = startParts[0] * 60 + startParts[1]
      const endMinutes = endParts[0] * 60 + endParts[1]
      const duration = selectedService.durationMinutes || 30
      const stepMins = win.slot_duration_minutes || duration
      
      while (currentMinutes + duration <= endMinutes) {
        const h = Math.floor(currentMinutes / 60)
        const m = currentMinutes % 60
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
        
        const isBooked = booked.some(b => b.booking_date === selectedDate && b.booking_time === timeStr)
        if (!isBooked) {
          times.push(timeStr)
        }
        
        currentMinutes += stepMins
      }
    }
    return times
  }, [selectedDate, selectedService, availability, booked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedService || !selectedDate || !selectedTime || !name || !email) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/booking/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePriceCents: selectedService.priceCents,
          date: selectedDate,
          time: selectedTime,
          name, email, phone, notes
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStep(4)
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (cents: number) => {
    if (!cents || cents <= 0) return null;
    return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
  };
  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m), 0)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00Z')
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className={`flex min-h-[300px] w-full items-center justify-center shadow-xl border ${ui.card}`} style={{ borderRadius: radiusPx }}>
        <Loader2 className={`h-8 w-8 animate-spin ${ui.spinner}`} />
      </div>
    )
  }

  return (
    <div className={`mx-auto w-full max-w-2xl overflow-hidden shadow-xl border relative ${ui.card}`} style={{ borderRadius: radiusPx }}>
      {/* Progress Header */}
      {step < 4 && (
        <div className={`px-6 py-4 border-b flex items-center justify-between ${ui.headerBg}`}>
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1 as any)}
              className={`flex items-center text-sm font-medium transition-colors ${ui.body} ${ui.hoverHeading}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </button>
          ) : (
            <div className={`text-sm font-medium ${ui.body}`}>Step 1 of 3</div>
          )}
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-2 w-8 rounded-full transition-colors ${i <= step ? '' : ui.stepIdle}`}
                style={{ backgroundColor: i <= step ? accentColor : undefined }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <h3 className={`text-2xl font-bold ${ui.heading}`}>Select a Service</h3>
                <p className={`mt-1 ${ui.body}`}>Choose the service you'd like to book.</p>
              </div>
              
              {services.length === 0 ? (
                <div className={`p-8 text-center border-2 border-dashed rounded-xl ${ui.dashedBorder}`}>
                  <p className={ui.body}>No services available for booking right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => { setSelectedService(service); setStep(2) }}
                      className={`w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between ${ui.itemBorder}`}
                    >
                      <div>
                        <div className={`font-semibold text-lg ${ui.heading}`}>{service.name}</div>
                        {service.description && (
                          <div className={`text-sm mt-1 line-clamp-1 ${ui.body}`}>{service.description}</div>
                        )}
                        <div className={`flex gap-4 mt-2 text-sm font-medium ${ui.bodyStrong}`}>
                          <span className="flex items-center"><Clock className="h-4 w-4 mr-1 opacity-70" /> {service.durationMinutes} min</span>
                          {formatPrice(service.priceCents) ? <span>{formatPrice(service.priceCents)}</span> : null}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${ui.chevron}`} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <h3 className={`text-2xl font-bold ${ui.heading}`}>Date & Time</h3>
                <p className={`mt-1 ${ui.body}`}>When would you like to come in?</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${ui.heading}`}>Select Date</label>
                  <div className={`mb-3 p-2.5 border rounded-lg ${ui.panel}`}>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${ui.body}`}>
                      📅 Choose Specific Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(e.target.value)
                          setSelectedTime('')
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs font-semibold border rounded focus:outline-none focus:ring-2 ${ui.input} ${isDark ? 'focus:ring-white/30' : 'focus:ring-emerald-500'}`}
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableDates.length === 0 ? (
                      <p className={`text-sm ${ui.body}`}>No availability currently found.</p>
                    ) : (
                      availableDates.map(date => (
                        <button
                          key={date}
                          onClick={() => { setSelectedDate(date); setSelectedTime('') }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                            selectedDate === date 
                              ? 'border-transparent text-white font-semibold' 
                              : ui.optionIdle
                          }`}
                          style={selectedDate === date ? { backgroundColor: accentColor } : {}}
                        >
                          {formatDate(date)}
                          {selectedDate === date && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${ui.heading}`}>Select Time</label>
                  {!selectedDate ? (
                    <div className={`p-4 rounded-lg text-sm border text-center ${ui.panel} ${ui.body}`}>
                      Select a date first
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <div className={`p-4 rounded-lg text-sm border text-center ${ui.panel} ${ui.body}`}>
                      No times available
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 py-3 rounded-lg border text-sm text-center transition-all ${
                            selectedTime === time 
                              ? 'border-transparent text-white font-semibold shadow-md' 
                              : ui.optionIdle
                          }`}
                          style={selectedTime === time ? { backgroundColor: accentColor } : {}}
                        >
                          {formatTime(time)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`pt-4 border-t ${ui.divider}`}>
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg transition-opacity disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: accentColor }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <h3 className={`text-2xl font-bold ${ui.heading}`}>Your Details</h3>
                <p className={`mt-1 ${ui.body}`}>Almost done! Just need a few details.</p>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${ui.panel}`}>
                <div>
                  <div className={`font-semibold ${ui.heading}`}>{selectedService?.name}</div>
                  <div className={`text-sm mt-0.5 ${ui.body}`}>{formatDate(selectedDate)} at {formatTime(selectedTime)}</div>
                </div>
                {formatPrice(selectedService?.priceCents || 0) ? (
                  <div className={`font-bold ${ui.heading}`}>{formatPrice(selectedService?.priceCents || 0)}</div>
                ) : (
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-md ${ui.badge}`}>In-Office / Insurance</div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className={`p-3 rounded-lg text-sm ${ui.errorBox}`}>{error}</div>}
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${ui.label}`}>Your name</label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3 h-5 w-5 ${ui.muted}`} />
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-colors ${ui.input}`} placeholder="Your name" />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${ui.label}`}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-3 h-5 w-5 ${ui.muted}`} />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-colors ${ui.input}`} placeholder="you@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${ui.label}`}>Phone</label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-3 h-5 w-5 ${ui.muted}`} />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-colors ${ui.input}`} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${ui.label}`}>Notes (Optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none ${ui.input}`} placeholder="Anything we should know?" />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg transition-opacity flex items-center justify-center disabled:opacity-70 hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center py-10 space-y-4">
              <div 
                className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className={`text-3xl font-bold ${ui.heading}`}>Booking Confirmed!</h3>
              <p className={`max-w-sm mx-auto text-lg leading-relaxed ${ui.body}`}>
                You're all set for <strong>{selectedService?.name}</strong> on <br/>
                <span className={`font-medium ${ui.heading}`}>{formatDate(selectedDate)} at {formatTime(selectedTime)}</span>.
              </p>
              <p className={`text-sm pt-4 ${ui.muted}`}>
                We've sent a confirmation email to {email}.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
