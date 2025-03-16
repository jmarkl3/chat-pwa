import React, { useState } from 'react'

function AppHome() {

  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>This is a PWA</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}

export default AppHome