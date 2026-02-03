import React, { useState } from 'react';
import { List, Loader2, Plus, Search, ImageIcon, Calendar, MapPin, Edit2, Trash2, X } from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, uploadEventMedia } from '../../hooks/useEvents';
import { ActivityType, Event } from '../../types';
import { StageManager } from './StageManager';
import { formatDate } from '../../utils/dateUtils';

export const EventsManager = () => {
    const { data: events, isLoading } = useEvents();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [showModal, setShowModal] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchText, setSearchText] = useState('');

    const [currentEvent, setCurrentEvent] = useState<Partial<Event>>({
        title: '',
        date: '',
        location: '',
        type: ActivityType.RUN,
        description: '',
        image: '',
        maxParticipants: 0,
        mode: 'competitive',
        status: 'open'
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleEdit = (evt: Event) => {
        setCurrentEvent({
            ...evt,
            date: evt.date.substring(0, 16) // Format for datetime-local input
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setCurrentEvent({
            title: '',
            date: '',
            location: '',
            type: ActivityType.RUN,
            description: '',
            image: '',
            maxParticipants: undefined,
            mode: 'competitive',
            status: 'open'
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this event?")) {
            await deleteEvent.mutateAsync(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = currentEvent.image;

            if (imageFile) {
                imageUrl = await uploadEventMedia(imageFile);
            }

            const eventData = {
                ...currentEvent,
                image: imageUrl,
                date: new Date(currentEvent.date as string).toISOString()
            };

            if (currentEvent.id) {
                // Update
                await updateEvent.mutateAsync({
                    ...eventData,
                    id: currentEvent.id
                } as any);
            } else {
                // Create
                await createEvent.mutateAsync(eventData as any);
            }

            setShowModal(false);
        } catch (error) {
            console.error(error);
            alert("Error saving event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedEvents = React.useMemo(() => (events || [])
        .filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchText.toLowerCase());
            const matchesStatus = filterStatus === 'All' || e.status === filterStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [events, searchText, filterStatus]);

    if (isLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#002D72]" /></div>;

    return (
        <div className="p-8 animate-fade-in relative h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Event Management</h2>
                    <p className="text-gray-500 text-sm">Create, edit, and manage events and registrations.</p>
                </div>
                <button onClick={handleCreate} className="bg-[#002D72] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition shadow-lg">
                    <Plus className="w-5 h-5" /> New Event
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-[#009CDE] outline-none"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <select
                    className="bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-medium outline-none cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option>All</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Location</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Enrolled</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedEvents.map((evt) => (
                            <tr key={evt.id} className="hover:bg-blue-50/50 transition group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                            {evt.image ? (
                                                <img src={evt.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-5 h-5" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 line-clamp-1">{evt.title}</div>
                                            <div className="text-xs text-gray-500">{evt.type}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${evt.status === 'open' ? 'bg-green-100 text-green-700' :
                                            evt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                evt.status === 'closed' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                        {evt.status || 'open'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                        <Calendar className="w-3 h-3" />
                                        {(() => {
                                            const start = formatDate(evt.date);
                                            const end = evt.endDate ? formatDate(evt.endDate) : start;
                                            return start === end ? start : `${start} - ${end}`;
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3" /> {evt.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{evt.participants?.length || 0}</span>
                                            {evt.maxParticipants && <span>/ {evt.maxParticipants}</span>}
                                        </div>
                                        {evt.maxParticipants && (
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${(evt.participants?.length || 0) >= evt.maxParticipants ? 'bg-red-500' : 'bg-[#009CDE]'}`}
                                                    style={{ width: `${Math.min(100, ((evt.participants?.length || 0) / evt.maxParticipants) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedEventId(evt.id)} className="p-2 text-gray-400 hover:text-[#009CDE] hover:bg-blue-50 rounded-lg transition" title="Manage Stages">
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleEdit(evt)} className="p-2 text-gray-400 hover:text-[#002D72] hover:bg-blue-50 rounded-lg transition" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(evt.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedEvents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No events found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4 bg-gray-50">
                    {sortedEvents.map((evt) => (
                        <div key={evt.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        {evt.image ? (
                                            <img src={evt.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-5 h-5" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 line-clamp-1 text-sm">{evt.title}</div>
                                        <div className="text-xs text-gray-500">{evt.type} • {evt.location}</div>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${evt.status === 'open' ? 'bg-green-100 text-green-700' :
                                    evt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {evt.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div>
                                    <span className="font-bold uppercase block text-[10px] text-gray-400">Data</span>
                                    <span className="font-bold uppercase block text-[10px] text-gray-400">Date</span>
                                    {(() => {
                                        const start = formatDate(evt.date);
                                        const end = evt.endDate ? formatDate(evt.endDate) : start;
                                        return start === end ? start : `${start} - ${end}`;
                                    })()}
                                </div>
                                <div>
                                    <span className="font-bold uppercase block text-[10px] text-gray-400">Enrolled</span>
                                    {evt.participants?.length || 0} / {evt.maxParticipants || '∞'}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-50">
                                <button onClick={() => setSelectedEventId(evt.id)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><List className="w-3 h-3" /> Stages</button>
                                <button onClick={() => handleEdit(evt)} className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                                <button onClick={() => handleDelete(evt.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stage Manager Modal */}
            {selectedEventId && (
                <StageManager eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
            )}

            {/* Modal */}
            {showModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#002D72]">
                                {currentEvent.id ? 'Edit Event' : 'New Event'}
                            </h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#009CDE] outline-none"
                                        value={currentEvent.title}
                                        onChange={e => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activity Type</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.type}
                                        onChange={e => setCurrentEvent({ ...currentEvent, type: e.target.value as ActivityType })}
                                    >
                                        {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Mode</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.mode || 'competitive'}
                                        onChange={e => setCurrentEvent({ ...currentEvent, mode: e.target.value as any })}
                                    >
                                        <option value="competitive">Competitive (Rankings + Stages)</option>
                                        <option value="social">Social (Presence Only)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.status}
                                        onChange={e => setCurrentEvent({ ...currentEvent, status: e.target.value as any })}
                                    >
                                        <option value="open">Open (Reg. Open)</option>
                                        <option value="closed">Closed (Reg. Closed)</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date and Time</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                                value={currentEvent.date ? currentEvent.date.split('T')[0] : ''}
                                                onChange={e => {
                                                    const time = currentEvent.date && currentEvent.date.includes('T') ? currentEvent.date.split('T')[1] : '09:00';
                                                    setCurrentEvent({ ...currentEvent, date: `${e.target.value}T${time}` });
                                                }}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <input
                                                type="time"
                                                required
                                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                                value={currentEvent.date && currentEvent.date.includes('T') ? currentEvent.date.split('T')[1] : '09:00'}
                                                onChange={e => {
                                                    const date = currentEvent.date && currentEvent.date.includes('T') ? currentEvent.date.split('T')[0] : new Date().toISOString().split('T')[0];
                                                    setCurrentEvent({ ...currentEvent, date: `${date}T${e.target.value}` });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Participants (0 = Unlimited)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.maxParticipants || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.location}
                                        onChange={e => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={currentEvent.description || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image</label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setImageFile(e.target.files[0]);
                                                    }
                                                }}
                                                className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-[#002D72]
                                                    hover:file:bg-blue-100"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Upload new image to replace current one.</p>
                                        </div>
                                        {(currentEvent.image || imageFile) && (
                                            <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                <img
                                                    src={imageFile ? URL.createObjectURL(imageFile) : currentEvent.image}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (currentEvent.id ? 'Save Changes' : 'Create Event')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
