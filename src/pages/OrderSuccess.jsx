import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import AnimatedPage from '../components/AnimatedPage';

export default function OrderSuccess() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AnimatedPage className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-[#0f1711] pt-32 pb-20 px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#141f15] rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-100 dark:border-white/5 text-center relative overflow-hidden">
        
        {/* Decorative blur elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30">
            <i className="pi pi-check text-4xl text-white"></i>
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Order Successful!
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            Thank you for your purchase. We have received your order and notified the farmer. You will receive an update once it's out for delivery!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch w-full mt-4">
            <Link to="/track-order" className="flex-1 flex">
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl border-2 border-transparent font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center"
              >
                Track Order
              </button>
            </Link>
            <Link to="/products" className="flex-1 flex">
              <button 
                className="w-full bg-white dark:bg-[#1a251a] text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 px-6 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center" 
              >
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
