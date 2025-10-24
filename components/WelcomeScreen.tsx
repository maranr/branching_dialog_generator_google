import React from 'react';

interface WelcomeScreenProps {
  onStartBlank: () => void;
  onLoadExample: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartBlank, onLoadExample }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
      <div className="text-center p-12 bg-gray-800/50 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-300 mb-2">Branching Dialogue Creator</h1>
        <p className="text-gray-400 mb-10">Visually create interactive scenarios for training, role-playing, and storytelling.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onStartBlank}
            className="group p-8 bg-gray-700/50 hover:bg-cyan-600/20 border border-gray-600 hover:border-cyan-500 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-5xl mb-4" aria-hidden="true">📄</div>
            <h2 className="text-xl font-semibold text-white mb-2">Start with a Blank Project</h2>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors">Begin from scratch with a single starting node.</p>
          </button>
          
          <button
            onClick={onLoadExample}
            className="group p-8 bg-gray-700/50 hover:bg-purple-600/20 border border-gray-600 hover:border-purple-500 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-5xl mb-4" aria-hidden="true">🚀</div>
            <h2 className="text-xl font-semibold text-white mb-2">Load a Complex Example</h2>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors">Explore a pre-built customer support scenario.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
