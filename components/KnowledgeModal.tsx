import React, { useState, useRef } from 'react';
import { KnowledgeItem, UploadTab } from '../types';
import { extractKnowledgeFromDoc } from '../services/geminiService';
import Button from './Button';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKnowledge: (items: KnowledgeItem[]) => void;
}

const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose, onAddKnowledge }) => {
  const [activeTab, setActiveTab] = useState<UploadTab>(UploadTab.MANUAL);
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleManualSubmit = () => {
    if (!manualQuestion.trim() || !manualAnswer.trim()) return;
    onAddKnowledge([{ question: manualQuestion, answer: manualAnswer }]);
    setManualQuestion('');
    setManualAnswer('');
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        
        try {
          const extractedItems = await extractKnowledgeFromDoc(base64Data, file.type);
          if (extractedItems.length === 0) {
              setError("未能从文档中提取到有效信息。");
          } else {
              onAddKnowledge(extractedItems);
              onClose();
          }
        } catch (err) {
            setError("AI 解析失败，请检查文件格式或内容。");
        } finally {
            setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("文件读取失败。");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-orange-500 p-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">添加知识库内容</h2>
          <button onClick={onClose} className="text-white hover:text-orange-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === UploadTab.MANUAL ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(UploadTab.MANUAL)}
          >
            手动输入
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === UploadTab.UPLOAD ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(UploadTab.UPLOAD)}
          >
            上传文档 (AI 提取)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {activeTab === UploadTab.MANUAL ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题 (Question)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：如何重启刷卡机？"
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">答案 (Answer)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="输入详细的解决步骤..."
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleManualSubmit} 
                className="w-full"
                disabled={!manualQuestion || !manualAnswer}
              >
                保存到知识库
              </Button>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center justify-center py-8">
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">上传技术文档</h3>
                 <p className="text-sm text-gray-500 max-w-xs mx-auto">
                   支持 PDF, TXT, 或图片格式。AI 将自动分析并提取问答对。
                 </p>
               </div>

               <input
                 type="file"
                 ref={fileInputRef}
                 onChange={handleFileUpload}
                 accept=".txt,.pdf,image/*"
                 className="hidden"
               />

               <Button 
                 onClick={() => fileInputRef.current?.click()} 
                 isLoading={isLoading}
                 className="w-full max-w-xs"
               >
                 {isLoading ? '正在分析文档...' : '选择文件'}
               </Button>
               
               {isLoading && (
                 <p className="text-xs text-gray-400 animate-pulse">
                   Gemini 正在读取并提取知识点，请稍候...
                 </p>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeModal;