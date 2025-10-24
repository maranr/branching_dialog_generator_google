import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { DialogueNode, DialogueOption } from '../types';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;

// A reusable component for inline editable text
const EditableText: React.FC<{
  value: string;
  onSave: (newValue: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  className?: string;
  isTextArea?: boolean;
}> = ({ value, onSave, isEditing, onStartEdit, onEndEdit, className, isTextArea = false }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      
      if (isTextArea && inputRef.current.tagName.toLowerCase() === 'textarea') {
        const textarea = inputRef.current as HTMLTextAreaElement;
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, isTextArea]);

  const handleSave = () => {
    if (currentValue.trim() !== '') {
      onSave(currentValue);
    } else {
       setCurrentValue(value); // revert if empty
    }
    onEndEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (!isTextArea || (isTextArea && !e.shiftKey))) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      onEndEdit();
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  if (isEditing) {
    return isTextArea ? (
        <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={handleTextareaChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} w-full bg-gray-900 border-none rounded-md focus:ring-2 focus:ring-yellow-400 p-0 m-0 resize-none overflow-hidden`}
            style={{boxShadow: 'none'}}
        />
    ) : (
        <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} w-full bg-gray-900 border-none rounded-md focus:ring-2 focus:ring-yellow-400 p-0 m-0`}
            style={{boxShadow: 'none'}}
        />
    )
  }

  return (
    <div onDoubleClick={onStartEdit} className={`${className} w-full cursor-text whitespace-pre-wrap break-words`}>
      {value}
    </div>
  );
};


interface DraggableNodeProps {
  node: DialogueNode;
  isSelected: boolean;
  isExpanded: boolean;
  editing: { nodeId: string; part: 'dialogue' | 'option'; optionId?: string; } | null;
  onClick: (id: string) => void;
  onDragStop: (id: string, pos: { x: number; y: number }) => void;
  onToggleExpand: (id: string) => void;
  onStartEdit: (nodeId: string, part: 'dialogue' | 'option', optionId?: string) => void;
  onEndEdit: () => void;
  updateNode: (nodeId: string, updates: Partial<DialogueNode>) => void;
  updateOption: (nodeId: string, optionId: string, updates: Partial<DialogueOption>) => void;
  onStartLinkDrag: (nodeId: string, optionId: string, e: React.MouseEvent) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = (props) => {
  const { node, isSelected, isExpanded, editing, onClick, onDragStop, onToggleExpand, onStartEdit, onEndEdit, updateNode, updateOption, onStartLinkDrag } = props;
  const nodeRef = useRef<HTMLDivElement>(null);
  const isEditingThisNode = editing?.nodeId === node.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isEditingThisNode || (e.target as HTMLElement).closest('.cursor-text')) {
       if(!isEditingThisNode) onClick(node.id);
       return;
    }
    
    if (!(e.target as HTMLElement).closest('.node-header')) {
        onClick(node.id);
        return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.position.x;
    const startNodeY = node.position.y;
    let hasMoved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const scale = parseFloat(nodeRef.current?.closest('[data-scale]')?.getAttribute('data-scale') || '1');
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasMoved = true;
        document.body.style.cursor = 'grabbing';
      }

