import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DialogueNode, DialogueOption, Scenario } from './types';
import ScenarioSetup from './components/ScenarioSetup';
import DialogueEditor from './components/DialogueEditor';
import NodeEditor from './components/NodeEditor';
import PreviewModal from './components/PreviewModal';
import WelcomeScreen from './components/WelcomeScreen';
import { exportScenarioToHtml } from './services/exportService';
import { suggestAgentResponse, suggestCustomerResponse } from './services/geminiService';
import { AiSuggestion } from './types';
import { BLANK_SCENARIO, COMPLEX_EXAMPLE_SCENARIO } from './templates';

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 700;

const App: React.FC = () => {
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [scenarioSetup, setScenarioSetup] = useState<Omit<Scenario, 'nodes'>>({
    title: '',
    description: '',
    speaker1Name: '',
    speaker2Name: '',
    globalContext: '',
  });
  const [nodes, setNodes] = useState<DialogueNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [panelWidth, setPanelWidth] = useState(380);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const lastPanelWidth = useRef(380);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const handleStartBlank = useCallback(() => {
    const { nodes: newNodes, ...setup } = BLANK_SCENARIO;
    setScenarioSetup(setup);
    setNodes(newNodes);
    setSelectedNodeId(null);
    setIsProjectStarted(true);
  }, []);

  const handleLoadExample = useCallback(() => {
    const { nodes: newNodes, ...setup } = COMPLEX_EXAMPLE_SCENARIO;
    setScenarioSetup(setup);
    setNodes(newNodes);
    setSelectedNodeId(null);
    setIsProjectStarted(true);
  }, []);
  
  const handleNewProject = useCallback(() => {
      if (window.confirm("Are you sure you want to start a new project? Any unsaved changes will be lost.")) {
          setIsProjectStarted(false);
          setNodes([]);
          setScenarioSetup({ title: '', description: '', speaker1Name: '', speaker2Name: '', globalContext: '' });
      }
  }, []);

  const addNode = useCallback(() => {
    const newNode: DialogueNode = {
      id: `node_${Date.now()}`,
      nodeType: 'dialogue',
      speaker: 1,
      dialogue: 'New dialogue...',
      options: [],
      isStartNode: false,
      isEndNode: false,
      position: { x: 200, y: 200 },
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  }, []);

  const addCoachNode = useCallback(() => {
    const newNode: DialogueNode = {
      id: `coach_${Date.now()}`,
      nodeType: 'coach',
      dialogue: 'Enter coaching feedback here...',
      options: [{ id: `opt_${Date.now()}`, text: 'Continue', nextNodeId: null }],
      isStartNode: false,
      isEndNode: false,
      position: { x: 200, y: 300 },
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  }, []);


  const updateNode = useCallback((nodeId: string, updates: Partial<DialogueNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => {
      // Also remove any links pointing to this node
      return prev.filter(n => n.id !== nodeId).map(n => ({
        ...n,
        options: n.options.map(opt => opt.nextNodeId === nodeId ? { ...opt, nextNodeId: null } : opt)
      }));
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const setStartNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => ({ ...n, isStartNode: n.id === nodeId })));
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeDragStop = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
  }, [updateNode]);

  const addOption = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.nodeType === 'coach') return;

    // Speaker 2 can only have one "continue" option
    if (node.speaker === 2 && node.options.length > 0) return;

    const newOption: DialogueOption = {
      id: `opt_${Date.now()}`,
      text: node.speaker === 1 ? 'New Response...' : 'Continue',
      nextNodeId: null,
    };
    updateNode(nodeId, { options: [...node.options, newOption] });
  }, [nodes, updateNode]);

  const updateOption = useCallback((nodeId: string, optionId: string, updates: Partial<DialogueOption>) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          options: n.options.map(opt => opt.id === optionId ? { ...opt, ...updates } : opt)
        };
      }
      return n;
    }));
  }, []);

  const deleteOption = useCallback((nodeId: string, optionId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, options: n.options.filter(opt => opt.id !== optionId) };
      }
      return n;
    }));
  }, []);
  
  const handleExportHtml = () => {
    const fullScenario: Scenario = { ...scenarioSetup, nodes };
    const htmlContent = exportScenarioToHtml(fullScenario);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${scenarioSetup.title.replace(/\s+/g, '_')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportJson = () => {
    const fullScenario: Scenario = { ...scenarioSetup, nodes };
    const jsonContent = JSON.stringify(fullScenario, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${scenarioSetup.title.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File content is not text.");
              
              const importedScenario = JSON.parse(text) as Scenario;

              // Basic validation
              if (
                  !importedScenario.title ||
                  typeof importedScenario.description === 'undefined' ||
                  !importedScenario.speaker1Name ||
                  !importedScenario.speaker2Name ||
                  !Array.isArray(importedScenario.nodes)
              ) {
                  throw new Error("Invalid or incomplete scenario file format.");
              }
              
              const { nodes: importedNodes, ...restOfScenario } = importedScenario;
              setScenarioSetup(restOfScenario);
              setNodes(importedNodes);
              setSelectedNodeId(null); // Deselect any node

          } catch (error) {
              console.error("Failed to import scenario:", error);
              alert(`Failed to import scenario: ${error instanceof Error ? error.message : "Unknown error"}`);
          } finally {
              // Reset file input value to allow re-uploading the same file
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const handleAiSuggest = useCallback(async (specificContext: string) => {
    if (!selectedNodeId || !selectedNode || selectedNode.nodeType === 'coach') return;
    
    const fullScenario: Scenario = { ...scenarioSetup, nodes };
    setIsAiLoading(true);

    try {
        if (selectedNode.speaker === 1) { // Agent
            const suggestion: AiSuggestion = await suggestAgentResponse(fullScenario, selectedNodeId, specificContext);
            const newOptions: DialogueOption[] = (suggestion.options ?? []).map((optText, i) => ({
                id: `opt_${Date.now()}_${i}`,
                text: optText,
                nextNodeId: null
            }));
            updateNode(selectedNodeId, { dialogue: suggestion.dialogue, options: newOptions });

        } else { // Customer
            const suggestion: AiSuggestion = await suggestCustomerResponse(fullScenario, selectedNodeId, specificContext);
            updateNode(selectedNodeId, { dialogue: suggestion.dialogue });
        }
    } catch (error) {
      console.error("AI suggestion failed:", error);
      alert(`Failed to get AI suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  }, [selectedNodeId, selectedNode, scenarioSetup, nodes, updateNode]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = moveEvent.clientX;
        const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, MAX_PANEL_WIDTH));
        setPanelWidth(clampedWidth);
        lastPanelWidth.current = clampedWidth;
        if (isPanelCollapsed) {
            setIsPanelCollapsed(false);
        }
    };

    const handleMouseUp = () => {
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isPanelCollapsed]);

  const togglePanel = useCallback(() => {
    setIsPanelCollapsed(prevCollapsed => {
        if (!prevCollapsed) { // about to collapse
            lastPanelWidth.current = panelWidth;
        }
        return !prevCollapsed;
    });
  }, [panelWidth]);

  if (!isProjectStarted) {
    return <WelcomeScreen onStartBlank={handleStartBlank} onLoadExample={handleLoadExample} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <aside 
        className="h-full flex-shrink-0 bg-gray-800/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: isPanelCollapsed ? '0px' : `${panelWidth}px` }}
      >
        <div className="flex-1 p-4 overflow-y-auto" style={{minWidth: `${MIN_PANEL_WIDTH}px`}}>
            <ScenarioSetup
            scenario={scenarioSetup}
            setScenario={setScenarioSetup}
            onExportHtml={handleExportHtml}
            onPreview={() => setIsPreviewing(true)}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onNewProject={handleNewProject}
            />
            <div className="mb-4 space-y-2">
                <button
                    onClick={addNode}
                    className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                    + Add Dialogue Node
                </button>
                <button
                    onClick={addCoachNode}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                    + Add Coach Node
                </button>
            </div>
            {selectedNode ? (
            <NodeEditor
                key={selectedNode.id}
                node={selectedNode}
                scenario={scenarioSetup}
                updateNode={updateNode}
                deleteNode={deleteNode}
                setStartNode={setStartNode}
                addOption={addOption}
                updateOption={updateOption}
                deleteOption={deleteOption}
                onAiSuggest={handleAiSuggest}
                isAiLoading={isAiLoading}
            />
            ) : (
            <div className="mt-4 p-4 text-center text-gray-400 bg-gray-800 rounded-lg border border-dashed border-gray-700">
                Select a node to edit its properties, or add a new node.
            </div>
            )}
        </div>
      </aside>
      
      <div 
        onMouseDown={handleMouseDown} 
        className="w-1.5 cursor-col-resize bg-gray-700/50 hover:bg-cyan-600 transition-colors duration-200 relative group flex-shrink-0"
        title="Resize panel"
      >
        <button 
          onClick={togglePanel} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-6 h-10 bg-gray-600 hover:bg-cyan-500 rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
          title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <main className="flex-1 min-w-0">
        <DialogueEditor
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          updateNode={updateNode}
          updateOption={updateOption}
          onPreview={() => setIsPreviewing(true)}
          onAddNode={addNode}
          onAddCoachNode={addCoachNode}
        />
      </main>
      {isPreviewing && (
        <PreviewModal 
            scenario={{...scenarioSetup, nodes}} 
            onClose={() => setIsPreviewing(false)} 
        />
      )}
    </div>
  );
};

export default App;
