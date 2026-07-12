'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, MapPin, User, Mail, Phone, Ticket, CheckCircle2, ChevronRight, ArrowLeft, Loader2, Minus, Plus } from 'lucide-react'
import { PUBLIC_API_URL } from '@/lib/urls'

type TicketEvent = {
  id: string
  name: string
  description: string
  date: string
  time: string
  venue: string
  capacity: number | null
  priceCents: number
}

export default function TicketEngine({ 
  contractorId, 
  accentColor = '#2d2d2d',
  radius = 'soft',
}: { 
  contractorId: string
  accentColor?: string
  radius?: 'sharp' | 'soft' | 'pill'
}) {
  const radiusPx = radius === 'sharp' ? '4px' : radius === 'pill' ? '9999px' : '16px'
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Events, 2: Details & Quantity, 3: Done
  
  const [events, setEvents] = useState<TicketEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const res = await fetch(`${PUBLIC_API_URL}/api/tickets/events?contractorId=${contractorId}`)
        if (!mounted) return
        
        const data = await res.json()
        if (data.events) setEvents(data.events)
      } catch (err) {
        console.error('Failed to load events:', err)
        setError('Failed to load ticketing system. Please try again later.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [contractorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedEvent || !name || !email || quantity < 1) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/tickets/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          name, email, phone, quantity,
          totalCents: selectedEvent.priceCents * quantity
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket request.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00Z')
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }
  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m), 0)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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
      {step < 3 && (
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1 as any)}
              className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </button>
          ) : (
            <div className="text-sm font-medium text-zinc-500">Select Event</div>
          )}
          <div className="flex gap-2">
            {[1, 2].map(i => (
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
                <h3 className="text-2xl font-bold text-zinc-900">Upcoming Events</h3>
                <p className="text-zinc-500 mt-1">Select an event to reserve your tickets.</p>
              </div>
              
              {events.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center">
                  <CalendarDays className="h-10 w-10 text-zinc-300 mb-3" />
                  <p className="text-zinc-500 font-medium">No upcoming events right now.</p>
                  <p className="text-sm text-zinc-400 mt-1">Check back later for new dates.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => { 
                        setSelectedEvent(event)
                        setQuantity(1)
                        setStep(2) 
                      }}
                      className="w-full text-left p-5 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-4 justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-zinc-900 text-xl">{event.name}</div>
                        {event.description && (
                          <div className="text-sm text-zinc-500 mt-2 line-clamp-2">{event.description}</div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center text-sm text-zinc-600 font-medium bg-zinc-50 py-1.5 px-3 rounded-lg border border-zinc-100">
                            <CalendarDays className="h-4 w-4 mr-2 text-zinc-400" /> 
                            {formatDate(event.date)}
                            {event.time && <span className="ml-1 text-zinc-400">• {formatTime(event.time)}</span>}
                          </div>
                          {event.venue && (
                            <div className="flex items-center text-sm text-zinc-600 font-medium bg-zinc-50 py-1.5 px-3 rounded-lg border border-zinc-100">
                              <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center min-w-[100px] border-t sm:border-t-0 sm:border-l border-zinc-100 pt-4 sm:pt-0 sm:pl-4">
                        <div className="text-center">
                          <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">Per Ticket</div>
                          <div className="text-2xl font-bold text-zinc-900" style={{ color: accentColor }}>
                            {formatPrice(event.priceCents)}
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-zinc-300 group-hover:translate-x-1 transition-transform hidden sm:block mt-2" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">Checkout</h3>
                <p className="text-zinc-500 mt-1">Select quantity and provide your details.</p>
              </div>

              <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-bold text-lg text-zinc-900">{selectedEvent?.name}</div>
                  <div className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" /> {selectedEvent ? formatDate(selectedEvent.date) : ''}
                    {selectedEvent?.time && <> • {formatTime(selectedEvent.time)}</>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white px-2 py-2 rounded-lg border border-zinc-200 shadow-sm">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="w-8 text-center font-bold text-lg">{quantity}</div>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
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

                <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-zinc-500">Total Total</div>
                    <div className="text-2xl font-bold text-zinc-900">
                      {formatPrice((selectedEvent?.priceCents || 0) * quantity)}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 rounded-xl text-white font-bold text-lg transition-opacity flex items-center justify-center disabled:opacity-70 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/10"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Get Tickets'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center py-10 space-y-4">
              <div 
                className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 shadow-inner"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <Ticket className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-bold text-zinc-900">You're going!</h3>
              <p className="text-zinc-500 max-w-sm mx-auto text-lg leading-relaxed">
                We've reserved {quantity} ticket{quantity > 1 ? 's' : ''} for <strong>{selectedEvent?.name}</strong>.
              </p>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 max-w-sm mx-auto mt-6 text-left space-y-2 text-sm text-zinc-600">
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-400">Date</span>
                  <span className="font-medium text-zinc-900">{selectedEvent ? formatDate(selectedEvent.date) : ''}</span>
                </div>
                {selectedEvent?.time && (
                  <div className="flex justify-between border-b border-zinc-200 py-2">
                    <span className="text-zinc-400">Time</span>
                    <span className="font-medium text-zinc-900">{formatTime(selectedEvent.time)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-400">Name</span>
                  <span className="font-medium text-zinc-900">{name}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400 pt-6">
                Check your email ({email}) for your tickets.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
