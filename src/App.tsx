import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <div dangerouslySetInnerHTML={{
        __html: `
          <!-- Include the content from index_original.html here -->
          <div id="original-app-container"></div>
        `
      }} />
    </div>
  )
}

export default App