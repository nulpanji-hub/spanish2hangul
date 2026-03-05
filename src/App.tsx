/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Volume2, 
  Loader2, 
  Check,
  Info,
  Settings
} from 'lucide-react';
import { transcribeSpanishToKorean } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SPANISH_COUNTRIES = [
  { code: 'es', name: 'Spain' },
  { code: 'mx', name: 'Mexico' },
  { code: 'co', name: 'Colombia' },
  { code: 'ar', name: 'Argentina' },
  { code: 'pe', name: 'Peru' },
  { code: 've', name: 'Venezuela' },
  { code: 'cl', name: 'Chile' },
  { code: 'ec', name: 'Ecuador' },
  { code: 'gt', name: 'Guatemala' },
  { code: 'cu', name: 'Cuba' },
  { code: 'bo', name: 'Bolivia' },
  { code: 'do', name: 'Dominican Republic' },
  { code: 'hn', name: 'Honduras' },
  { code: 'py', name: 'Paraguay' },
  { code: 'sv', name: 'El Salvador' },
  { code: 'ni', name: 'Nicaragua' },
  { code: 'cr', name: 'Costa Rica' },
  { code: 'pa', name: 'Panama' },
  { code: 'uy', name: 'Uruguay' },
];

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  // Check if API key is needed (for Shared App environment)
  React.useEffect(() => {
    const checkKey = async () => {
      // Safely check for API key in environment
      const hasEnvKey = (typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY));
      
      if (hasEnvKey) {
        setNeedsKey(false);
        return;
      }

      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setNeedsKey(!hasKey);
        } catch (e) {
          console.error("Error checking API key:", e);
          // If we can't check, assume we might need one if we're in AI Studio
          setNeedsKey(true);
        }
      } else {
        // If window.aistudio is not present, we might be in a standard browser
        // We only show the warning if we don't have an env key
        setNeedsKey(!hasEnvKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // After opening, we can't immediately know if they selected one, 
        // but we can try to re-check
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      } catch (e) {
        console.error("Error opening key dialog:", e);
      }
    } else {
      alert("이 환경에서는 API Key 선택 기능을 지원하지 않습니다. .env 파일에 API Key를 설정해 주세요.");
    }
  };

  const handleConvert = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Final check for API key before calling service
      const hasEnvKey = (typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY));
      
      if (!hasEnvKey) {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            setNeedsKey(true);
            throw new Error("API Key가 필요합니다. 상단의 설정(⚙️) 아이콘을 눌러주세요.");
          }
        }
      }

      const result = await transcribeSpanishToKorean(input);
      setOutput(result);
    } catch (err: any) {
      console.error("Conversion error:", err);
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
      
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API key not valid")) {
        setNeedsKey(true);
        setError("API Key가 유효하지 않거나 설정되지 않았습니다. 다시 설정해 주세요.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConvert();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center py-8 px-4 sm:py-16">
      {/* Flags Row (Marquee Animation) */}
      <div className="w-full border-y border-stone-200 bg-white py-3 mb-8 overflow-hidden relative">
        {/* Gradient Masks for smooth edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        
        <div className="animate-marquee flex items-center gap-6 whitespace-nowrap">
          {/* Duplicate the list to create a seamless loop */}
          {[...SPANISH_COUNTRIES, ...SPANISH_COUNTRIES].map((country, index) => (
            <div 
              key={`${country.code}-${index}`} 
              className="flex items-center gap-2 shrink-0 group cursor-default"
            >
              <img 
                src={`https://flagcdn.com/w40/${country.code}.png`}
                alt={country.name}
                className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded-sm shadow-sm border border-stone-100 transition-transform group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <span className="text-[10px] sm:text-xs font-medium text-stone-400 uppercase tracking-tighter group-hover:text-spanish-red transition-colors">
                {country.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 max-w-2xl"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-3 bg-spanish-red/10 rounded-2xl">
            <Languages className="w-8 h-8 text-spanish-red" />
          </div>
          <button 
            onClick={handleOpenKeyDialog}
            className="p-2 text-stone-400 hover:text-spanish-yellow transition-colors"
            title="Configurar API Key"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-3">
          Transcriptor Fonético de Español
        </h1>
        <p className="text-stone-600 text-lg">
          Escribe en español y obtén la pronunciación más natural en coreano.
        </p>
      </motion.header>

      <main className="w-full max-w-3xl space-y-6">
        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-stone-500 font-medium text-sm uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-spanish-yellow"></span>
              Español
            </div>
            <button 
              onClick={handleClear}
              className="text-stone-400 hover:text-red-500 transition-colors px-2 py-1 text-[10px] font-bold tracking-widest uppercase border border-stone-200 rounded-md hover:border-red-200"
              title="Limpiar"
            >
              Limpiar
            </button>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Hola, ¿cómo estás?"
            className="input-field h-40 text-xl leading-relaxed"
            id="spanish-input"
          />
          
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-stone-400 flex items-center gap-1">
              <Info size={14} />
              <span>Presiona Ctrl + Enter para convertir.</span>
            </div>
            <button
              onClick={handleConvert}
              disabled={isLoading || !input.trim() || needsKey}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 min-w-[140px]"
              id="convert-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Convirtiendo...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Convertir Pronunciación</span>
                </>
              )}
            </button>
          </div>

          {needsKey && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center gap-3">
              <p className="text-amber-800 text-sm text-center font-medium">
                공유 모드에서 이 도구를 사용하려면 Gemini API Key를 선택해야 합니다.
              </p>
              <button 
                onClick={handleOpenKeyDialog}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
              >
                API Key 선택하기
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 text-[10px] underline"
              >
                결제 및 요금 관련 정보
              </a>
            </div>
          )}
        </motion.div>

        {/* Output Section */}
        <AnimatePresence mode="wait">
          {(output || error) && (
            <motion.div
              key={output ? 'output' : 'error'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "glass-card p-6 overflow-hidden relative",
                error ? "border-red-200 bg-red-50/50" : "border-spanish-yellow/30 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-stone-500 font-medium text-sm uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-spanish-red"></span>
                  Pronunciación en Coreano
                </div>
                {output && !error && (
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-stone-500 hover:text-spanish-red transition-colors text-sm font-medium"
                    id="copy-button"
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {error ? (
                <p className="text-red-600 font-medium">{error}</p>
              ) : (
                <div className="relative">
                  <p className="text-3xl font-bold text-stone-900 leading-tight break-words">
                    {output}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Examples / Tips */}
        {!output && !isLoading && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
          >
            <div className="p-4 bg-white border border-stone-100 rounded-xl">
              <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                <Volume2 size={16} className="text-spanish-red" />
                Ejemplos Recomendados
              </h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li 
                  className="cursor-pointer hover:text-spanish-red transition-colors"
                  onClick={() => setInput('Muchas gracias')}
                >
                  "Muchas gracias" (무차스 그라시아스)
                </li>
                <li 
                  className="cursor-pointer hover:text-spanish-red transition-colors"
                  onClick={() => setInput('Te amo')}
                >
                  "Te amo" (떼 아모)
                </li>
                <li 
                  className="cursor-pointer hover:text-spanish-red transition-colors"
                  onClick={() => setInput('¿Dónde está el baño?')}
                >
                  "¿Dónde está el baño?" (돈데 에스따 엘 바뇨?)
                </li>
              </ul>
            </div>
            <div className="p-4 bg-white border border-stone-100 rounded-xl">
              <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                <Info size={16} className="text-spanish-yellow" />
                Consejos de Uso
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                El español tiene una pronunciación regular, pero Gemini AI encuentra la mejor transcripción para que suene natural en coreano.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-stone-400 text-sm">
        &copy; {new Date().getFullYear()} Transcriptor Fonético de Español. Todos los derechos reservados.
      </footer>
    </div>
  );
}
