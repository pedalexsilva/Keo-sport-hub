import React, { useState } from 'react';
import { Event, ActivityType, User } from '../types';
import { Calendar, MapPin, Users, Plus, X, ChevronDown, ChevronUp, History, Trophy, ExternalLink } from 'lucide-react';
import Button from '../components/Button';
import { useEvents, useCreateEvent, useJoinEvent } from '../hooks/useEvents';

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

  const handleJoin = (eventId: string, currentParticipants: string[]) => {
    const isJoined = currentParticipants.includes(user.id);
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
      creatorId: user.id
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
        {displayedEvents.map((evt) => {
          const isParticipant = evt.participants.includes(user.id);
          const isExpanded = expandedEventId === evt.id;
          const isPast = activeTab === 'history';

          return (
            <div key={evt.id} className={`group overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-2 ring-blue-100' : ''} ${isPast ? 'opacity-90' : ''}`}>
              <div
                className="relative h-48 w-full overflow-hidden cursor-pointer"
                onClick={() => toggleExpand(evt.id)}
              >
                <img src={evt.image} alt={evt.title} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isPast ? 'grayscale-[50%]' : ''}`} />
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-800 backdrop-blur-sm shadow-sm">
                  {evt.type}
                </div>
                {isPast && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20 backdrop-blur-md">
                      Evento Terminado
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  {new Date(evt.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>

                <h3
                  className="mb-2 text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => toggleExpand(evt.id)}
                >
                  {evt.title}
                </h3>

                <p className={`mb-4 text-sm text-gray-600 transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {evt.description}
                </p>

                {!isExpanded && (
                  <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[150px]">{evt.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                      {evt.participants.length}
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      {evt.location}
                    </div>

                    {/* Leaderboard Logic for Past Events */}
                    {isPast ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm italic">
                          Os resultados do evento serão processados brevemente.
                        </div>

                        {/* Map Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-red-500" />
                            Localização
                          </h4>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group/map relative h-32 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 transition-all hover:shadow-md hover:border-blue-300"
                          >
                            {/* Simulated Map Background */}
                            <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Open_Street_Map_Chile_Relief.png/640px-Open_Street_Map_Chile_Relief.png')] bg-cover bg-center grayscale group-hover/map:grayscale-0 transition-all duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent"></div>

                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-xs font-bold text-gray-700 flex items-center gap-2 group-hover/map:scale-105 transition-transform">
                                <MapPin size={14} className="text-red-500" />
                                Ver {evt.location} no Mapa
                                <ExternalLink size={12} className="text-gray-400" />
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* Participants List for Future Events */
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Participantes ({evt.participants.length})
                        </h4>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {evt.participants.length > 0 ? evt.participants.map(pid => (
                            <div key={pid} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {pid.replace('user_', 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {pid === user.id ? 'Você' : `Colega Keo (${pid})`}
                                </span>
                              </div>
                              {pid === evt.creatorId && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Host</span>}
                            </div>
                          )) : (
                            <p className="text-sm text-gray-400 italic">Seja o primeiro a participar!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {!isPast && (
                    <Button
                      variant={isParticipant ? "outline" : "primary"}
                      className="flex-1"
                      onClick={() => handleJoin(evt.id, evt.participants)}
                    >
                      {isParticipant ? "Sair do Evento" : "Participar Agora"}
                    </Button>
                  )}
                  {isPast && (
                    <Button variant="secondary" className="flex-1 cursor-default" disabled>
                      <Trophy className="w-4 h-4 mr-2" />
                      Evento Concluído
                    </Button>
                  )}
                  <button
                    onClick={() => toggleExpand(evt.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    title={isExpanded ? "Ver menos" : "Ver detalhes"}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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