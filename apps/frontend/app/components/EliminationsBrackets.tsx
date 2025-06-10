import { DoubleEliminationBracket, Match, SVGViewer, type MatchType } from 'react-tournament-brackets';
import Box from '@mui/material/Box'; // Import Box for container
import { useRef, useState, useEffect } from 'react';

type BracketsType = { upper: MatchType[]; lower: MatchType[] }

export default function EliminationsBrackets({matches, onMatchClick, onPartyClick} : {matches: BracketsType, onMatchClick: (args: {
    match: MatchType;
    topWon: boolean;
    bottomWon: boolean;
}) => void, onPartyClick: (party: ParticipantType, partyWon: boolean) => void}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  
    useEffect(() => {
      const currentElement = containerRef.current;
  
      const measureAndSetDimensions = () => {
        if (currentElement) {
          const newWidth = currentElement.clientWidth;
          const newHeight = currentElement.clientHeight;
  
          setDimensions(prevDimensions => {
            const w = Math.max(newWidth, 1);
            const h = Math.max(newHeight, 1);
  
            if (w !== prevDimensions.width || h !== prevDimensions.height) {
              return { width: w, height: h };
            }
            return prevDimensions; // No change needed
          });
        }
      };
  
      if (!currentElement) {
        return;
      }
  
      measureAndSetDimensions();
  
      const resizeObserver = new ResizeObserver(measureAndSetDimensions);
      resizeObserver.observe(currentElement);
  
      return () => {
        // Check if currentElement was defined before trying to unobserve
        if (currentElement) {
          resizeObserver.unobserve(currentElement);
        }
        resizeObserver.disconnect();
      };
    }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount
  
   return (
    <Box
      ref={containerRef}
      sx={{
        p: 2, // Add some padding around the bracket
        width: '100%', // Take full width of parent (Outlet box)
        height: '100%', // Take full height of parent (Outlet box)
        boxSizing: 'border-box', // Include padding in width/height
        overflow: 'hidden', // SVGViewer (react-svg-pan-zoom) handles its own panning/scrolling
      }}
    >
      {/* Render the bracket only when valid dimensions are available */}
      {dimensions.width > 1 && dimensions.height > 1 && (
        <DoubleEliminationBracket
          matches={matches}
          matchComponent={Match}
          onMatchClick={onMatchClick}
          onPartyClick={onPartyClick}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer width={dimensions.width - 10} height={dimensions.height - 20} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      )}
    </Box>
    )
  }