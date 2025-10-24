# Branching Dialogue Creator - Architecture Overview

This document provides a high-level overview of the technical architecture for the Branching Dialogue Creator application.

## 1. Core Philosophy

The application is designed as a single-page application (SPA) built with React. It aims to provide a highly interactive and visual interface for building complex conversational flows. State is managed centrally and passed down through components, and external services for AI and exporting are modularized.

## 2. Project Structure

The codebase is organized into logical directories to separate concerns:

```
/
|-- public/
|-- components/
|   |-- DialogueEditor.tsx   # The main visual canvas for nodes and connections
|   |-- NodeEditor.tsx       # The side panel for editing a selected node
|   |-- PreviewModal.tsx     # A modal for playing through the scenario
|   `-- ScenarioSetup.tsx    # The side panel for global scenario settings
|-- services/
|   |-- exportService.ts     # Logic to generate a standalone HTML player
|   `-- geminiService.ts     # Handles all communication with the Google Gemini API
|-- App.tsx                  # The main application component, manages state
|-- index.html               # The HTML entry point
|-- index.tsx                # The React entry point
|-- types.ts                 # TypeScript type definitions
`-- metadata.json            # Project metadata
```

## 3. Key Components (`/components`)

-   **`App.tsx`**: The root component. It holds the primary state for the entire application, including the scenario configuration (`scenarioSetup`) and the array of all dialogue nodes (`nodes`). It defines all the callback functions for adding, updating, and deleting nodes and options, passing them down as props to child components.

-   **`DialogueEditor.tsx`**: This is the visual heart of the application. It renders the canvas where nodes are displayed.
    -   **Rendering**: Maps over the `nodes` array to render each `DraggableNode`.
    -   **Interactivity**: Manages pan (Ctrl/Meta + Drag) and zoom (mouse wheel) functionality for the canvas.
    -   **Connections**: Calculates and renders SVG arrows between connected nodes based on `option.nextNodeId`. It also handles the UI logic for creating new links by dragging from an option port to a node's input port.
    -   **Inline Editing**: Contains a reusable `EditableText` component that allows users to edit node and option text directly on the canvas by double-clicking.

-   **`NodeEditor.tsx`**: The side panel form that appears when a node is selected. It receives the `selectedNode` object as a prop and provides UI controls (text areas, dropdowns, checkboxes) to modify its properties. It also contains the UI for triggering AI suggestions via the `geminiService`.

-   **`ScenarioSetup.tsx`**: The top portion of the side panel, responsible for editing global scenario metadata like the title, description, and speaker names. It also houses the buttons for primary actions like Preview, Import, and Export.

-   **`PreviewModal.tsx`**: A self-contained component that simulates the end-user experience. It receives the entire `scenario` object, finds the start node, and allows the user to click through the dialogue options, rendering the conversation history in a chat-like interface.

## 4. Core Services (`/services`)

-   **`geminiService.ts`**: This module abstracts all interaction with the Google Gemini API.
    -   It constructs detailed prompts based on the current scenario, conversation history, and user-provided context.
    -   It defines specific schemas for the JSON output it expects from the model, ensuring reliable parsing of AI-generated content (e.g., a dialogue line and an array of options).
    -   It includes separate, tailored prompt-building functions for generating agent responses vs. customer responses.

-   **`exportService.ts`**: This service is responsible for creating a portable, standalone HTML file of the scenario.
    -   It takes the entire `scenario` object, stringifies it into JSON, and embeds it directly into a JavaScript variable within an HTML template.
    -   The template includes all the necessary HTML, CSS (via Tailwind CDN), and JavaScript logic to function as a simple player, similar to the `PreviewModal`.

## 5. State Management

-   **Centralized State**: The application uses a centralized state model, with the `App.tsx` component acting as the "single source of truth."
-   **React Hooks**: State is managed exclusively through React hooks (`useState`, `useCallback`, `useMemo`, `useRef`). There is no external state management library like Redux or Zustand.
-   **Data Flow**: The flow is unidirectional. State is passed down from `App.tsx` to child components via props. Child components trigger state changes by invoking callback functions passed down from `App.tsx`. This makes the data flow predictable and easier to debug.

## 6. Styling

-   **TailwindCSS**: The UI is styled using TailwindCSS, which is included via a CDN link in `index.html`. This allows for rapid prototyping and development with utility-first classes, keeping the styling co-located with the component markup.
-   **Dynamic Styling**: Component styles change based on application state (e.g., a yellow ring around a selected node, different border colors for different speaker nodes).
