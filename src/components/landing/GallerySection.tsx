import React from 'react';

const GallerySection: React.FC = () => {
    return (
        <section id="galeria" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-[#002D72] mb-12">Momentos KEO</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96">
                    <div className="col-span-2 row-span-2 relative group overflow-hidden rounded-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1526676037777-05a232554f77?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            alt="Team"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className="text-white font-bold">Team Building 2024</span>
                        </div>
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            alt="Workout"
                        />
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            alt="Training"
                        />
                    </div>
                    <div className="col-span-2 relative group overflow-hidden rounded-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            alt="Conference"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className="text-white font-bold">KEO Conference</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GallerySection;
