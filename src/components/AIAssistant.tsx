import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, calculateSmartScore } from '../data/products';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  products?: Product[];
  isAlternative?: boolean;
}

interface AIAssistantProps {
  onFilterProducts: (ids: number[] | null) => void;
}

// Category keyword maps for all 3 languages
const categoryKeywords: Record<string, string[]> = {
  laptops: ['ноутбук', 'ноўтбук', 'laptop', 'ноуты', 'ноуту', 'ноутбуки', 'ноўтбукі', 'laptops', 'макбук', 'macbook', 'thinkpad'],
  smartphones: ['смартфон', 'телефон', 'тэлефон', 'smartphone', 'phone', 'айфон', 'iphone', 'android', 'андроид', 'смартфоны', 'смартфон', 'pixel'],
  smarthome: ['умный дом', 'разумны дом', 'smart home', 'термостат', 'тэрмастат', 'thermostat', 'пылесос', 'пыласос', 'vacuum', 'робот', 'робат', 'колонка', 'калонка', 'speaker'],
  tablets: ['планшет', 'планшэт', 'tablet', 'ipad', 'айпад'],
  accessories: ['наушники', 'навушнікі', 'headphones', 'часы', 'гадзіннік', 'watch', 'аксессуары'],
};

const tagKeywords: Record<string, string[]> = {
  gaming: ['игровой', 'гульнявы', 'gaming', 'игры', 'гульні', 'game', 'геймер', 'геймерский'],
  budget: ['дешевый', 'бюджетный', 'танны', 'бюджэтны', 'cheap', 'budget', 'недорогой', 'недарагі', 'affordable', 'доступный'],
  professional: ['профессиональный', 'прафесійны', 'professional', 'бизнес', 'бізнес', 'business', 'work', 'работа'],
  powerful: ['мощный', 'магутны', 'powerful', 'производительный', 'прадукцыйны', 'fast', 'быстрый', 'хуткі'],
  apple: ['apple', 'эппл', 'mac', 'ios'],
  flagship: ['флагман', 'топовый', 'топавы', 'flagship', 'premium', 'премиум'],
};

function extractBudget(text: string): number | null {
  // Match patterns like "до 500", "за 700", "under 300", "до 2000 BYN", "up to 500 USD", "до 1500$"
  const patterns = [
    /до\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$|р|руб)?/gi,
    /да\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$|р|руб)?/gi, // belarusian
    /за\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$|р|руб)?/gi,
    /up\s*to\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$)?/gi,
    /under\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$)?/gi,
    /less\s*than\s*(\d+(?:[.,]\d+)?)\s*(byn|usd|\$)?/gi,
    /(\d+(?:[.,]\d+)?)\s*(\$|usd)/gi,
    /(\d+(?:[.,]\d+)?)\s*(byn|руб|р\.)/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      let amount = parseFloat(match[1].replace(',', '.'));
      const unit = (match[2] || '').toLowerCase();
      if (unit === 'byn' || unit === 'руб' || unit === 'р' || unit === 'р.') {
        amount = amount / 3.25; // convert BYN to USD
      }
      return amount;
    }
  }
  return null;
}

function extractCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return null;
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(tag);
  }
  return found;
}

function calculateSimilarity(product: Product, category: string | null, budget: number | null, tags: string[]): number {
  let score = 0;
  if (category && product.category === category) score += 50;
  if (budget) {
    if (product.price <= budget) score += 30;
    else {
      const overshoot = (product.price - budget) / budget;
      score += Math.max(0, 30 - overshoot * 60);
    }
  }
  if (tags.length > 0) {
    const productTagStr = product.tags.join(' ').toLowerCase();
    const matches = tags.filter(tag =>
      tagKeywords[tag]?.some(kw => productTagStr.includes(kw))
    );
    score += matches.length * 10;
  }
  score += calculateSmartScore(product) * 0.1;
  return score;
}

