import React, { useState } from 'react';
import { CheckIcon, ClipboardCopyIcon } from '@radix-ui/react-icons'; // Radix UI icons

const CopyToClipboard = ({ text, hide }: { text: string , hide?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {!hide && <span>{text}</span>}
      <button
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      >
        {copied ? <CheckIcon color="green" /> : <ClipboardCopyIcon />}
      </button>
    </div>
  );
};

export default CopyToClipboard;
