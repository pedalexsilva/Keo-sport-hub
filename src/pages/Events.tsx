import React, { useState } from 'react';
import { Event, ActivityType, User } from '../types';
import { Calendar, MapPin, Users, Plus, X, ChevronDown, ChevronUp, History, Trophy, ExternalLink } from 'lucide-react';
import Button from '../components/Button';
import { useEvents, useCreateEvent, useJoinEvent } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';

interface EventsProps {
  user: User;
}

const Events: React.FC<EventsProps> = ({ user }) => {
  const { data: eventsData, isLoading } = useEvents();
  const createEventMutation = useCreateEvent();
  const joinEventMutation = useJoinEvent();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    location: '',
    type: ActivityType.RUN,
    date: '',
    description: ''
  });

  if (isLoading) return <div className="p-8 text-center">A carregar eventos...</div>;

  const events = eventsData || [];
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastEvents = events.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const handleJoin = (eventId: string, currentParticipants: any[]) => {
    const isJoined = currentParticipants.some(p => p.id === user.id);
    joinEventMutation.mutate({ eventId, userId: user.id, isJoining: !isJoined });
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId(prev => prev === id ? null : id);
  };


  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    createEventMutation.mutate({
      title: newEvent.title!,
      description: newEvent.description || '',
      date: newEvent.date!,
      location: newEvent.location || 'TBD',
      type: newEvent.type || ActivityType.RUN,
      image: '',
      status: 'open',
      mode: 'social'
    }, {
      onSuccess: () => {
        setShowModal(false);
        setNewEvent({ title: '', location: '', type: ActivityType.RUN, date: '', description: '' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos Keo</h1>
          <p className="text-gray-600">Participe, concorra e supere os seus colegas.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Evento
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'upcoming'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Calendar size={16} />
            Próximos Eventos
            <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs ml-1">
              {upcomingEvents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <History size={16} />
            Histórico
          </button>
        </nav>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
        {displayedEvents.map((evt) => (
          <EventCard
            key={evt.id}
            evt={evt}
            user={user}
            isExpanded={expandedEventId === evt.id}
            toggleExpand={toggleExpand}
            isPast={activeTab === 'history'}
            handleJoin={handleJoin}
          />
        ))}
      </div>

      {displayedEvents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-400 w-8 h-8" />
          </div>
          <h3 className="text-gray-900 font-medium mb-1">Sem eventos nesta categoria</h3>
          <p className="text-gray-500 text-sm">Crie um novo evento ou verifique a outra aba.</p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Novo Evento</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Ex: Corrida Noturna"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as ActivityType })}
                  >
                    {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data e Hora</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Localização</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Ex: Entrada do Escritório"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                </div>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-blue-500 h-24"
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalhes do evento..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Criar Evento</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;