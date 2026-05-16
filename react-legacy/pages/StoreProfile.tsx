import React from 'react';
import { getVendorBySlug, getProductsByVendor } from '../services/mockData';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Globe, MapPin } from 'lucide-react';
import { Link } from '../components/Navigation';
import { useParams } from '../lib/router';

export const StoreProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const vendor = React.useMemo(() => slug ? getVendorBySlug(slug) : undefined, [slug]);
  const products = React.useMemo(() => vendor ? getProductsByVendor(Number(vendor.id)) : [], [vendor]);

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black">
        <h1 className="text-2xl font-serif text-gray-500">স্টোর খুঁজে পাওয়া যায়নি</h1>
        <Link to="/" className="text-aura-purple hover:underline">নীড়ে ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Banner */}
      <div className="h-64 bg-gradient-to-r from-gray-900 to-black relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
           <ArrowLeft size={16} /> নীড়ে ফিরে যান
        </Link>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl">
           <div className="flex flex-col md:flex-row justify-between gap-6">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-serif font-bold text-white">{vendor.store_name}</h1>
                    {vendor.status === 'APPROVED' ? (
                      <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/20">অফিসিয়াল পার্টনার</span>
                    ) : (
                      <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold uppercase border border-red-500/20">রিভিউ চলছে</span>
                    )}
                 </div>
                 <p className="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">{vendor.description}</p>
                 <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span>ID: #{vendor.id.toString().padStart(4, '0')}</span>
                    <span>•</span>
                    <span>Artisan: {vendor.owner_name}</span>
                    {vendor.district && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-aura-purple" /> {vendor.district}{vendor.area ? `, ${vendor.area}` : ''}
                        </span>
                      </>
                    )}
                 </div>
              </div>
              
              <div className="flex items-start">
                 {vendor.website_url && (
                    <a 
                      href={vendor.website_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-aura-purple text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                       Visit Official Website <Globe size={16} />
                    </a>
                 )}
              </div>
           </div>
        </div>

        <h2 className="text-2xl font-serif font-bold mb-8 border-l-4 border-aura-purple pl-4">এক্সক্লুসিভ কালেকশন</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {products.map(product => (
             <ProductCard key={product.id} product={product} vendor={vendor} />
           ))}
        </div>
      </div>
    </div>
  );
};