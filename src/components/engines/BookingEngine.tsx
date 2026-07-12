'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { PUBLIC_API_URL } from '@/lib/urls'

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
}: { 
  contractorId: string
  accentColor?: string
  radius?: 'sharp' | 'soft' | 'pill'
}) {
  const radiusPx = radius === 'sharp' ? '4px' : radius === 'pill' ? '9999px' : '16px'
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

  const availableDates = useMemo(() => {
    if (availability.length === 0) return []
    const dates: string[] = []
    const today = new Date()
    today.setHours(0,0,0,0)
    
    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dayOfWeek = d.getDay()
      if (availability.some(a => a.day_of_week === dayOfWeek)) {
        dates.push(d.toISOString().split('T')[0])
      }
    }
    return dates
  }, [availability])

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedService) return []
    const d = new Date(selectedDate + 'T12:00:00Z')
    const dayOfWeek = d.getUTCDay()
    const windows = availability.filter(a => a.day_of_week === dayOfWeek)
    
    if (windows.length === 0) return []
    
    const times: string[] = []
    for (const win of windows) {
      // Basic slot generation for demonstration
      // Parse HH:MM:SS
      const startParts = win.start_time.split(':').map(Number)
      const endParts = win.end_time.split(':').map(Number)
      
      let currentMinutes = startParts[0] * 60 + startParts[1]
      const endMinutes = endParts[0] * 60 + endParts[1]
      
      while (currentMinutes + selectedService.durationMinutes <= endMinutes) {
        const h = Math.floor(currentMinutes / 60)
        const m = currentMinutes % 60
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
        
        // Filter out if booked
        const isBooked = booked.some(b => b.booking_date === selectedDate && b.booking_time === timeStr)
        if (!isBooked) {
          times.push(timeStr)
        }
        
        currentMinutes += win.slot_duration_minutes || selectedService.durationMinutes
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

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
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
      <div className="flex min-h-[300px] w-full items-center justify-center bg-white shadow-xl border border-zinc-100" style={{ borderRadius: radiusPx }}>
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden bg-white shadow-xl border border-zinc-100 relative" style={{ borderRadius: radiusPx }}>
      {/* Progress Header */}
      {step < 4 && (
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1 as any)}
              className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </button>
          ) : (
            <div className="text-sm font-medium text-zinc-500">Step 1 of 3</div>
          )}
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-2 w-8 rounded-full transition-colors ${i <= step ? '' : 'bg-zinc-200'}`}
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
                <h3 className="text-2xl font-bold text-zinc-900">Select a Service</h3>
                <p className="text-zinc-500 mt-1">Choose the service you'd like to book.</p>
              </div>
              
              {services.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                  <p className="text-zinc-500">No services available for booking right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => { setSelectedService(service); setStep(2) }}
                      className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-all group flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900 text-lg">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-zinc-500 mt-1 line-clamp-1">{service.description}</div>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-zinc-600 font-medium">
                          <span className="flex items-center"><Clock className="h-4 w-4 mr-1 opacity-70" /> {service.durationMinutes} min</span>
                          <span>{formatPrice(service.priceCents)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-zinc-500" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">Date & Time</h3>
                <p className="text-zinc-500 mt-1">When would you like to come in?</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">Select Date</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableDates.length === 0 ? (
                      <p className="text-sm text-zinc-500">No availability currently found.</p>
                    ) : (
                      availableDates.map(date => (
                        <button
                          key={date}
                          onClick={() => { setSelectedDate(date); setSelectedTime('') }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                            selectedDate === date 
                              ? 'border-transparent text-white font-semibold' 
                              : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
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
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">Select Time</label>
                  {!selectedDate ? (
                    <div className="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-500 border border-zinc-100 text-center">
                      Select a date first
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <div className="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-500 border border-zinc-100 text-center">
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
                              : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
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

              <div className="pt-4 border-t border-zinc-100">
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
                <h3 className="text-2xl font-bold text-zinc-900">Your Details</h3>
                <p className="text-zinc-500 mt-1">Almost done! Just need a few details.</p>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900">{selectedService?.name}</div>
                  <div className="text-sm text-zinc-500 mt-0.5">{formatDate(selectedDate)} at {formatTime(selectedTime)}</div>
                </div>
                <div className="font-bold text-zinc-900">{formatPrice(selectedService?.priceCents || 0)}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none transition-colors" placeholder="Jane Doe" />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none transition-colors" placeholder="jane@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none transition-colors" placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (Optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none transition-colors resize-none" placeholder="Anything we should know?" />
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
              <h3 className="text-3xl font-bold text-zinc-900">Booking Confirmed!</h3>
              <p className="text-zinc-500 max-w-sm mx-auto text-lg leading-relaxed">
                You're all set for <strong>{selectedService?.name}</strong> on <br/>
                <span className="text-zinc-900 font-medium">{formatDate(selectedDate)} at {formatTime(selectedTime)}</span>.
              </p>
              <p className="text-sm text-zinc-400 pt-4">
                We've sent a confirmation email to {email}.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
