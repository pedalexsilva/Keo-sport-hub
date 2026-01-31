import React, { useState } from 'react';
import { Gift, ShoppingBag, CheckCircle2 } from 'lucide-react';

const STORE_ITEMS = [
    { id: 1, name: "Garrafa Térmica KEO", cost: 800, category: "Merch", image: "https://images.unsplash.com/photo-1602143407151-011141950038?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", popular: true },
    { id: 2, name: "Voucher Saída 1h Cedo", cost: 2500, category: "Benefícios", image: "https://images.unsplash.com/photo-1499750310159-57751c6e9f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", popular: false },
    { id: 3, name: "Hoodie KEO Active", cost: 3500, category: "Merch", image: "https://images.unsplash.com/photo-1556906781-9a412961d289?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", popular: false },
    { id: 4, name: "Café Grátis (Semana)", cost: 300, category: "Pausa", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", popular: true },
];

interface StoreViewProps {
    points: number;
    handlePurchase: (item: any) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ points, handlePurchase }) => {
    const [purchasing, setPurchasing] = useState<number | null>(null);

    const onPurchaseClick = (item: any) => {
        setPurchasing(item.id);
        setTimeout(() => {
            handlePurchase(item);
            setPurchasing(null);
        }, 800);
    };

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#002D72]">KEO Store</h2>
                <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Recompensas
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {STORE_ITEMS.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full group">
                        <div className="relative h-32 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            {item.popular && (<div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">POPULAR</div>)}
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-bold text-sm text-gray-900 leading-tight mb-2 mt-1 flex-1">{item.name}</h3>
                            <div className="flex items-center justify-between mt-3">
                                <span className="font-bold text-[#002D72] text-sm">{item.cost} <span className="text-[10px]">pts</span></span>
                                <button
                                    onClick={() => onPurchaseClick(item)}
                                    disabled={points < item.cost}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${purchasing === item.id ? 'bg-green-500 text-white animate-bounce' : points >= item.cost ? 'bg-[#009CDE] text-white hover:bg-[#002D72]' : 'bg-gray-200 text-gray-400'}`}
                                >
                                    {purchasing === item.id ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoreView;
