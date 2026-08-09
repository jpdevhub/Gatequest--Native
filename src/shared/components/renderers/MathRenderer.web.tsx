import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';

interface MathRendererProps {
  text: string;
}

export default function MathRendererWeb({ text }: MathRendererProps) {
  const [height, setHeight] = useState(40);

  const html = useMemo(() => {
    const safeText = text.replace(/\n/g, '<br/>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
        <style>
          body {
            font-family: -apple-system, system-ui, sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #f1f5f9;
            background-color: transparent;
            margin: 0;
            padding: 0;
            overflow-wrap: break-word;
            line-height: 1.5;
          }
          #content {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;  
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="content">${safeText}</div>
        <script>
          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.getElementById("content"), {
              delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "\\\\[", right: "\\\\]", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\\\(", right: "\\\\)", display: false}
              ],
              throwOnError: false
            });
            setTimeout(() => {
              window.parent.postMessage({ type: 'KATEX_HEIGHT', height: document.body.scrollHeight }, '*');
            }, 100);
          });
        </script>
      </body>
      </html>
    `;
  }, [text]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'KATEX_HEIGHT' && e.data.height) {
        setHeight(e.data.height);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <View style={{ height, minHeight: 40, width: '100%', marginBottom: 12 }}>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
        scrolling="no"
      />
    </View>
  );
}
