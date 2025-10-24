
export interface DialogueOption {
  id: string;
  text: string;
  nextNodeId: string | null;
}

export interface DialogueNode {
  id: string;
  nodeType: 'dialogue' | 'coach';
  speaker?: 1 | 2;
  dialogue: string;
  options: DialogueOption[];
  isStartNode: boolean;
  isEndNode: boolean;
  position: { x: number; y: number };
}

export interface Scenario {
  title: string;
  description: string;
  speaker1Name: string;
  speaker2Name: string;
  nodes: DialogueNode[];
  globalContext?: string;
}

export interface AiSuggestion {
  dialogue: string;
  options?: string[];
}
