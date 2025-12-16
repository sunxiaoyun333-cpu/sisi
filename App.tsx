import React, { useState, useEffect, useRef } from 'react';
import { Message, KnowledgeItem } from './types';
import ChatMessage from './components/ChatMessage';
import Button from './components/Button';
import KnowledgeModal from './components/KnowledgeModal';
import { sendMessageToGemini } from './services/geminiService';
import { INITIAL_KNOWLEDGE_BASE } from './constants';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '你好！我是 Yammii POS 技术助手。关于 POS 系统、刷卡机或后台设置，有什么可以帮您的？' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extraKnowledge, setExtraKnowledge] = useState<KnowledgeItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    
    // Optimistic UI update
    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessageToGemini(newMessages, extraKnowledge);
      setMessages(prev => [...prev, { role: 'model', text: aiResponseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，发生错误，请重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKnowledge = (items: KnowledgeItem[]) => {
    setExtraKnowledge(prev => [...prev, ...items]);
  };

  // Calculate base items count (approximate lines / 2 or just hardcode the count from prompt)
  // The provided string has numbering up to 31, but the prompt mentioned 109 items originally. 
  // Based on the provided string in constants.ts, we can just say "Base Items".
  // For visual stats, we will count the list items in the constant string roughly.
  const baseCount = INITIAL_KNOWLEDGE_BASE.split('\n').filter(line => line.trim().match(/^\d+\./)).length;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 bg-orange-50">
          <h1 className="text-2xl font-bold text-orange-600 tracking-tight">Yammii AI</h1>
          <p className="text-xs text-orange-400 font-medium mt-1">POS Technical Support</p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">知识库状态</h3>
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <span className="block text-2xl font-bold text-orange-600">{baseCount}</span>
                <span className="text-xs text-orange-400">系统预设条目</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="block text-2xl font-bold text-blue-600">{extraKnowledge.length}</span>
                <span className="text-xs text-blue-400">新增知识条目</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">功能</h3>
             <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={() => setIsModalOpen(true)}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               添加知识
             </Button>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          &copy; 2024 Yammii POS Support
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-20">
           <div>
            <h1 className="text-lg font-bold text-orange-600">Yammii AI</h1>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="text-gray-500 hover:text-orange-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-gray-50 scrollbar-hide">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full mb-4">
               <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-2 border border-orange-200">
                <span className="text-xs font-bold text-orange-600">AI</span>
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Sticky Bottom */}
        <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0 z-20">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="请输入您的问题... (例如: 刷卡机掉线怎么办?)"
                className="w-full p-4 pr-12 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none text-gray-700"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="h-14 w-14 rounded-xl flex-shrink-0 !p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      </div>

      {/* Modal */}
      <KnowledgeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddKnowledge={handleAddKnowledge}
      />
    </div>
  );
}

export default App;