      if (hasMoved) {
        onDragStop(node.id, {
            x: startNodeX + dx,
            y: startNodeY + dy
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      
      if (!hasMoved) {
        onClick(node.id);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [node.id, node.position.x, node.position.y, onClick, onDragStop, isEditingThisNode]);

  const getNodeColor = () => {
    if (node.nodeType === 'coach') return 'border-green-500';
    return node.speaker === 1 ? 'border-cyan-500' : 'border-purple-500';
  }

  const getPortColor = () => {
    if (node.nodeType === 'coach') return 'bg-green-400';
    return node.speaker === 1 ? 'bg-cyan-400' : 'bg-purple-400';
  }
  
  const nodeColor = getNodeColor();
  const selectedColor = isSelected ? 'ring-4 ring-yellow-400' : 'ring-2 ring-gray-700';
  
  return (
    <div
      ref={nodeRef}
      className={`absolute bg-gray-800 rounded-lg shadow-xl border-t-4 ${nodeColor} ${selectedColor} transition-all duration-150 flex flex-col`}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: '250px' }}
      onMouseDown={handleMouseDown}
      data-node-id-wrapper={node.id}
    >
      <div 
        className="node-header p-2 flex justify-between items-center cursor-grab bg-gray-700/50 rounded-t-md"
      >
        <div className="font-bold text-xs uppercase text-gray-400">
            {node.nodeType === 'coach' && '💡 ' }
            {node.isStartNode && 'START '}{node.isEndNode && 'END'}
        </div>
        <button onClick={() => onToggleExpand(node.id)} className="p-1 rounded-full hover:bg-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      
      <div className={`p-3`}>
        <EditableText
            value={node.dialogue}
            onSave={(newValue) => updateNode(node.id, { dialogue: newValue })}
            isEditing={isEditingThisNode && editing?.part === 'dialogue'}
            onStartEdit={() => onStartEdit(node.id, 'dialogue')}
            onEndEdit={onEndEdit}
            className={`text-sm text-gray-200 ${!isExpanded ? 'truncate' : 'whitespace-pre-wrap'}`}
            isTextArea
        />
      </div>
      
      {isExpanded && node.options.length > 0 && <div className="border-t border-gray-700" />}

      {isExpanded && (
        <div className="text-sm">
            {node.nodeType === 'dialogue' && node.speaker === 1 &&
                 node.options.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center p-2 border-b border-gray-700/50 last:border-b-0">
                        <EditableText
                          value={opt.text}
                          onSave={(newValue) => updateOption(node.id, opt.id, { text: newValue })}
                          isEditing={isEditingThisNode && editing?.part === 'option' && editing?.optionId === opt.id}
                          onStartEdit={() => onStartEdit(node.id, 'option', opt.id)}
                          onEndEdit={onEndEdit}
                          className="text-gray-300 flex-1 pr-2"
                          isTextArea
                        />
                        <div onMouseDown={(e) => onStartLinkDrag(node.id, opt.id, e)} className={`w-4 h-4 rounded-full ${getPortColor()} ring-2 ring-gray-900 cursor-pointer`} data-port-id={`${node.id}-${opt.id}`} />
                    </div>
                ))
            }
            {(node.nodeType === 'dialogue' && node.speaker === 2 && node.options.length > 0 || node.nodeType === 'coach') &&
                <div className="flex justify-between items-center p-2">
                    <span className="text-gray-400 italic">Continue...</span>
                    <div onMouseDown={(e) => onStartLinkDrag(node.id, node.options[0].id, e)} className={`w-4 h-4 rounded-full ${getPortColor()} ring-2 ring-gray-900 cursor-pointer`} data-port-id={`${node.id}-${node.options[0].id}`} />
                </div>
            }
        </div>
      )}
      <div className="absolute top-1/2 -left-[8px] w-4 h-4 rounded-full bg-gray-400 ring-2 ring-gray-900 -translate-y-1/2 cursor-crosshair" data-port-id={`${node.id}-input`}/>
    </div>
  );
};

const SvgArrow: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number } }> = ({ from, to }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const pathData = `M ${from.x},${from.y} C ${from.x + dx * 0.5},${from.y} ${from.x + dx * 0.5},${to.y} ${to.x},${to.y}`;
  return <path d={pathData} stroke="#60a5fa" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />;
};

interface DialogueEditorProps {
  nodes: DialogueNode[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDragStop: (nodeId: string, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<DialogueNode>) => void;
  updateOption: (nodeId: string, optionId: string, updates: Partial<DialogueOption>) => void;
  onPreview: () => void;
  onAddNode: () => void;
  onAddCoachNode: () => void;
}

const DialogueEditor: React.FC<DialogueEditorProps> = ({ nodes, selectedNodeId, onNodeClick, onNodeDragStop, updateNode, updateOption, onPreview, onAddNode, onAddCoachNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTransform, setViewTransform] = useState({ x: 50, y: 50, scale: 1 });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [arrows, setArrows] = useState<Array<{ from: {x:number, y:number}, to: {x:number, y:number}, key: string }>>([]);
  const [editing, setEditing] = useState<{ nodeId: string; part: 'dialogue' | 'option'; optionId?: string; } | null>(null);
  const isPanning = useRef(false);
  const [linkDrag, setLinkDrag] = useState<{ fromPortId: string, fromNodeId: string, fromOptionId: string, to: {x: number, y: number} } | null>(null);
  const portPositionsRef = useRef<Record<string, {x:number, y:number}>>({});

  const onToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);

  const handleStartEdit = useCallback((nodeId: string, part: 'dialogue' | 'option', optionId?: string) => {
    setEditing({ nodeId, part, optionId });
  }, []);

