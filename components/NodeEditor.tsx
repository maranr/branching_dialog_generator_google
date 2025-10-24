import React, {useState} from 'react';
import { DialogueNode, DialogueOption, Scenario } from '../types';

interface NodeEditorProps {
  node: DialogueNode;
  scenario: Omit<Scenario, 'nodes'>;
  updateNode: (nodeId: string, updates: Partial<DialogueNode>) => void;
  deleteNode: (nodeId:string) => void;
  setStartNode: (nodeId: string) => void;
  addOption: (nodeId: string) => void;
  updateOption: (nodeId: string, optionId: string, updates: Partial<DialogueOption>) => void;
  deleteOption: (nodeId: string, optionId: string) => void;
  onAiSuggest: (context: string) => void;
  isAiLoading: boolean;
}

const NodeEditor: React.FC<NodeEditorProps> = (props) => {
  const { node, scenario, updateNode, deleteNode, setStartNode, addOption, updateOption, deleteOption, onAiSuggest, isAiLoading } = props;
  const isAgentNode = node.nodeType === 'dialogue' && node.speaker === 1;
  const [suggestionContext, setSuggestionContext] = useState('');

  const handleNodeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'dialogue' | 'coach';
    if (newType === node.nodeType) return;

    if (newType === 'coach') {
      updateNode(node.id, {
        nodeType: 'coach',
        speaker: undefined,
        options: [{ id: `opt_${Date.now()}`, text: 'Continue', nextNodeId: null }],
      });
    } else { // newType is 'dialogue'
      updateNode(node.id, {
        nodeType: 'dialogue',
        speaker: 1,
        options: [],
      });
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-yellow-300">Edit Node</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Node Type</label>
        <select
          value={node.nodeType}
          onChange={handleNodeTypeChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="dialogue">Dialogue</option>
          <option value="coach">Coach Feedback</option>
        </select>
      </div>

      {node.nodeType === 'dialogue' && (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Speaker</label>
            <select
            value={node.speaker}
            onChange={(e) => updateNode(node.id, { speaker: parseInt(e.target.value) as 1 | 2 })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
            <option value={1}>{scenario.speaker1Name}</option>
            <option value={2}>{scenario.speaker2Name}</option>
            </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {node.nodeType === 'coach' ? 'Coaching Feedback' : 'Dialogue'}
        </label>
        <textarea
          value={node.dialogue}
          onChange={(e) => updateNode(node.id, { dialogue: e.target.value })}
          rows={4}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {node.nodeType === 'dialogue' ? (
        isAgentNode ? (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-300 mb-2">{scenario.speaker1Name}'s Responses</h4>
            <p className="text-xs text-gray-400 mb-2">Drag the dots on the nodes in the canvas to create links.</p>
            {node.options.map(opt => (
              <div key={opt.id} className="flex items-start space-x-2 mb-2">
                <textarea
                  value={opt.text}
                  onChange={(e) => updateOption(node.id, opt.id, { text: e.target.value })}
                  rows={2}
                  className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm text-white focus:outline-none resize-y"
                />
                <button onClick={() => deleteOption(node.id, opt.id)} className="p-2 mt-1 rounded bg-red-600 hover:bg-red-500" title="Delete option">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => addOption(node.id)} className="text-cyan-400 hover:text-cyan-300 text-sm mt-2">+ Add Response</button>
          </div>
        ) : (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-300 mb-2">Next Step</h4>
            <p className="text-xs text-gray-400 mb-2">Drag the dot on the node in the canvas to link to the next dialogue.</p>
            {node.options.length === 0 && (
              <button onClick={() => addOption(node.id)} className="text-cyan-400 hover:text-cyan-300 text-sm mt-2">+ Add Continue Path</button>
            )}
          </div>
        )
      ) : (
        <div className="mb-4">
           <h4 className="text-md font-semibold text-gray-300 mb-2">Next Step</h4>
           <p className="text-xs text-gray-400 mb-2">Drag the dot on the node in the canvas to link to the next dialogue.</p>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <label className="flex items-center">
          <input type="checkbox" checked={node.isEndNode} onChange={(e) => updateNode(node.id, { isEndNode: e.target.checked })} className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
          <span className="ml-2 text-sm text-gray-300">Is End Node</span>
        </label>
        {!node.isStartNode && (
          <button onClick={() => setStartNode(node.id)} className="text-sm text-yellow-400 hover:text-yellow-300">Set as Start</button>
        )}
      </div>
      
      {node.nodeType === 'dialogue' && (
        <div className="space-y-2 p-3 bg-gray-900/50 rounded-lg">
          <label htmlFor="suggestionContext" className="block text-sm font-medium text-gray-300">Suggestion Context (Optional)</label>
          <textarea
              id="suggestionContext"
              value={suggestionContext}
              onChange={(e) => setSuggestionContext(e.target.value)}
              rows={2}
              placeholder="e.g., Suggest a more empathetic tone."
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button 
              onClick={() => onAiSuggest(suggestionContext)}
              disabled={isAiLoading}
              title={isAgentNode ? "Suggest a new response and choices for the agent based on the conversation." : "Suggest a response for the customer based on the previous dialogue."}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
              {isAiLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : '✨'}
              {isAiLoading ? 'Generating...' : (isAgentNode ? 'Suggest Agent Response' : 'Suggest Customer Response')}
          </button>
        </div>
      )}

      <button onClick={() => deleteNode(node.id)} className="w-full mt-4 text-sm text-red-500 hover:text-red-400">Delete This Node</button>
    </div>
  );
};

export default NodeEditor;
