import React, { useRef } from 'react';
import { Scenario } from '../types';

interface ScenarioSetupProps {
  scenario: Omit<Scenario, 'nodes'>;
  setScenario: React.Dispatch<React.SetStateAction<Omit<Scenario, 'nodes'>>>;
  onExportHtml: () => void;
  onPreview: () => void;
  onExportJson: () => void;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNewProject: () => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string }> = ({ label, value, onChange, name }) => (
    <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
    </div>
);

const ScenarioSetup: React.FC<ScenarioSetupProps> = ({ scenario, setScenario, onExportHtml, onPreview, onExportJson, onImportJson, onNewProject }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenario(prev => ({ ...prev, [name]: value }));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-cyan-300">Scenario Setup</h2>
        <button
          onClick={onNewProject}
          className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 text-white font-bold rounded-md shadow-sm transition-colors"
          title="Start a new project"
        >
          New Project
        </button>
      </div>
      <InputField label="Title" name="title" value={scenario.title} onChange={handleChange} />
       <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
            id="description"
            name="description"
            value={scenario.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
       <div className="mb-4">
        <label htmlFor="globalContext" className="block text-sm font-medium text-gray-300 mb-1">Global AI Context</label>
        <textarea
            id="globalContext"
            name="globalContext"
            value={scenario.globalContext || ''}
            onChange={handleChange}
            rows={2}
            placeholder="e.g., The customer is angry. The agent must be patient."
            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <InputField label="Speaker 1 Name" name="speaker1Name" value={scenario.speaker1Name} onChange={handleChange} />
      <InputField label="Speaker 2 Name" name="speaker2Name" value={scenario.speaker2Name} onChange={handleChange} />
      <div className="flex space-x-2 mt-2">
        <button
          onClick={onPreview}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onExportHtml}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-md transition-colors"
        >
          Export HTML
        </button>
      </div>
      <div className="flex space-x-2 mt-2">
        <button
          onClick={handleImportClick}
          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-md transition-colors"
        >
          Import JSON
        </button>
        <button
          onClick={onExportJson}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg shadow-md transition-colors"
        >
          Export JSON
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJson}
          accept=".json,application/json"
          className="hidden"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default ScenarioSetup;
