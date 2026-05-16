import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Sparkles, Bot, User, Loader2, Cpu, Download, Image as ImageIcon, Trash2, ArrowUp } from 'lucide-react';
import { generateAuraImage, generateAuraResponse, resetAuraChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useLocation } from '../lib/router';

interface ChatAssistantProps {
  embedded?: boolean;
  className?: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ embedded = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (embedded) {
      return [{
        role: 'ai',
        content: 'আসসালামু আলাইকুম! আমি Aura AI। আমি আপনার জন্য তথ্য দিতে পারি অথবা আপনার কল্পনা অনুযায়ী চমৎকার ছবি তৈরি করে দিতে পারি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        timestamp: Date.now()
      }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { path } = useLocation();

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: 'আসসালামু আলাইকুম! আমি Aura AI। আমি আপনার জন্য তথ্য দিতে পারি অথবা আপনার কল্পনা অনুযায়ী চমৎকার ছবি তৈরি করে দিতে পারি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        timestamp: Date.now()
      }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isGeneratingImage]);

  const handleClearChat = () => {
    setMessages([{
        role: 'ai',
        content: 'চ্যাট ইতিহাস মুছে ফেলা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        timestamp: Date.now()
    }]);
    // Reset the chat session to clear backend context/history
    resetAuraChat();
  };

  const isImageRequest = (text: string) => {
    const keywords = ['image', 'picture', 'photo', 'drawing', 'ছবি', 'পিকচার', 'আঁকো', 'তৈরি করো', 'create', 'generate'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || isGeneratingImage) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Check for image generation intent
      if (isImageRequest(currentInput)) {
        setIsGeneratingImage(true);
        const imageUrl = await generateAuraImage(currentInput);
        
        if (imageUrl) {
          const aiImgMsg: ChatMessage = {
            role: 'ai',
            content: `আপনার অনুরোধ অনুযায়ী আমি এই ছবিটি তৈরি করেছি: "${currentInput}"`,
            generatedImageUrl: imageUrl,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiImgMsg]);
          setIsGeneratingImage(false);
          setIsTyping(false);
          return;
        }
      }

      // Use the resilient generateAuraResponse function
      const responseText = await generateAuraResponse(currentInput);
      
      const aiMsg: ChatMessage = {
        role: 'ai',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'একটি টেকনিক্যাল সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
      setIsGeneratingImage(false);
    }
  };

  // Logic to hide the floating button on the Home page where the embedded chat exists
  const isFloatingHidden = !embedded && path === '/';
  
  const wrapperClass = embedded 
    ? `relative w-full max-w-2xl mx-auto z-20 font-sans my-10 ${className}` 
    : `fixed bottom-8 left-8 z-[150] font-sans ${isFloatingHidden ? 'hidden' : ''}`;

  const windowClass = embedded
    ? "w-full h-[380px] bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] shadow-[0_0_80px_rgba(124,58,237,0.15)] backdrop-blur-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-700"
    : "absolute bottom-20 left-0 w-[400px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-10rem)] bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500";

  return (
    <div className={wrapperClass}>
      {/* Floating Toggle Button (Only if not embedded) */}
      {!embedded && (
        <div className="flex flex-col items-center gap-2">
          {!isOpen && (
            <span className="bg-aura-purple text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest animate-bounce shadow-lg">
              AURA
            </span>
          )}
          <button
            onClick={handleToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group relative overflow-hidden ${
              isOpen ? 'bg-white text-black rotate-90 scale-90' : 'bg-aura-purple text-white hover:scale-110 active:scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            {!isOpen && (
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {(isOpen || embedded) && (
        <div className={windowClass}>
          {/* Header */}
          <header className="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-aura-purple/5 blur-[40px] pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 bg-aura-purple/20 rounded-xl flex items-center justify-center border border-aura-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                <Cpu className="text-aura-purple animate-pulse" size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold text-xs tracking-widest flex items-center gap-2">
                  AURA INTELLIGENCE <Sparkles size={10} className="text-aura-purple" />
                </h3>
                <p className="text-[8px] uppercase tracking-[0.2em] font-black flex items-center gap-2 mt-0.5">
                    {isTyping ? (
                        <span className="text-aura-purple animate-pulse">Thinking...</span>
                    ) : (
                        <span className="text-green-400 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400"></span> Online</span>
                    )}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="relative z-10">
                <button 
                    onClick={handleClearChat}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all group"
                    title="Clear Chat History"
                >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${
                    msg.role === 'user' ? 'bg-white/10 border-white/10' : 'bg-aura-purple/20 border-aura-purple/30'
                  }`}>
                    {msg.role === 'user' ? <User size={12} className="text-gray-400" /> : <Bot size={12} className="text-aura-purple" />}
                  </div>
                  <div className="space-y-1">
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-white text-black font-medium rounded-tr-none' 
                      : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.generatedImageUrl && (
                      <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 animate-in zoom-in duration-700 mt-2">
                        <img src={msg.generatedImageUrl} className="w-full h-auto object-cover" alt="AI Generated" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <a 
                             href={msg.generatedImageUrl} 
                             download="aura-ai-art.png"
                             className="p-2.5 bg-white text-black rounded-xl hover:bg-aura-purple hover:text-white transition-all shadow-2xl"
                           >
                             <Download size={14} />
                           </a>
                        </div>
                      </div>
                    )}
                    <span className={`text-[8px] text-gray-600 block ${msg.role === 'user' ? 'text-right' : 'text-left'} px-1`}>
                        {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI Typing Indicator Bubble */}
            {(isTyping || isGeneratingImage) && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex gap-2.5 max-w-[90%]">
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border bg-aura-purple/20 border-aura-purple/30">
                        <Bot size={12} className="text-aura-purple" />
                    </div>
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                        {isGeneratingImage ? (
                            <>
                                <ImageIcon size={12} className="text-aura-purple animate-bounce" />
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Rendering...</span>
                            </>
                        ) : (
                            <div className="flex gap-1 h-2 items-center">
                                <div className="w-1 h-1 bg-aura-purple rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1 h-1 bg-aura-purple rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1 h-1 bg-aura-purple rounded-full animate-bounce"></div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5 relative">
            <div className="relative flex items-center group/input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aura or generate art..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-[11px] text-white focus:outline-none focus:border-aura-purple/50 transition-all placeholder:text-gray-600 font-medium tracking-wide shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || isGeneratingImage}
                className={`absolute right-2 w-8 h-8 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  !input.trim() || isTyping || isGeneratingImage 
                    ? 'text-gray-600 bg-transparent' 
                    : 'bg-aura-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 active:scale-95'
                }`}
              >
                {isTyping || isGeneratingImage ? (
                    <Loader2 size={14} className="animate-spin" /> 
                ) : (
                    <ArrowUp size={16} strokeWidth={3} />
                )} 
              </button>
            </div>
            <p className="text-[7px] text-center text-gray-700 uppercase tracking-widest font-black mt-3 opacity-50">
              Aura Vision Module v2.5 Active
            </p>
          </form>
        </div>
      )}
    </div>
  );
};
