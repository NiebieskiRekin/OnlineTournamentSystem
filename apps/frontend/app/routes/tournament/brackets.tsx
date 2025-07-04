import { Box, CircularProgress, Dialog, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";
import EliminationsBrackets from "~/components/EliminationsBrackets";
import MatchForm from "~/components/MatchForm";
import apiClient from "~/lib/api-client";
import { queryKeys, parseError } from "~/lib/queries";


// const matches = {
//     upper: [
//       {
//         id: 1,
//         name: 'WB R1 M1',
//         nextMatchId: 5,
//         nextLooserMatchId: 8,
//         startTime: null,
//         tournamentRound: 'R1',
//         state: 'WALK_OVER',
//         participants: [
//           {
//             id: 'ddfee063-adde-4192-95d2-203eb2ebb8f7',
//             resultText: '',
//             isWinner: true,
//             status: 'WALK_OVER',
//             name: '#1',
//           },
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: '--------------',
//           },
//         ],
//       },
//       {
//         id: 2,
//         name: 'WB R1 M2',
//         nextMatchId: 5,
//         nextLooserMatchId: 8,
//         startTime: '2021-07-27T15:00:00+00:00',
//         tournamentRound: 'R1',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'b4ecc604-1248-4265-895a-af918e27b6ff',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#5',
//           },
//           {
//             id: '19abab76-3c82-40e9-a334-4f57cb81bd08',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#4',
//           },
//         ],
//       },
//       {
//         id: 3,
//         name: 'WB R1 M3',
//         nextMatchId: 6,
//         nextLooserMatchId: 9,
//         startTime: '2021-07-27T15:00:00+00:00',
//         tournamentRound: 'R1',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ef66d820-1e28-4ef6-81e6-0835b2df5236',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#3',
//           },
//           {
//             id: '4c07d93a-f7e9-4b84-bda3-27c08c689f90',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#6',
//           },
//         ],
//       },
//       {
//         id: 4,
//         name: 'WB R1 M4',
//         nextMatchId: 6,
//         nextLooserMatchId: 9,
//         startTime: null,
//         tournamentRound: 'R1',
//         state: 'WALK_OVER',
//         participants: [
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: '--------------',
//           },
//           {
//             id: '4a05a091-f7b6-4a9a-b6eb-b7ff8ea6dc87',
//             resultText: '',
//             isWinner: true,
//             status: 'WALK_OVER',
//             name: '#2',
//           },
//         ],
//       },
//       {
//         id: 5,
//         name: 'WB R2 M1',
//         nextMatchId: 7,
//         nextLooserMatchId: 11,
//         startTime: '2021-07-27T16:00:00+00:00',
//         tournamentRound: 'R2',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ddfee063-adde-4192-95d2-203eb2ebb8f7',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#1',
//           },
//           {
//             id: 'b4ecc604-1248-4265-895a-af918e27b6ff',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#5',
//           },
//         ],
//       },
//       {
//         id: 6,
//         name: 'WB R2 M2',
//         nextMatchId: 7,
//         nextLooserMatchId: 10,
//         startTime: '2021-07-27T16:00:00+00:00',
//         tournamentRound: 'R2',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ef66d820-1e28-4ef6-81e6-0835b2df5236',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#3',
//           },
//           {
//             id: '4a05a091-f7b6-4a9a-b6eb-b7ff8ea6dc87',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#2',
//           },
//         ],
//       },
//       {
//         id: 7,
//         name: 'WB R3 M1',
//         nextMatchId: 14,
//         nextLooserMatchId: 13,
//         startTime: '2021-07-27T17:00:00+00:00',
//         tournamentRound: 'R3',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ddfee063-adde-4192-95d2-203eb2ebb8f7',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#1',
//           },
//           {
//             id: 'ef66d820-1e28-4ef6-81e6-0835b2df5236',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#3',
//           },
//         ],
//       },
//     ],
//     lower: [
//       {
//         id: 8,
//         name: 'LB R1 M1',
//         nextMatchId: 10,
//         nextLooserMatchId: null,
//         startTime: null,
//         tournamentRound: 'R1',
//         state: 'WALK_OVER',
//         participants: [
//           {
//             id: '19abab76-3c82-40e9-a334-4f57cb81bd08',
//             resultText: '',
//             isWinner: true,
//             status: 'WALK_OVER',
//             name: '#4',
//           },
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: '--------------',
//           },
//         ],
//       },
//       {
//         id: 9,
//         name: 'LB R1 M2',
//         nextMatchId: 11,
//         nextLooserMatchId: null,
//         startTime: null,
//         tournamentRound: 'R1',
//         state: 'WALK_OVER',
//         participants: [
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: '--------------',
//           },
//           {
//             id: '4c07d93a-f7e9-4b84-bda3-27c08c689f90',
//             resultText: '',
//             isWinner: true,
//             status: 'WALK_OVER',
//             name: '#6',
//           },
//         ],
//       },
//       {
//         id: 10,
//         name: 'LB R2 M1',
//         nextMatchId: 12,
//         nextLooserMatchId: null,
//         startTime: '2021-07-27T17:00:00+00:00',
//         tournamentRound: 'R2',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: '4a05a091-f7b6-4a9a-b6eb-b7ff8ea6dc87',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#2',
//           },
//           {
//             id: '19abab76-3c82-40e9-a334-4f57cb81bd08',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#4',
//           },
//         ],
//       },
//       {
//         id: 11,
//         name: 'LB R2 M2',
//         nextMatchId: 12,
//         nextLooserMatchId: null,
//         startTime: '2021-07-27T18:00:00+00:00',
//         tournamentRound: 'R2',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'b4ecc604-1248-4265-895a-af918e27b6ff',
//             resultText: '',
//             isWinner: true,
//             status: 'PLAYED',
//             name: '#5',
//           },
//           {
//             id: '4c07d93a-f7e9-4b84-bda3-27c08c689f90',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#6',
//           },
//         ],
//       },
//       {
//         id: 12,
//         name: 'LB R3 M1',
//         nextMatchId: 13,
//         nextLooserMatchId: null,
//         startTime: null,
//         tournamentRound: 'R3',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: 'TBD',
//           },
//           {
//             id: 'b4ecc604-1248-4265-895a-af918e27b6ff',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#5',
//           },
//         ],
//       },
//       {
//         id: 13,
//         name: 'LB R4 M1',
//         nextMatchId: 14,
//         nextLooserMatchId: null,
//         startTime: null,
//         tournamentRound: 'R4',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ef66d820-1e28-4ef6-81e6-0835b2df5236',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#3',
//           },
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: 'TBD',
//           },
//         ],
//       },
//       {
//         id: 14,
//         name: 'LB R5 M1',
//         nextMatchId: 15,
//         nextLooserMatchId: 15,
//         startTime: null,
//         tournamentRound: 'R5',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: 'ddfee063-adde-4192-95d2-203eb2ebb8f7',
//             resultText: '',
//             isWinner: false,
//             status: 'PLAYED',
//             name: '#1',
//           },
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: 'TBD',
//           },
//         ],
//       },
//       {
//         id: 15,
//         name: 'LB R6 M1',
//         nextMatchId: null,
//         nextLooserMatchId: null,
//         startTime: null,
//         tournamentRound: 'R6',
//         state: 'SCORE_DONE',
//         participants: [
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: 'TBD',
//           },
//           {
//             id: null,
//             resultText: '',
//             isWinner: false,
//             status: null,
//             name: 'TBD',
//           },
//         ],
//       },
//     ],
// };

export default function Bracket(){
  const { id } = useParams();
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [selectedParty, setSelectedParty] = useState<number | null>(null);
  
  
  const { data: matches, isLoading: isLoadingBrackets, error } = useQuery({
    queryKey: queryKeys.LIST_BRACKETS_FOR_TOURNAMENT(id!).queryKey,
    queryFn: async () => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].scoreboard.$get({
            param: {
                id: id!
            }
        })
        if (!response.ok){
          const result = await response.json();
          console.log(result)
          parseError(result)
        }

        if (response.status == 200){
            const result = await response.json();
            return result
          } else {
            throw Error("Something went wrong");
          }
      },
  });

  if (error){
    return <p>Error! {error.message}</p>
  }

  const result = (!isLoadingBrackets && matches) ? (
    <EliminationsBrackets matches={matches.data} 
    onMatchClick={(m)=>{
      setSelectedParty(null)
      setSelectedMatch(Number.parseInt(m.match.id as string))
    }} 
    onPartyClick={(p)=>{
      setSelectedParty(Number.parseInt(p.id as string))
    }} />) : <CircularProgress />;
  return (
    <Box>
      <Typography>
        Selected match: {selectedMatch}
      </Typography>
      <Typography>
        Selected party: {selectedParty}
      </Typography>
      {result}
      
      <Dialog open={selectedMatch!==null && selectedParty!==null}>
        <MatchForm id={selectedMatch!} participant={selectedParty!} onCancel={()=>{
          setSelectedMatch(null)
          setSelectedParty(null)
        }}/>
      </Dialog>
      
    </Box>
  );
}
