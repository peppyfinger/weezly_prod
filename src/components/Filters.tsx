import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category } from '../data/products';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'smart_score';

interface FiltersProps {
  selectedCategory: Category | 'all';
  setSelectedCategory: (c: Category | 'all') => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  selectedBrands: string[];
  setSelectedBrands: (b: string[]) => void;
  availableBrands: string[];
  resultCount: number;
}

export default function Filters({
  selectedCategory, setSelectedCategory, sortBy, setSortBy,
  priceRange, setPriceRange, selectedBrands, setSelectedBrands,
  availableBrands, resultCount
}: FiltersProps) {
  const { state, t } = useApp();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const isDark = state.theme === 'dark';

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200';
  const activeCat = isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-cyan-50 text-cyan-600 border-cyan-200';
  const inactiveCat = isDark ? 'text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200' : 'text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700';
  const inputBg = isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';

  const categories: { value: Category | 'all'; labelKey: string }[] = [
    { value: 'all', labelKey: 'allCategories' },
    { value: 'laptops', labelKey: 'laptops' },
    { value: 'smartphones', labelKey: 'smartphones' },
    { value: 'smarthome', labelKey: 'smarthome' },
    { value: 'tablets', labelKey: 'tablets' },
    { value: 'accessories', labelKey: 'accessories' },
  ];

  const sortOptions: { value: SortOption; labelKey: string }[] = [
    { value: 'default', labelKey: 'sortBySmartScore' },
    { value: 'price_asc', labelKey: 'sortCheapFirst' },
    { value: 'price_desc', labelKey: 'sortExpensiveFirst' },
    { value: 'rating', labelKey: 'sortByRating' },
  ];

  const toggleBrand = (brand: string) => {
    setSelectedBrands(
      selectedBrands.includes(brand)
        ? selectedBrands.filter(b => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const reset = () => {
    setSelectedCategory('all');
    setSortBy('default');
    setPriceRange([0, 2000]);
    setSelectedBrands([]);
  };

  return (
    <div className={`rounded-2xl border backdrop-blur-sm p-4 ${cardBg}`}>
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${selectedCategory === cat.value ? activeCat : inactiveCat}`}
            >
              {t(cat.labelKey as any)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${subText}`}>{t('sortBy')}:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${inputBg}`}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey as any)}</option>
            ))}
          </select>
        </div>

        {/* Expand filters */}
        <button
          onClick={() => setFiltersExpanded(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${isDark ? 'border-slate-600 text-slate-300 hover:border-cyan-500/50' : 'border-slate-200 text-slate-600 hover:border-cyan-400'}`}
        >
          <SlidersHorizontal size={12} />
          {t('filterBy')}
          <ChevronDown size={10} className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Result count */}
        <span className={`text-xs ${subText} ml-auto`}>
          {t('found')} <span className="text-cyan-500 font-medium">{resultCount}</span> {t('products')}
        </span>
      </div>

      {/* Expanded filters */}
      {filtersExpanded && (
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'} grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up`}>
          {/* Price range */}
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subText}`}>{t('priceRange')}</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                placeholder="0"
                className={`w-24 px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${inputBg}`}
              />
              <span className={`text-xs ${subText}`}>—</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                placeholder="2000"
                className={`w-24 px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${inputBg}`}
              />
              <span className={`text-xs ${subText}`}>USD</span>
            </div>
          </div>

          {/* Brands */}
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subText}`}>{t('brands')}</div>
            <div className="flex flex-wrap gap-2">
              {availableBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`px-2 py-1 rounded-lg text-xs border transition-all duration-200 ${
                    selectedBrands.includes(brand)
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : isDark ? 'border-slate-600 text-slate-400 hover:border-slate-400' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={reset}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-500'}`}
            >
              <X size={12} /> {t('resetFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
