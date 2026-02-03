import React, { useState } from 'react';
import { Gift, ShoppingBag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useStore, Product } from '../hooks/useStore';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import PreviewOverlay from '../components/PreviewOverlay';

interface StoreViewProps {
    points: number;
    handlePurchase: (item: any) => void; // Keeping compatible with parent prop for now, though we might want to refresh parent state
}

const StoreView: React.FC<StoreViewProps> = ({ points, handlePurchase: onParentPurchaseSuccess }) => {
    const { products, loading, error, purchaseItem } = useStore();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const onPurchaseClick = async (product: Product) => {
        setPurchasing(product.id);
        setPurchaseError(null);

        const result = await purchaseItem(product.id);

        if (result.success) {
            // Wait a bit for visual feedback
            setTimeout(() => {
                setPurchasing(null);
                onParentPurchaseSuccess(product); // Notify parent to refresh points
            }, 800);
        } else {
            setPurchasing(null);
            setPurchaseError(result.error);
            setTimeout(() => setPurchaseError(null), 3000);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#002D72]" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading store: {error}</div>;

    return (
        <PreviewOverlay
            message="KEO Rewards Store"
            subMessage="Spend your hard-earned points on exclusive rewards. Opening soon!"
        >
            <div className="px-6 pb-24 pt-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#002D72]">KEO Store</h2>
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100 flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Rewards
                    </div>
                </div>

                {purchaseError && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {purchaseError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {products.map(item => (
                        <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full group ${item.stock === 0 ? 'opacity-60' : ''}`}>
                            <div className="relative h-32 overflow-hidden bg-gray-50">
                                {item.image_url ? (
                                    <img
                                        src={getOptimizedImageUrl(item.image_url, 400, 320)}
                                        alt={item.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-8 h-8" /></div>
                                )}
                                {item.stock < 5 && item.stock > 0 && (<div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">LAST UNITS</div>)}
                                {item.stock === 0 && (<div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-gray-500 uppercase tracking-widest text-xs">Sold Out</div>)}
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                                <h3 className="font-bold text-sm text-gray-900 leading-tight mb-2 mt-1 flex-1">{item.name}</h3>
                                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-bold text-[#002D72] text-sm">{item.cost} <span className="text-[10px]">pts</span></span>
                                    <button
                                        onClick={() => onPurchaseClick(item)}
                                        disabled={points < item.cost || item.stock === 0 || purchasing !== null}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${purchasing === item.id
                                            ? 'bg-green-500 text-white animate-bounce'
                                            : points >= item.cost && item.stock > 0
                                                ? 'bg-[#009CDE] text-white hover:bg-[#002D72]'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {purchasing === item.id ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center p-12 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>The store is empty at the moment.</p>
                    </div>
                )}
            </div>
        </PreviewOverlay>
    );
};

export default StoreView;
