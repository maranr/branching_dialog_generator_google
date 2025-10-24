
import React, { useState, useEffect, useRef } from 'react';
import { Scenario, DialogueNode, DialogueOption } from '../types';

interface PreviewModalProps {
  scenario: Scenario;
  onClose: () => void;
}

type ChatMessage = {
  id: string;
  speakerName: string;
  speaker?: 1 | 2;
  nodeType: 'dialogue' | 'coach';
  text: string;
};

const PreviewModal: React.FC<PreviewModalProps> = ({ scenario, onClose }) => {
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const startScenario = () => {
    const startNode = scenario.nodes.find(n => n.isStartNode);
    if (startNode) {
      setCurrentNode(startNode);
      setHistory([{
        id: startNode.id,
        speakerName: startNode.nodeType === 'dialogue' ? (startNode.speaker === 1 ? scenario.speaker1Name : scenario.speaker2Name) : "Coach",
        speaker: startNode.speaker,
        nodeType: startNode.nodeType,
        text: startNode.dialogue
      }]);
    } else {
      setHistory([{ id: 'error', speaker: 1, speakerName: 'System', text: 'Error: No start node defined.', nodeType: 'coach' }]);
    }
  };

  useEffect(() => {
    startScenario();
  }, [scenario.title, scenario.nodes.length]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleAdvance = (nodeId: string) => {
    const nextNode = scenario.nodes.find(n => n.id === nodeId);
    if (nextNode) {
      setCurrentNode(nextNode);
      setHistory(prev => [...prev, {
        id: nextNode.id,
        speaker: nextNode.speaker,
        speakerName: nextNode.nodeType === 'dialogue' ? (nextNode.speaker === 1 ? scenario.speaker1Name : scenario.speaker2Name) : "Coach",
        nodeType: nextNode.nodeType,
        text: nextNode.dialogue,
      }]);
    } else {
      setCurrentNode(null);
      setHistory(prev => [...prev, { id: 'error-2', speaker: 1, speakerName: 'System', text: 'Error: Linked node not found.', nodeType: 'coach' }]);
    }
  };

  const handleOptionClick = (option: DialogueOption) => {
    if (!option.nextNodeId || !currentNode) return;
    handleAdvance(option.nextNodeId);
  };
  
  const handleContinueClick = () => {
    if (currentNode && !currentNode.isEndNode && (currentNode.nodeType === 'coach' || currentNode.speaker === 2)) {
      const nextNodeId = currentNode.options?.[0]?.nextNodeId;
      if (nextNodeId) {
        handleAdvance(nextNodeId);
      }
    }
  };


  const handleRestart = () => {
    setHistory([]);
    setCurrentNode(null);
    setTimeout(startScenario, 50);
  };

  const showEndMessage = currentNode && (currentNode.isEndNode || (currentNode.nodeType === 'dialogue' && currentNode.speaker === 1 && currentNode.options.length === 0) || (currentNode.options.length > 0 && !currentNode.options?.[0]?.nextNodeId));

  const renderFooterContent = () => {
    if (showEndMessage) {
      return <div className="text-center text-gray-400 font-semibold p-2">--- End of Scenario ---</div>;
    }
    
    if (!currentNode) return null;

    if (currentNode.nodeType === 'dialogue' && currentNode.speaker === 1) { // User's turn
        return (
            <div className="flex flex-col md:flex-row md:flex-wrap gap-3 justify-center">
              {currentNode.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt)}
                  disabled={!opt.nextNodeId}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                  title={!opt.nextNodeId ? "This path is not connected" : ""}
                >
                  {opt.text}
                </button>
              ))}
            </div>
        )
    }

    if ((currentNode.nodeType === 'dialogue' && currentNode.speaker === 2) || currentNode.nodeType === 'coach') { // Other speaker's turn or coach
        return (
            <button
                onClick={handleContinueClick}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md"
            >
                Continue
            </button>
        )
    }

    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl h-full max-h-[90vh] flex flex-col">
        <header className="bg-slate-900 p-4 shadow-md z-10 rounded-t-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{scenario.title}</h1>
            <p className="text-xs text-gray-400 mt-1">{scenario.description}</p>
          </div>
          <div>
             <button onClick={handleRestart} className="text-sm px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-md mr-2">Restart</button>
            <button onClick={onClose} className="text-lg font-bold px-3 py-1 hover:bg-red-500 rounded-md">&times;</button>
          </div>
        </header>

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 bg-slate-900">
          {history.map((msg, index) => (
            msg.nodeType === 'coach' ? (
                <div key={`${msg.id}-${index}`} className="my-2 p-4 rounded-lg bg-yellow-900/50 border border-yellow-500 self-center w-full">
                    <h3 className="font-bold text-yellow-300 text-md mb-2">💡 Coach's Feedback</h3>
                    <p className="text-yellow-100 text-sm">{msg.text}</p>
                </div>
            ) : (
                <div key={`${msg.id}-${index}`} className={`flex flex-col ${msg.speaker === 1 ? 'items-start' : 'items-end'}`}>
                <div className={`p-3 rounded-lg shadow-md max-w-[80%] ${msg.speaker === 1 ? 'bg-cyan-600' : 'bg-purple-600'} text-white`}>
                    <div className="font-bold text-sm mb-1">{msg.speakerName}</div>
                    <div>{msg.text}</div>
                </div>
                </div>
            )
          ))}
        </main>
        
        <footer className="p-4 bg-slate-900 border-t border-slate-700 rounded-b-lg min-h-[80px] flex items-center justify-center">
            {renderFooterContent()}
        </footer>
      </div>
    </div>
  );
};

export default PreviewModal;