  const handleEndEdit = useCallback(() => setEditing(null), []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const newArrows: typeof arrows = [];
    const newPortPositions: typeof portPositionsRef.current = {};
    const containerRect = containerRef.current.getBoundingClientRect();
    
    document.querySelectorAll('[data-port-id]').forEach(portEl => {
        const portId = portEl.getAttribute('data-port-id')!;
        const portRect = portEl.getBoundingClientRect();
        newPortPositions[portId] = {
            x: (portRect.left + portRect.width / 2) - containerRect.left,
            y: (portRect.top + portRect.height / 2) - containerRect.top
        };
    });
    portPositionsRef.current = newPortPositions;

    nodes.forEach(node => {
        node.options.forEach(opt => {
            if (!opt.nextNodeId) return;
            const fromPortId = `${node.id}-${opt.id}`;
            const toPortId = `${opt.nextNodeId}-input`;
            const from = portPositionsRef.current[fromPortId];
            const to = portPositionsRef.current[toPortId];
            if(from && to) {
                 newArrows.push({ from, to, key: `${node.id}-${opt.id}` });
            }
        });
    });
    setArrows(newArrows);
  }, [nodes, viewTransform, expandedNodes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const zoomIntensity = 0.1;
    const scale = viewTransform.scale + direction * zoomIntensity;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - viewTransform.x) * (newScale / viewTransform.scale);
    const newY = mouseY - (mouseY - viewTransform.y) * (newScale / viewTransform.scale);
    
    setViewTransform({ x: newX, y: newY, scale: newScale });
  }, [viewTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (editing) return;
    if (e.button === 1 || (e.button === 0 && e.metaKey) || (e.button === 0 && e.ctrlKey)) {
        isPanning.current = true;
        document.body.style.cursor = 'grabbing';
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startViewX = viewTransform.x;
        const startViewY = viewTransform.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            setViewTransform(prev => ({ ...prev, x: startViewX + dx, y: startViewY + dy }));
        };

        const handleMouseUp = () => {
            isPanning.current = false;
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
  }, [viewTransform, editing]);

  const handleStartLinkDrag = useCallback((fromNodeId: string, fromOptionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const fromPortId = `${fromNodeId}-${fromOptionId}`;
      const rect = containerRef.current!.getBoundingClientRect();
      const initialTo = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      setLinkDrag({ fromPortId, fromNodeId, fromOptionId, to: initialTo});

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setLinkDrag(prev => prev ? {...prev, to: { x: moveEvent.clientX - rect.left, y: moveEvent.clientY - rect.top }} : null);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const targetEl = (upEvent.target as HTMLElement).closest('[data-port-id$="-input"]');
        let targetNodeId: string | null = null;
        if (targetEl) {
            const portId = targetEl.getAttribute('data-port-id')!;
            targetNodeId = portId.replace('-input', '');
            if (targetNodeId === fromNodeId) targetNodeId = null; // prevent self-linking
        }
        
        updateOption(fromNodeId, fromOptionId, { nextNodeId: targetNodeId });
        setLinkDrag(null);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  }, [updateOption]);
  
  const resetView = () => setViewTransform({ x: 50, y: 50, scale: 1 });

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-gray-900 bg-dotted-pattern" onWheel={handleWheel} onMouseDown={handleMouseDown}>
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <button
                onClick={onAddNode}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
            >
                + Add Dialogue
            </button>
            <button
                onClick={onAddCoachNode}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
            >
                + Add Coach
            </button>
            <button
                onClick={onPreview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
            >
                Preview
            </button>
        </div>
        <div
            data-scale={viewTransform.scale}
            style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }}
        >
            {nodes.map(node => (
                <DraggableNode 
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedNodeId}
                  isExpanded={!!expandedNodes[node.id]}
                  editing={editing}
                  onClick={onNodeClick}
                  onDragStop={onNodeDragStop}
                  onToggleExpand={onToggleExpand}
                  onStartEdit={handleStartEdit}
                  onEndEdit={handleEndEdit}
                  updateNode={updateNode}
                  updateOption={updateOption}
                  onStartLinkDrag={handleStartLinkDrag}
                />
            ))}
        </div>
        <svg className="absolute w-full h-full top-0 left-0" style={{ pointerEvents: 'none' }}>
            <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
            </marker>
            </defs>
            <g>
                {arrows.map(arrow => <SvgArrow key={arrow.key} from={arrow.from} to={arrow.to} />)}
                 {linkDrag && portPositionsRef.current[linkDrag.fromPortId] && (
                    <SvgArrow from={portPositionsRef.current[linkDrag.fromPortId]} to={linkDrag.to} />
                )}
            </g>
        </svg>

      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 bg-gray-800 p-2 rounded-lg shadow-lg">
        <button onClick={() => handleWheel({ deltaY: -1, preventDefault: () => {} } as any)} className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-lg font-bold">+</button>
        <button onClick={resetView} className="h-8 px-3 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-xs">Reset</button>
        <button onClick={() => handleWheel({ deltaY: 1, preventDefault: () => {} } as any)} className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-lg font-bold">-</button>
      </div>
       <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-500 bg-gray-800 p-2 rounded-lg shadow-lg">
         Pan: CTRL/META + Drag | Zoom: Scroll | Edit Text: Double-Click
      </div>
    </div>
  );
};

export default DialogueEditor;
