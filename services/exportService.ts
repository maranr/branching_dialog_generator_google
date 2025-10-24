
import { Scenario } from '../types';

export function exportScenarioToHtml(scenario: Scenario): string {
  const scenarioJson = JSON.stringify(scenario);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scenario.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: sans-serif; background-color: #0f172a; }
    .chat-bubble { max-width: 80%; }
    .speaker-1 { align-self: flex-start; background-color: #0891b2; color: white; }
    .speaker-2 { align-self: flex-end; background-color: #9333ea; color: white; }
    .options-container button { transition: background-color 0.2s; }
  </style>
</head>
<body class="text-white flex flex-col h-screen">
  <header class="bg-slate-900/80 backdrop-blur-sm p-4 shadow-md z-10 sticky top-0">
    <h1 class="text-2xl font-bold text-cyan-400">${scenario.title}</h1>
    <p class="text-sm text-gray-400 mt-1">${scenario.description}</p>
  </header>

  <main id="chat-container" class="flex-1 overflow-y-auto p-4 flex flex-col space-y-4"></main>

  <footer id="options-container" class="p-4 bg-slate-900 border-t border-slate-700"></footer>

  <script>
    const scenarioData = ${scenarioJson};
    
    const chatContainer = document.getElementById('chat-container');
    const optionsContainer = document.getElementById('options-container');

    let currentNode = null;

    function renderNode(nodeId) {
      if (!nodeId) {
        displayEndMessage("--- End of Scenario ---");
        return;
      }
      const node = scenarioData.nodes.find(n => n.id === nodeId);
      if (!node) {
        displayEndMessage("Error: Node not found!");
        return;
      }
      
      currentNode = node;

      if (node.nodeType === 'coach') {
        const coachBox = document.createElement('div');
        coachBox.className = 'my-4 p-4 rounded-lg bg-yellow-900/50 border border-yellow-500 self-center w-full max-w-2xl';
        coachBox.innerHTML = \`<h3 class="font-bold text-yellow-300 text-lg mb-2">💡 Coach's Feedback</h3><p class="text-yellow-100">\${node.dialogue}</p>\`;
        chatContainer.appendChild(coachBox);
      } else {
        const speakerName = node.speaker === 1 ? scenarioData.speaker1Name : scenarioData.speaker2Name;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble p-3 rounded-lg shadow-md speaker-' + node.speaker;
        bubble.innerHTML = \`<div class="font-bold text-sm mb-1">\${speakerName}</div><div>\${node.dialogue}</div>\`;
        chatContainer.appendChild(bubble);
      }
      
      chatContainer.scrollTop = chatContainer.scrollHeight;
      renderOptions(node);
    }

    function renderOptions(node) {
      optionsContainer.innerHTML = '';
      
      if(node.isEndNode) {
        displayEndMessage("--- End of Scenario ---");
        return;
      }

      const optionsWrapper = document.createElement('div');
      optionsWrapper.className = 'flex flex-col md:flex-row md:flex-wrap gap-3 justify-center';

      if (node.nodeType === 'dialogue' && node.speaker === 1) { // Speaker 1 (user) gets response choices
        if(node.options.length === 0) {
            displayEndMessage("--- End of Scenario ---");
            return;
        }
        node.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.className = 'px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-500';
            
            if (!option.nextNodeId) {
            button.disabled = true;
            button.title = "This path is not connected.";
            } else {
            button.onclick = () => handleOptionClick(option.nextNodeId);
            }
            optionsWrapper.appendChild(button);
        });
      } else { // Speaker 2 (bot/other) or Coach node gets a "Continue" button
        const nextNodeId = node.options?.[0]?.nextNodeId;
        if (nextNodeId) {
            const button = document.createElement('button');
            button.textContent = 'Continue';
            button.className = 'px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md';
            button.onclick = () => handleOptionClick(nextNodeId);
            optionsWrapper.appendChild(button);
        } else {
            displayEndMessage("--- End of Scenario ---");
            return;
        }
      }

      optionsContainer.appendChild(optionsWrapper);
    }
    
    function displayEndMessage(message) {
        const endMessage = document.createElement('div');
        endMessage.textContent = message;
        endMessage.className = 'text-center text-gray-400 font-semibold p-4';
        optionsContainer.innerHTML = '';
        optionsContainer.appendChild(endMessage);
    }

    function handleOptionClick(nextNodeId) {
      optionsContainer.innerHTML = '<div class="text-center text-gray-500">...</div>';
      setTimeout(() => renderNode(nextNodeId), 500);
    }

    function startScenario() {
      chatContainer.innerHTML = '';
      const startNode = scenarioData.nodes.find(n => n.isStartNode);
      if (startNode) {
        renderNode(startNode.id);
      } else {
        chatContainer.textContent = 'Error: No start node defined in scenario.';
      }
    }

    document.addEventListener('DOMContentLoaded', startScenario);
  </script>
</body>
</html>
  `;
}