const noResultMessages: Record<string, (cat: string | null, budget: number | null) => string> = {
  ru: (cat, budget) => `Мы не нашли ${cat === 'laptops' ? 'ноутбуков' : cat === 'smartphones' ? 'смартфонов' : 'товаров'} ${budget ? `до $${budget.toFixed(0)}` : 'по вашему запросу'}, но вот наиболее подходящие варианты, которые могут вас заинтересовать:`,
  be: (cat, budget) => `Мы не знайшлі ${cat === 'laptops' ? 'ноўтбукаў' : cat === 'smartphones' ? 'смартфонаў' : 'тавараў'} ${budget ? `да $${budget.toFixed(0)}` : 'па вашым запыце'}, але вось найбольш падыходныя варыянты, якія могуць вас зацікавіць:`,
  en: (cat, budget) => `We didn't find ${cat === 'laptops' ? 'laptops' : cat === 'smartphones' ? 'smartphones' : 'products'} ${budget ? `under $${budget.toFixed(0)}` : 'matching your query'}, but here are the closest alternatives that might interest you:`,
};

export default function AIAssistant({ onFilterProducts }: AIAssistantProps) {
  const { state, dispatch, t, formatPrice } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = state.theme === 'dark';

  const panelBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const userBubble = 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white';
  const aiBubble = isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800';
  const productCardBg = isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-50 border-slate-200';

  useEffect(() => {
    if (messages.length === 0 && state.assistantOpen) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        text: t('aiGreeting'),
      }]);
    }
  }, [state.assistantOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processQuery = (query: string) => {
    const category = extractCategory(query);
    const budget = extractBudget(query);
    const tags = extractTags(query);

    let products = state.products;
    if (category) products = products.filter(p => p.category === category);
    if (budget) products = products.filter(p => p.price <= budget);
    if (tags.length > 0) {
      products = products.filter(p =>
        tags.some(tag => tagKeywords[tag]?.some(kw => p.tags.join(' ').toLowerCase().includes(kw)))
      );
    }

    if (products.length > 0) {
      const sorted = products.sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a)).slice(0, 4);
      const responseText = t('aiFound');
      onFilterProducts(sorted.map(p => p.id));
      return { text: responseText, products: sorted, isAlternative: false };
    }

    // Fallback: similarity scoring
    const allScored = state.products.map(p => ({
      product: p,
      score: calculateSimilarity(p, category, budget, tags),
    })).sort((a, b) => b.score - a.score);

    const fallback = allScored.slice(0, 3).map(s => s.product);
    const lang = state.language as 'ru' | 'be' | 'en';
    const fallbackText = noResultMessages[lang](category, budget);
    onFilterProducts(null);
    return { text: fallbackText, products: fallback, isAlternative: true };
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const result = processQuery(input);
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: result.text,
        products: result.products,
        isAlternative: result.isAlternative,
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 600);

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!state.assistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'SET_ASSISTANT_OPEN', payload: false })}
      />
      <div className={`w-full max-w-sm border-l animate-slide-in-right flex flex-col ${panelBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse-glow">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${textColor}`}>{t('aiAssistant')}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className={`text-xs ${subText}`}>{state.language === 'ru' ? 'Онлайн' : state.language === 'be' ? 'Анлайн' : 'Online'}</span>
              </div>
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'SET_ASSISTANT_OPEN', payload: false })} className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                {msg.role === 'assistant' ? <Sparkles size={12} className="text-white" /> : <User size={12} className={isDark ? 'text-slate-300' : 'text-slate-600'} />}
              </div>
              <div className={`max-w-[85%] space-y-2`}>
                <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? userBubble : aiBubble}`}>
                  {msg.text}
                </div>
                {msg.products && msg.products.length > 0 && (
                  <div className="space-y-2">
                    {msg.products.map(product => {
                      const name = state.language === 'ru' ? product.nameRu : state.language === 'be' ? product.nameBe : product.nameEn;
                      return (
                        <div key={product.id} className={`rounded-xl border p-2.5 ${productCardBg}`}>
                          <div className="flex items-center gap-2">
                            <img src={product.image} alt={name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium line-clamp-2 ${textColor}`}>{name}</p>
                              <p className={`text-xs font-bold text-cyan-500 mt-0.5`}>{formatPrice(product.price)}</p>
                            </div>
                          </div>
                          {state.role !== 'guest' && (
                            <button
                              onClick={() => dispatch({ type: 'ADD_TO_CART', payload: { product } })}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                            >
                              <ShoppingCart size={11} />
                              {t('addToCart')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('aiPlaceholder')}
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
