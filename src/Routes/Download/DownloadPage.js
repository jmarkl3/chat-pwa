import React, { useEffect, useState } from 'react';

const DownloadPage = () => {
  // What is the purpose of this?
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // What is the purpose of this?
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the deferredPrompt variable
        setDeferredPrompt(null);
        // Hide the install button
        setShowInstallButton(false);
      });
    }
  };

  return (
    <div>
      <h1>Download the App</h1>
      <p>Click the button below to install the app.</p>
        <button onClick={handleInstallClick}>Install App</button>
    </div>
  );
};

export default DownloadPage;